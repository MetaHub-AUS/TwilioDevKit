using System;
using System.Collections.Generic;
using System.Linq;

namespace TwilioDevKit
{
    /// <summary>
    /// The fixed "magic" numbers Twilio accepts when you authenticate with
    /// <b>test credentials</b>, and what each one provokes.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This class exists because of the exact problem this toolkit solves: with test
    /// credentials Twilio only accepts this handful of numbers, so you cannot point a
    /// test at a real handset, a staging fixture, or a customer number from a bug report.
    /// <see cref="Policy.NumberAction.MapToTestNumber"/> lets any number be tested by rewriting
    /// it onto one of these on the way out, while the record keeps the number the
    /// application actually asked for.
    /// </para>
    /// <para>
    /// Values are taken from Twilio's published test-credential documentation. They change
    /// rarely, but they are Twilio's to change - re-check
    /// https://www.twilio.com/docs/iam/test-credentials if a mapped send behaves oddly.
    /// </para>
    /// </remarks>
    public static class TwilioTestNumbers
    {
        /// <summary>A valid, SMS-capable magic number. Sends succeed. The usual mapping target.</summary>
        public const string ValidTo = "+15005550006";

        /// <summary>A valid magic 'from' number owned by the test account.</summary>
        public const string ValidFrom = "+15005550006";

        /// <summary>Magic 'to' that Twilio rejects as an invalid number (error 21211).</summary>
        public const string InvalidTo = "+15005550001";

        /// <summary>Magic 'to' that Twilio cannot route to (error 21612).</summary>
        public const string UnrouteableTo = "+15005550002";

        /// <summary>Magic 'to' in a region the account lacks permission for (error 21408).</summary>
        public const string InternationalPermissionsTo = "+15005550003";

        /// <summary>Magic 'to' that is blocked / has unsubscribed (error 21610).</summary>
        public const string BlockedTo = "+15005550004";

        /// <summary>Magic 'to' that is not SMS-capable, e.g. a landline (error 21614).</summary>
        public const string NotSmsCapableTo = "+15005550009";

        /// <summary>Magic 'from' that Twilio rejects as invalid (error 21212).</summary>
        public const string InvalidFrom = "+15005550001";

        /// <summary>Magic 'from' the account does not own / is not SMS-capable (error 21606).</summary>
        public const string NotOwnedFrom = "+15005550007";

        /// <summary>Magic 'from' whose queue is full (error 21611).</summary>
        public const string QueueFullFrom = "+15005550008";

        /// <summary>Describes one magic number.</summary>
        public sealed class TestNumberInfo
        {
            /// <summary>The magic number in E.164 form.</summary>
            public string Number { get; set; } = string.Empty;

            /// <summary>Whether it is used as a 'to' or a 'from' value.</summary>
            public string Field { get; set; } = "to";

            /// <summary>Twilio error code provoked, or <c>null</c> when the send succeeds.</summary>
            public int? ErrorCode { get; set; }

            /// <summary>Human-readable summary for the inspector UI.</summary>
            public string Description { get; set; } = string.Empty;
        }

        private static readonly TestNumberInfo[] AllNumbers =
        {
            new TestNumberInfo { Number = ValidTo,                     Field = "to",   ErrorCode = null,  Description = "Valid and SMS-capable - the send succeeds." },
            new TestNumberInfo { Number = InvalidTo,                   Field = "to",   ErrorCode = 21211, Description = "Invalid 'to' number." },
            new TestNumberInfo { Number = UnrouteableTo,               Field = "to",   ErrorCode = 21612, Description = "Not currently reachable via SMS." },
            new TestNumberInfo { Number = InternationalPermissionsTo,  Field = "to",   ErrorCode = 21408, Description = "Account lacks permission for that region." },
            new TestNumberInfo { Number = BlockedTo,                   Field = "to",   ErrorCode = 21610, Description = "Recipient has unsubscribed / is blocked." },
            new TestNumberInfo { Number = NotSmsCapableTo,             Field = "to",   ErrorCode = 21614, Description = "Not a valid mobile number (landline)." },
            new TestNumberInfo { Number = InvalidFrom,                 Field = "from", ErrorCode = 21212, Description = "Invalid 'from' number." },
            new TestNumberInfo { Number = NotOwnedFrom,                Field = "from", ErrorCode = 21606, Description = "'From' not owned by the account / not SMS-capable." },
            new TestNumberInfo { Number = QueueFullFrom,               Field = "from", ErrorCode = 21611, Description = "'From' number's message queue is full." },
        };

        /// <summary>Every magic number, for display in the inspector UI.</summary>
        public static IReadOnlyList<TestNumberInfo> All => AllNumbers;

        /// <summary>True when <paramref name="number"/> is one of Twilio's magic test numbers.</summary>
        public static bool IsTestNumber(string? number)
        {
            var normalized = E164.Normalize(number);
            return normalized != null &&
                   AllNumbers.Any(n => string.Equals(n.Number, normalized, StringComparison.Ordinal));
        }

        /// <summary>
        /// The magic number that provokes <paramref name="errorCode"/>, or <c>null</c> if no
        /// magic number produces that error at send time.
        /// </summary>
        public static string? ForErrorCode(int errorCode) =>
            AllNumbers.FirstOrDefault(n => n.ErrorCode == errorCode)?.Number;

        /// <summary>Looks up the description of a magic number.</summary>
        public static TestNumberInfo? Describe(string? number)
        {
            var normalized = E164.Normalize(number);
            if (normalized == null) return null;
            return AllNumbers.FirstOrDefault(n => string.Equals(n.Number, normalized, StringComparison.Ordinal));
        }
    }
}
