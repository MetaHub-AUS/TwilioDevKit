using System;
using System.Collections.Generic;
using System.Linq;
using TwilioDevKit.Policy;

namespace TwilioDevKit
{
    /// <summary>
    /// Everything the toolkit reads. Bind it from <c>appsettings.{Environment}.json</c>,
    /// environment variables, or build it in code.
    /// </summary>
    /// <remarks>
    /// The defaults are deliberately inert: <see cref="Enabled"/> is <c>false</c>, so adding
    /// the package to an application changes nothing until somebody opts in for an
    /// environment. Nothing here needs to be set in production.
    /// </remarks>
    public sealed class TwilioDevKitOptions
    {
        /// <summary>Configuration section name used by the ASP.NET Core helpers.</summary>
        public const string SectionName = "TwilioDevKit";

        /// <summary>
        /// Master switch. When false every call passes straight through to Twilio and no
        /// messages are recorded - the toolkit is inert. Default <c>false</c>.
        /// </summary>
        public bool Enabled { get; set; }

        /// <summary>
        /// Action applied when no rule matches. Default <see cref="NumberAction.Simulate"/>,
        /// so a half-finished rule list fails safe (nothing is sent) rather than firing real
        /// messages at real people.
        /// </summary>
        public NumberAction DefaultAction { get; set; } = NumberAction.Simulate;

        /// <summary>Ordered override rules; the first match wins.</summary>
        public List<NumberRule> Rules { get; set; } = new List<NumberRule>();

        /// <summary>
        /// Shorthand for "these numbers may receive real messages". Each entry becomes an
        /// <see cref="NumberAction.Allow"/> rule evaluated <i>before</i> <see cref="Rules"/>,
        /// which is the common case: allow my handset, simulate everything else.
        /// </summary>
        public List<string> AllowedNumbers { get; set; } = new List<string>();

        /// <summary>
        /// Country assumed when a number arrives in national format ("0412 345 678").
        /// Leave null to require E.164 everywhere.
        /// </summary>
        public string? DefaultCountry { get; set; }

        /// <summary>
        /// Magic number used by <see cref="NumberAction.MapToTestNumber"/> when a rule does
        /// not name one. Defaults to Twilio's always-valid test number.
        /// </summary>
        public string MapToTestNumber { get; set; } = TwilioTestNumbers.ValidTo;

        /// <summary>Fallback target for <see cref="NumberAction.Redirect"/> rules.</summary>
        public string? RedirectTo { get; set; }

        /// <summary>
        /// When redirecting, prepend "[to +61...]" to the body so the intended recipient is
        /// visible on the handset that actually receives it. Default <c>true</c>.
        /// </summary>
        public bool AnnotateRedirectedBody { get; set; } = true;

        /// <summary>How many messages to keep in the in-memory ring buffer. Default 500.</summary>
        public int MaxRecords { get; set; } = 500;

        /// <summary>
        /// Optional path to a newline-delimited JSON file that records are appended to, so
        /// history survives a restart. Leave null to keep everything in memory.
        /// </summary>
        public string? PersistPath { get; set; }

        /// <summary>
        /// Mask recorded message bodies and numbers. Turn on if the inspector is reachable by
        /// people who should not read message contents. Default <c>false</c>.
        /// </summary>
        public bool RedactRecords { get; set; }

        /// <summary>Settings for simulated delivery status callbacks.</summary>
        public StatusCallbackOptions StatusCallbacks { get; set; } = new StatusCallbackOptions();

        /// <summary>Settings for the inspector screen.</summary>
        public InspectorOptions Inspector { get; set; } = new InspectorOptions();

        /// <summary>
        /// Safety catch. The toolkit refuses to intercept when the hosting environment is
        /// Production unless this is explicitly set to <c>true</c>. Default <c>false</c>.
        /// </summary>
        public bool AllowInProduction { get; set; }

        /// <summary>Simulated delivery-callback behaviour.</summary>
        public sealed class StatusCallbackOptions
        {
            /// <summary>
            /// When a message is simulated and the caller supplied a <c>StatusCallback</c> URL,
            /// POST the lifecycle back to it exactly as Twilio would. This is how you exercise
            /// delivery-receipt handling without sending anything. Default <c>false</c>.
            /// </summary>
            public bool Enabled { get; set; }

            /// <summary>
            /// Statuses to walk through, in order. Left empty by default, which means
            /// queued -> sent -> delivered.
            /// </summary>
            /// <remarks>
            /// This must start empty. <c>IConfiguration.Bind</c> <i>appends</i> to a list that
            /// already holds items rather than replacing it, so seeding the default here would
            /// turn a configured sequence into the default followed by the configured one -
            /// and every message would report its lifecycle twice.
            /// </remarks>
            public List<string> Sequence { get; set; } = new List<string>();

            /// <summary>The sequence actually used, applying the default when none is configured.</summary>
            public IReadOnlyList<string> EffectiveSequence =>
                Sequence != null && Sequence.Count > 0
                    ? Sequence
                    : new List<string> { "queued", "sent", "delivered" };

            /// <summary>Delay in milliseconds between each callback. Default 750.</summary>
            public int DelayMs { get; set; } = 750;

            /// <summary>
            /// Auth token used to sign simulated callbacks with a valid <c>X-Twilio-Signature</c>,
            /// so signature-validating endpoints accept them. Leave null to send unsigned.
            /// </summary>
            public string? SigningAuthToken { get; set; }
        }

