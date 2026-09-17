using TwilioDevKit.Policy;
using Xunit;

namespace TwilioDevKit.Tests
{
    public class E164Tests
    {
        [Theory]
        [InlineData("+61412345678", null, "+61412345678")]
        [InlineData("+61 412 345 678", null, "+61412345678")]
        [InlineData("(04) 1234 5678", "AU", "+61412345678")]
        [InlineData("0412 345 678", "AU", "+61412345678")]
        [InlineData("0061412345678", null, "+61412345678")]
        [InlineData("61412345678", "AU", "+61412345678")]
        [InlineData("+1 (415) 555-0123", null, "+14155550123")]
        public void Normalizes_the_formats_people_actually_type(string input, string? country, string expected)
        {
            Assert.Equal(expected, E164.Normalize(input, country));
        }

        [Fact]
        public void Alphanumeric_sender_ids_survive_normalisation()
        {
            // "NFAEP" is a legal Twilio sender ID, not a number to be mangled.
            Assert.Equal("NFAEP", E164.Normalize("NFAEP"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Empty_input_normalises_to_null(string? input) => Assert.Null(E164.Normalize(input));

        [Theory]
        [InlineData("+61412345678", "AU")]
        [InlineData("+14155550123", "US")]
        [InlineData("+15005550006", "US")]
        [InlineData("+442071838750", "GB")]
        [InlineData("+6421555123", "NZ")]
        public void Identifies_the_country(string number, string expected) =>
            Assert.Equal(expected, E164.CountryOf(number));

        [Fact]
        public void Masking_keeps_enough_to_recognise_a_number_without_exposing_it()
        {
            var masked = E164.Mask("+61412345678");
            Assert.StartsWith("+6141", masked);
            Assert.EndsWith("678", masked);
            Assert.DoesNotContain("2345", masked);
        }

        [Theory]
        [InlineData("+61412345678", true)]
        [InlineData("+1", false)]
        [InlineData("61412345678", false)]
        [InlineData("+0412345678", false)]
        public void Validates_e164_shape(string number, bool expected) =>
            Assert.Equal(expected, E164.IsValid(number));
    }

    public class NumberMatcherTests
    {
        [Theory]
        [InlineData("*", "+61412345678", true)]
        [InlineData("+61412345678", "+61412345678", true)]
        [InlineData("+61412345678", "+61499999999", false)]
        [InlineData("+614*", "+61412345678", true)]
        [InlineData("+613*", "+61412345678", false)]
        [InlineData("country:AU", "+61412345678", true)]
        [InlineData("country:US", "+61412345678", false)]
        [InlineData(@"regex:^\+614\d{8}$", "+61412345678", true)]
        [InlineData(@"regex:^\+613\d{8}$", "+61412345678", false)]
        public void Matches_each_supported_pattern_form(string pattern, string number, bool expected) =>
            Assert.Equal(expected, NumberMatcher.IsMatch(pattern, number));

        [Fact]
        public void Exact_patterns_match_across_formats()
        {
            // A rule written as a national number still matches an E.164 send.
            Assert.True(NumberMatcher.IsMatch("0412 345 678", "+61412345678", "AU"));
        }

        [Fact]
        public void A_broken_regex_never_matches_instead_of_throwing()
        {
            // A typo in config must not take the application down on every send.
            Assert.False(NumberMatcher.IsMatch("regex:[unclosed", "+61412345678"));
            Assert.NotNull(NumberMatcher.Validate("regex:[unclosed"));
        }

        [Fact]
        public void Validate_accepts_the_documented_forms()
        {
            Assert.Null(NumberMatcher.Validate("*"));
            Assert.Null(NumberMatcher.Validate("+614*"));
            Assert.Null(NumberMatcher.Validate("country:AU"));
            Assert.Null(NumberMatcher.Validate(@"regex:^\+614\d{8}$"));
            Assert.NotNull(NumberMatcher.Validate("country:Australia"));
            Assert.NotNull(NumberMatcher.Validate(""));
        }
    }

    public class NumberPolicyTests
    {
        private static NumberPolicy PolicyWith(params NumberRule[] rules)
        {
            var options = new TwilioDevKitOptions { Enabled = true, DefaultAction = NumberAction.Simulate };
            options.Rules.AddRange(rules);
            return new NumberPolicy(options);
        }

        [Fact]
        public void First_matching_rule_wins()
        {
            var policy = PolicyWith(
                new NumberRule { Match = "+61412345678", Action = NumberAction.Allow },
                new NumberRule { Match = "country:AU", Action = NumberAction.Fail });

            Assert.Equal(NumberAction.Allow, policy.Resolve("+61412345678").Action);
            Assert.Equal(NumberAction.Fail, policy.Resolve("+61499999999").Action);
        }

        [Fact]
        public void Disabled_rules_are_skipped()
        {
            var policy = PolicyWith(new NumberRule { Match = "*", Action = NumberAction.Allow, Enabled = false });
            Assert.Equal(NumberAction.Simulate, policy.Resolve("+61412345678").Action);
        }

        [Fact]
        public void Mapping_reports_both_the_requested_and_the_effective_recipient()
        {
            var policy = PolicyWith(new NumberRule { Match = "*", Action = NumberAction.MapToTestNumber });
            var decision = policy.Resolve("+61412345678");

            Assert.Equal("+61412345678", decision.OriginalTo);
            Assert.Equal(TwilioTestNumbers.ValidTo, decision.EffectiveTo);
            Assert.True(decision.WasRewritten);
            Assert.True(decision.ReachesTwilio);
        }

        [Fact]
        public void Rules_can_be_replaced_at_runtime()
        {
            var policy = PolicyWith(new NumberRule { Match = "*", Action = NumberAction.Simulate });
            Assert.Equal(NumberAction.Simulate, policy.Resolve("+61412345678").Action);

            var updated = policy.Options.Clone();
            updated.Rules.Clear();
            updated.Rules.Add(new NumberRule { Match = "*", Action = NumberAction.Allow });
            policy.Update(updated);

            Assert.Equal(NumberAction.Allow, policy.Resolve("+61412345678").Action);
        }

        [Fact]
        public void A_disabled_toolkit_always_passes_through()
        {
            var policy = new NumberPolicy(new TwilioDevKitOptions { Enabled = false, DefaultAction = NumberAction.Fail });
            var decision = policy.Resolve("+61412345678");

            Assert.Equal(NumberAction.Allow, decision.Action);
            Assert.False(decision.WasRewritten);
        }
    }
}
