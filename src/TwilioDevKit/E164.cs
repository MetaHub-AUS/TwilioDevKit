using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace TwilioDevKit
{
    /// <summary>
    /// Small, dependency-free phone-number helpers.
    /// </summary>
    /// <remarks>
    /// This is deliberately not libphonenumber. It only needs to do two jobs well:
    /// normalise whatever a developer types into a config file or the inspector UI
    /// ("0412 345 678", "+61 412 345 678") into a comparable form, and guess a country
    /// so that <c>country:AU</c> rules can match. If your application already has a
    /// canonicalisation routine, normalise before handing numbers to the SDK and this
    /// class effectively becomes a no-op.
    /// </remarks>
    public static class E164
    {
        // Longest-first so that +1242 (Bahamas) is not shadowed by +1 (US).
        private static readonly (string Code, string Country)[] DiallingCodes =
        {
            ("1242", "BS"), ("1246", "BB"), ("1264", "AI"), ("1268", "AG"), ("1284", "VG"),
            ("1345", "KY"), ("1441", "BM"), ("1473", "GD"), ("1649", "TC"), ("1664", "MS"),
            ("1670", "MP"), ("1671", "GU"), ("1684", "AS"), ("1721", "SX"), ("1758", "LC"),
            ("1767", "DM"), ("1784", "VC"), ("1809", "DO"), ("1868", "TT"), ("1869", "KN"),
            ("1876", "JM"),
            ("351", "PT"), ("352", "LU"), ("353", "IE"), ("354", "IS"), ("356", "MT"),
            ("358", "FI"), ("370", "LT"), ("371", "LV"), ("372", "EE"), ("380", "UA"),
            ("385", "HR"), ("386", "SI"), ("420", "CZ"), ("421", "SK"), ("852", "HK"),
            ("886", "TW"), ("966", "SA"), ("971", "AE"), ("972", "IL"),
            ("20", "EG"), ("27", "ZA"), ("30", "GR"), ("31", "NL"), ("32", "BE"),
            ("33", "FR"), ("34", "ES"), ("36", "HU"), ("39", "IT"), ("40", "RO"),
            ("41", "CH"), ("43", "AT"), ("44", "GB"), ("45", "DK"), ("46", "SE"),
            ("47", "NO"), ("48", "PL"), ("49", "DE"), ("51", "PE"), ("52", "MX"),
            ("53", "CU"), ("54", "AR"), ("55", "BR"), ("56", "CL"), ("57", "CO"),
            ("58", "VE"), ("60", "MY"), ("61", "AU"), ("62", "ID"), ("63", "PH"),
            ("64", "NZ"), ("65", "SG"), ("66", "TH"), ("81", "JP"), ("82", "KR"),
            ("84", "VN"), ("86", "CN"), ("90", "TR"), ("91", "IN"), ("92", "PK"),
            ("93", "AF"), ("94", "LK"), ("95", "MM"), ("98", "IR"),
            ("7", "RU"), ("1", "US"),
        };

        /// <summary>National trunk prefixes stripped when a national number is supplied.</summary>
        private static readonly Dictionary<string, string> NationalTrunk = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["AU"] = "0", ["GB"] = "0", ["NZ"] = "0", ["IE"] = "0",
            ["ZA"] = "0", ["IN"] = "0", ["DE"] = "0", ["FR"] = "0",
        };

        private static readonly Dictionary<string, string> CountryToCode = BuildCountryToCode();

        private static Dictionary<string, string> BuildCountryToCode()
        {
            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var (code, country) in DiallingCodes)
            {
                // First occurrence wins so AU maps to 61, not to an NANP territory.
                if (!map.ContainsKey(country)) map[country] = code;
            }
            return map;
        }

        /// <summary>
        /// Normalises a number to E.164-ish form: <c>+</c> followed by digits.
        /// </summary>
        /// <param name="input">Raw input from config, a UI field, or the calling application.</param>
        /// <param name="defaultCountry">ISO-3166 alpha-2 used when <paramref name="input"/> has no leading <c>+</c>.</param>
        /// <returns>The normalised number, or <c>null</c> when there is nothing usable.</returns>
        public static string? Normalize(string? input, string? defaultCountry = null)
        {
            if (string.IsNullOrWhiteSpace(input)) return null;
            var raw = input!.Trim();

            // Alphanumeric sender IDs ("NFAEP", "ACME") are legal Twilio 'from' values but
            // are not numbers. Hand them back untouched so rules can still match on them.
            if (Regex.IsMatch(raw, "[a-zA-Z]") && !Regex.IsMatch(raw, @"^\+?[\d\s().\-]+$"))
                return raw;

            var hadPlus = raw.StartsWith("+", StringComparison.Ordinal) || raw.StartsWith("00", StringComparison.Ordinal);
            if (raw.StartsWith("00", StringComparison.Ordinal)) raw = "+" + raw.Substring(2);

            var digits = new string(raw.Where(char.IsDigit).ToArray());
            if (digits.Length == 0) return null;
            if (hadPlus) return "+" + digits;

            if (!string.IsNullOrWhiteSpace(defaultCountry) &&
                CountryToCode.TryGetValue(defaultCountry!.Trim(), out var cc))
            {
                var national = digits;

                if (NationalTrunk.TryGetValue(defaultCountry.Trim(), out var trunk) &&
                    national.StartsWith(trunk, StringComparison.Ordinal))
                {
                    // National format with a trunk prefix: "0412 345 678" -> "412345678".
                    national = national.Substring(trunk.Length);
                }
                else if (national.StartsWith(cc, StringComparison.Ordinal) &&
                         national.Length - cc.Length >= 6)
                {
                    // Already carries its country code without a '+': "61412345678".
                    // The length guard keeps a genuine national number that merely starts
                    // with the same digits from being truncated.
                    national = national.Substring(cc.Length);
                }

                return "+" + cc + national;
            }

            return "+" + digits;
        }

        /// <summary>Best-effort ISO-3166 alpha-2 country for an E.164 number.</summary>
        public static string? CountryOf(string? number)
        {
            var normalized = Normalize(number);
            if (normalized == null || !normalized.StartsWith("+", StringComparison.Ordinal)) return null;

            var digits = normalized.Substring(1);
            foreach (var (code, country) in DiallingCodes)
            {
                if (digits.StartsWith(code, StringComparison.Ordinal)) return country;
            }
            return null;
        }

        /// <summary>Loose E.164 validity check: <c>+</c> then 7-15 digits, first digit non-zero.</summary>
        public static bool IsValid(string? number) =>
            number != null && Regex.IsMatch(number, @"^\+[1-9]\d{6,14}$");

        /// <summary>Masks the middle of a number for logs and screenshots: <c>+6141****678</c>.</summary>
        public static string Mask(string? value)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            var s = value!;
            if (s.Length <= 7) return s;
            return s.Substring(0, 5) + new string('*', Math.Max(0, s.Length - 8)) + s.Substring(s.Length - 3);
        }
    }
}