        /// <summary>Inspector screen settings.</summary>
        public sealed class InspectorOptions
        {
            /// <summary>Serve the inspector. Default <c>true</c> (still gated by <see cref="Enabled"/>).</summary>
            public bool Enabled { get; set; } = true;

            /// <summary>Base path the screen and its API are mounted on. Default <c>/_twilio</c>.</summary>
            public string Path { get; set; } = "/_twilio";

            /// <summary>
            /// Optional shared secret. When set, requests must present it as
            /// <c>?token=</c> or an <c>X-DevKit-Token</c> header. Recommended whenever the
            /// inspector is reachable from outside localhost.
            /// </summary>
            public string? AccessToken { get; set; }

            /// <summary>
            /// Reject requests that did not come from the loopback interface. Default
            /// <c>false</c>; turn on for shared test environments.
            /// </summary>
            public bool LocalOnly { get; set; }

            /// <summary>
            /// Allow the inspector to change rules at runtime. Turn off to make the screen
            /// read-only. Default <c>true</c>.
            /// </summary>
            public bool AllowRuntimeChanges { get; set; } = true;
        }

        /// <summary>
        /// Rules actually applied, in evaluation order: <see cref="AllowedNumbers"/> first,
        /// then <see cref="Rules"/>.
        /// </summary>
        public IEnumerable<NumberRule> EffectiveRules()
        {
            foreach (var number in AllowedNumbers ?? Enumerable.Empty<string>())
            {
                if (string.IsNullOrWhiteSpace(number)) continue;
                yield return new NumberRule
                {
                    Match = number.Trim(),
                    Action = NumberAction.Allow,
                    Note = "AllowedNumbers",
                };
            }

            foreach (var rule in Rules ?? Enumerable.Empty<NumberRule>())
            {
                if (rule != null && rule.Enabled) yield return rule;
            }
        }

        /// <summary>
        /// Returns configuration problems worth failing fast on. Empty means the options are
        /// coherent.
        /// </summary>
        public IReadOnlyList<string> Validate()
        {
            var problems = new List<string>();

            if (MaxRecords < 1)
                problems.Add($"{nameof(MaxRecords)} must be at least 1.");

            if (DefaultAction == NumberAction.Redirect && string.IsNullOrWhiteSpace(RedirectTo))
                problems.Add($"{nameof(DefaultAction)} is Redirect but {nameof(RedirectTo)} is not set.");

            foreach (var rule in Rules ?? Enumerable.Empty<NumberRule>())
            {
                if (rule == null) continue;

                var patternProblem = NumberMatcher.Validate(rule.Match);
                if (patternProblem != null)
                    problems.Add($"Rule '{rule.Match}': {patternProblem}");

                if (rule.Action == NumberAction.Redirect &&
                    string.IsNullOrWhiteSpace(rule.RedirectTo) &&
                    string.IsNullOrWhiteSpace(RedirectTo))
                {
                    problems.Add($"Rule '{rule.Match}' redirects but neither the rule nor {nameof(RedirectTo)} names a target.");
                }

                if (rule.Action == NumberAction.MapToTestNumber &&
                    rule.MapTo != null &&
                    !TwilioTestNumbers.IsTestNumber(rule.MapTo))
                {
                    problems.Add($"Rule '{rule.Match}' maps to {rule.MapTo}, which is not a Twilio magic test number. " +
                                 "Test credentials will reject it.");
                }
            }

            if (StatusCallbacks != null && StatusCallbacks.DelayMs < 0)
                problems.Add($"{nameof(StatusCallbacks)}.{nameof(StatusCallbackOptions.DelayMs)} must not be negative.");

            return problems;
        }

        /// <summary>Deep-ish copy used when swapping options at runtime.</summary>
        public TwilioDevKitOptions Clone() => new TwilioDevKitOptions
        {
            Enabled = Enabled,
            DefaultAction = DefaultAction,
            Rules = (Rules ?? new List<NumberRule>()).Select(r => new NumberRule
            {
                Match = r.Match, Action = r.Action, MapTo = r.MapTo,
                RedirectTo = r.RedirectTo, ErrorCode = r.ErrorCode, Note = r.Note, Enabled = r.Enabled,
            }).ToList(),
            AllowedNumbers = new List<string>(AllowedNumbers ?? new List<string>()),
            DefaultCountry = DefaultCountry,
            MapToTestNumber = MapToTestNumber,
            RedirectTo = RedirectTo,
            AnnotateRedirectedBody = AnnotateRedirectedBody,
            MaxRecords = MaxRecords,
            PersistPath = PersistPath,
            RedactRecords = RedactRecords,
            AllowInProduction = AllowInProduction,
            StatusCallbacks = new StatusCallbackOptions
            {
                Enabled = StatusCallbacks?.Enabled ?? false,
                Sequence = new List<string>(StatusCallbacks?.Sequence ?? new List<string>()),
                DelayMs = StatusCallbacks?.DelayMs ?? 750,
                SigningAuthToken = StatusCallbacks?.SigningAuthToken,
            },
            Inspector = new InspectorOptions
            {
                Enabled = Inspector?.Enabled ?? true,
                Path = Inspector?.Path ?? "/_twilio",
                AccessToken = Inspector?.AccessToken,
                LocalOnly = Inspector?.LocalOnly ?? false,
                AllowRuntimeChanges = Inspector?.AllowRuntimeChanges ?? true,
            },
        };
    }
}
