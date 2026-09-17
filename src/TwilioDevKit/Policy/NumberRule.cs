using System;

namespace TwilioDevKit.Policy
{
    /// <summary>
    /// One entry in the override list: "numbers matching <see cref="Match"/> get
    /// <see cref="Action"/>". Rules are evaluated in order and the first match wins.
    /// </summary>
    /// <remarks>
    /// Supported <see cref="Match"/> forms:
    /// <list type="table">
    ///   <item><term><c>+61412345678</c></term><description>Exact number, compared after normalisation.</description></item>
    ///   <item><term><c>+614*</c></term><description>Prefix wildcard.</description></item>
    ///   <item><term><c>country:AU</c></term><description>Every number in that country.</description></item>
    ///   <item><term><c>regex:^\+614\d{8}$</c></term><description>Full regular expression.</description></item>
    ///   <item><term><c>*</c></term><description>Catch-all.</description></item>
    /// </list>
    /// </remarks>
    public sealed class NumberRule
    {
        /// <summary>The pattern this rule matches. See the type remarks for the supported forms.</summary>
        public string Match { get; set; } = "*";

        /// <summary>What to do when the rule matches.</summary>
        public NumberAction Action { get; set; } = NumberAction.Simulate;

        /// <summary>
        /// For <see cref="NumberAction.MapToTestNumber"/>: the magic number to rewrite to.
        /// Defaults to <see cref="TwilioTestNumbers.ValidTo"/> when not set.
        /// </summary>
        public string? MapTo { get; set; }

        /// <summary>
        /// For <see cref="NumberAction.Redirect"/>: the number to send to instead.
        /// Falls back to <see cref="TwilioDevKitOptions.RedirectTo"/> when not set.
        /// </summary>
        public string? RedirectTo { get; set; }

        /// <summary>
        /// For <see cref="NumberAction.Fail"/>: the Twilio error code to raise.
        /// Defaults to 21211 ("invalid 'To' number") when not set.
        /// </summary>
        public int? ErrorCode { get; set; }

        /// <summary>Free-text note shown in the inspector, e.g. "Ben's QA handset".</summary>
        public string? Note { get; set; }

        /// <summary>Set false to keep a rule in configuration without applying it.</summary>
        public bool Enabled { get; set; } = true;

        /// <summary>Short description used in decision reasons and the inspector UI.</summary>
        public override string ToString() =>
            Match + " -> " + Action + (string.IsNullOrWhiteSpace(Note) ? string.Empty : " (" + Note + ")");
    }
}
