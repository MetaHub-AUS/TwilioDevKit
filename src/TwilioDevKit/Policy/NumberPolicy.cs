using System;
using System.Linq;
using System.Threading;

namespace TwilioDevKit.Policy
{
    /// <summary>
    /// Decides what happens to a message based on its recipient.
    /// </summary>
    /// <remarks>
    /// Options are swapped atomically, so the inspector can add an allow-rule while requests
    /// are in flight without locking the send path.
    /// </remarks>
    public sealed class NumberPolicy
    {
        private TwilioDevKitOptions _options;

        /// <summary>Creates a policy over the supplied options.</summary>
        public NumberPolicy(TwilioDevKitOptions options)
        {
            _options = options ?? throw new ArgumentNullException(nameof(options));
        }

        /// <summary>The options currently in force.</summary>
        public TwilioDevKitOptions Options => Volatile.Read(ref _options);

        /// <summary>Replaces the options in force. Used by the inspector's runtime edits.</summary>
        public void Update(TwilioDevKitOptions options)
        {
            if (options == null) throw new ArgumentNullException(nameof(options));
            Volatile.Write(ref _options, options);
        }

        /// <summary>
        /// Applies the rules to one recipient.
        /// </summary>
        /// <param name="to">The recipient the application asked for.</param>
        /// <returns>A decision that always carries a usable <see cref="PolicyDecision.EffectiveTo"/>.</returns>
        public PolicyDecision Resolve(string? to)
        {
            var options = Options;
            var normalizedTo = E164.Normalize(to, options.DefaultCountry) ?? to;

            if (!options.Enabled)
            {
                return new PolicyDecision
                {
                    Action = NumberAction.Allow,
                    OriginalTo = normalizedTo,
                    EffectiveTo = normalizedTo,
                    Reason = "TwilioDevKit is disabled; the request passes through untouched.",
                };
            }

            var matched = options.EffectiveRules()
                .FirstOrDefault(rule => NumberMatcher.IsMatch(rule.Match, normalizedTo, options.DefaultCountry));

            var action = matched?.Action ?? options.DefaultAction;
            var reason = matched != null
                ? $"Rule '{matched.Match}' matched{(string.IsNullOrWhiteSpace(matched.Note) ? "" : $" ({matched.Note})")}."
                : $"No rule matched; the default action ({options.DefaultAction}) applied.";

            var decision = new PolicyDecision
            {
                Action = action,
                OriginalTo = normalizedTo,
                EffectiveTo = normalizedTo,
                MatchedRule = matched,
                Reason = reason,
            };

            switch (action)
            {
                case NumberAction.MapToTestNumber:
                {
                    var target = E164.Normalize(matched?.MapTo, options.DefaultCountry)
                                 ?? E164.Normalize(options.MapToTestNumber, options.DefaultCountry)
                                 ?? TwilioTestNumbers.ValidTo;
                    decision.EffectiveTo = target;
                    decision.Reason += $" Rewritten to the magic test number {target} so test credentials accept it.";
                    break;
                }

                case NumberAction.Redirect:
                {
                    var target = E164.Normalize(matched?.RedirectTo, options.DefaultCountry)
                                 ?? E164.Normalize(options.RedirectTo, options.DefaultCountry);
                    if (string.IsNullOrWhiteSpace(target))
                    {
                        // Misconfigured redirect: fail safe by simulating rather than
                        // letting the message reach its real recipient.
                        decision.Action = NumberAction.Simulate;
                        decision.Reason += " No redirect target was configured, so the message was simulated instead of sent.";
                    }
                    else
                    {
                        decision.EffectiveTo = target;
                        decision.Reason += $" Redirected to {target}.";
                    }
                    break;
                }

                case NumberAction.Fail:
                {
                    decision.ErrorCode = matched?.ErrorCode ?? 21211;
                    var info = TwilioErrorCatalog.GetOrGeneric(decision.ErrorCode.Value);
                    decision.Reason += info.IsDeliveryTime
                        ? $" Simulating delivery-time failure {decision.ErrorCode} on the status callback."
                        : $" Simulating send-time failure {decision.ErrorCode}.";
                    break;
                }

                case NumberAction.Allow:
                    decision.Reason += " Sending for real.";
                    break;

                case NumberAction.Simulate:
                    decision.Reason += " Simulated; Twilio is not contacted.";
                    break;
            }

            return decision;
        }
    }
}
