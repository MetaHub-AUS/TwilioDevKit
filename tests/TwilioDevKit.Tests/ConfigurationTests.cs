using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Configuration;
using TwilioDevKit.Policy;
using Xunit;

namespace TwilioDevKit.Tests
{
    /// <summary>Guards the way options bind from <c>appsettings.json</c>.</summary>
    public class ConfigurationTests
    {
        private static TwilioDevKitOptions Bind(Dictionary<string, string?> values)
        {
            var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();
            var options = new TwilioDevKitOptions();
            configuration.GetSection(TwilioDevKitOptions.SectionName).Bind(options);
            return options;
        }

        [Fact]
        public void Configured_callback_sequence_replaces_the_default_instead_of_appending_to_it()
        {
            // IConfiguration.Bind appends to a list that already holds items. A seeded
            // default here would produce queued,sent,delivered,queued,sent,delivered and
            // every message would report its whole lifecycle twice.
            var options = Bind(new Dictionary<string, string?>
            {
                ["TwilioDevKit:StatusCallbacks:Sequence:0"] = "queued",
                ["TwilioDevKit:StatusCallbacks:Sequence:1"] = "sent",
                ["TwilioDevKit:StatusCallbacks:Sequence:2"] = "delivered",
            });

            Assert.Equal(new[] { "queued", "sent", "delivered" }, options.StatusCallbacks.EffectiveSequence);
        }

        [Fact]
        public void Unconfigured_callback_sequence_falls_back_to_the_standard_lifecycle()
        {
            var options = new TwilioDevKitOptions();
            Assert.Empty(options.StatusCallbacks.Sequence);
            Assert.Equal(new[] { "queued", "sent", "delivered" }, options.StatusCallbacks.EffectiveSequence);
        }

        [Fact]
        public void Rules_and_allowed_numbers_bind_in_order()
        {
            var options = Bind(new Dictionary<string, string?>
            {
                ["TwilioDevKit:Enabled"] = "true",
                ["TwilioDevKit:DefaultAction"] = "Simulate",
                ["TwilioDevKit:AllowedNumbers:0"] = "+61412345678",
                ["TwilioDevKit:Rules:0:Match"] = "+61411111111",
                ["TwilioDevKit:Rules:0:Action"] = "Fail",
                ["TwilioDevKit:Rules:0:ErrorCode"] = "21610",
                ["TwilioDevKit:Rules:1:Match"] = "country:AU",
                ["TwilioDevKit:Rules:1:Action"] = "MapToTestNumber",
            });

            Assert.True(options.Enabled);
            Assert.Equal(2, options.Rules.Count);
            Assert.Equal(NumberAction.Fail, options.Rules[0].Action);
            Assert.Equal(21610, options.Rules[0].ErrorCode);

            // Allowed numbers are evaluated before the rule list.
            var effective = options.EffectiveRules().ToList();
            Assert.Equal(3, effective.Count);
            Assert.Equal(NumberAction.Allow, effective[0].Action);
            Assert.Equal("+61412345678", effective[0].Match);
        }

        [Fact]
        public void Validate_flags_a_map_target_that_is_not_a_magic_number()
        {
            var options = new TwilioDevKitOptions();
            options.Rules.Add(new NumberRule
            {
                Match = "*",
                Action = NumberAction.MapToTestNumber,
                MapTo = "+61499999999",
            });

            var problems = options.Validate();
            Assert.Contains(problems, p => p.Contains("not a Twilio magic test number"));
        }

        [Fact]
        public void Validate_flags_a_redirect_with_no_target_and_a_broken_regex()
        {
            var options = new TwilioDevKitOptions { DefaultAction = NumberAction.Redirect };
            options.Rules.Add(new NumberRule { Match = "regex:[unclosed", Action = NumberAction.Simulate });

            var problems = options.Validate();
            Assert.Contains(problems, p => p.Contains("RedirectTo"));
            Assert.Contains(problems, p => p.Contains("Invalid regular expression"));
        }
    }
}
