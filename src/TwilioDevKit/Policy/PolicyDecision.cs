namespace TwilioDevKit.Policy
{
    /// <summary>The outcome of evaluating the override rules for one outbound message.</summary>
    public sealed class PolicyDecision
    {
        /// <summary>What to do with the message.</summary>
        public NumberAction Action { get; set; }

        /// <summary>The recipient the application asked for.</summary>
        public string? OriginalTo { get; set; }

        /// <summary>
        /// The recipient actually used on the wire. Differs from <see cref="OriginalTo"/>
        /// only for <see cref="NumberAction.MapToTestNumber"/> and <see cref="NumberAction.Redirect"/>.
        /// </summary>
        public string? EffectiveTo { get; set; }

        /// <summary>Error code to raise, for <see cref="NumberAction.Fail"/>.</summary>
        public int? ErrorCode { get; set; }

        /// <summary>The rule that matched, or <c>null</c> when the default action applied.</summary>
        public NumberRule? MatchedRule { get; set; }

        /// <summary>Plain-English explanation, shown in the inspector and in logs.</summary>
        public string Reason { get; set; } = string.Empty;

        /// <summary>True when the recipient was changed on the way out.</summary>
        public bool WasRewritten =>
            !string.IsNullOrEmpty(EffectiveTo) &&
            !string.Equals(OriginalTo, EffectiveTo, System.StringComparison.OrdinalIgnoreCase);

        /// <summary>True when this decision results in a real HTTP call to Twilio.</summary>
        public bool ReachesTwilio =>
            Action == NumberAction.Allow ||
            Action == NumberAction.MapToTestNumber ||
            Action == NumberAction.Redirect;
    }
}
