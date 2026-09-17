using System;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace TwilioDevKit.Policy
{
    /// <summary>Evaluates a <see cref="NumberRule.Match"/> pattern against a phone number.</summary>
    public static class NumberMatcher
    {
        private const string CountryPrefix = "country:";
        private const string RegexPrefix = "regex:";

        // Compiling a regex is expensive and rule sets are small and stable; cache them.
        private static readonly ConcurrentDictionary<string, Regex> RegexCache =
            new ConcurrentDictionary<string, Regex>(StringComparer.Ordinal);

        /// <summary>
        /// True when <paramref name="number"/> matches <paramref name="pattern"/>.
        /// </summary>
        /// <param name="pattern">A pattern in one of the forms documented on <see cref="NumberRule"/>.</param>
        /// <param name="number">The number under test; normalised before comparison.</param>
        /// <param name="defaultCountry">Country assumed for national-format numbers.</param>
        public static bool IsMatch(string? pattern, string? number, string? defaultCountry = null)
        {
            if (string.IsNullOrWhiteSpace(pattern)) return false;
            var p = pattern!.Trim();

            if (p == "*") return true;
            if (string.IsNullOrWhiteSpace(number)) return false;

            var normalized = E164.Normalize(number, defaultCountry) ?? number!.Trim();

            if (p.StartsWith(CountryPrefix, StringComparison.OrdinalIgnoreCase))
            {
                var wanted = p.Substring(CountryPrefix.Length).Trim();
                var actual = E164.CountryOf(normalized);
                return actual != null && string.Equals(actual, wanted, StringComparison.OrdinalIgnoreCase);
            }

            if (p.StartsWith(RegexPrefix, StringComparison.OrdinalIgnoreCase))
            {
                var expression = p.Substring(RegexPrefix.Length);
                if (string.IsNullOrWhiteSpace(expression)) return false;
                try
                {
                    var regex = RegexCache.GetOrAdd(expression, e =>
                        new Regex(e, RegexOptions.CultureInvariant, TimeSpan.FromMilliseconds(250)));
                    return regex.IsMatch(normalized);
                }
                catch (ArgumentException)
                {
                    // A malformed pattern in config must not take the application down;
                    // it simply never matches. The inspector surfaces invalid rules.
                    return false;
                }
                catch (RegexMatchTimeoutException)
                {
                    return false;
                }
            }

            if (p.EndsWith("*", StringComparison.Ordinal))
            {
                var prefix = E164.Normalize(p.Substring(0, p.Length - 1), defaultCountry)
                             ?? p.Substring(0, p.Length - 1);
                return normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase);
            }

            var exact = E164.Normalize(p, defaultCountry) ?? p;
            return string.Equals(normalized, exact, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Validates a pattern, returning a human-readable problem or <c>null</c> when it is fine.
        /// Used by the inspector to reject bad input before it reaches the rule list.
        /// </summary>
        public static string? Validate(string? pattern)
        {
            if (string.IsNullOrWhiteSpace(pattern)) return "Pattern must not be empty.";
            var p = pattern!.Trim();

            if (p.StartsWith(RegexPrefix, StringComparison.OrdinalIgnoreCase))
            {
                var expression = p.Substring(RegexPrefix.Length);
                if (string.IsNullOrWhiteSpace(expression)) return "regex: pattern is empty.";
                try { _ = new Regex(expression); }
                catch (ArgumentException ex) { return "Invalid regular expression: " + ex.Message; }
                return null;
            }

            if (p.StartsWith(CountryPrefix, StringComparison.OrdinalIgnoreCase))
            {
                var wanted = p.Substring(CountryPrefix.Length).Trim();
                return wanted.Length == 2
                    ? null
                    : "country: expects a two-letter ISO country code, e.g. country:AU.";
            }

            return null;
        }
    }
}
