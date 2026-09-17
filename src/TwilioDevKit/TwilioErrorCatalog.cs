using System;
using System.Collections.Generic;
using System.Globalization;

namespace TwilioDevKit
{
    /// <summary>
    /// Twilio error codes this toolkit can reproduce, with the message, HTTP status and
    /// documentation link Twilio itself returns.
    /// </summary>
    /// <remarks>
    /// Two families matter and they behave very differently:
    /// <list type="bullet">
    ///   <item><description><b>2xxxx codes</b> are rejected at <i>send</i> time - the REST call
    ///   fails and the SDK throws. Your calling code sees an exception.</description></item>
    ///   <item><description><b>3xxxx codes</b> happen at <i>delivery</i> time - the REST call
    ///   succeeds, and the failure arrives later on the status callback with
    ///   <c>MessageStatus=failed|undelivered</c>. Code that only try/catches the send never
    ///   sees these, which is exactly why they are worth simulating.</description></item>
    /// </list>
    /// </remarks>
    public static class TwilioErrorCatalog
    {
        /// <summary>A reproducible Twilio error.</summary>
        public sealed class TwilioErrorInfo
        {
            /// <summary>Twilio error code, e.g. 21211.</summary>
            public int Code { get; set; }

            /// <summary>Message template; <c>{to}</c> and <c>{from}</c> are substituted.</summary>
            public string MessageTemplate { get; set; } = string.Empty;

            /// <summary>HTTP status Twilio returns alongside the error.</summary>
            public int HttpStatus { get; set; } = 400;

            /// <summary>
            /// True when the error surfaces on a delivery status callback rather than
            /// failing the REST call.
            /// </summary>
            public bool IsDeliveryTime { get; set; }

            /// <summary>Twilio documentation URL for the code.</summary>
            public string MoreInfo => "https://www.twilio.com/docs/errors/" + Code.ToString(CultureInfo.InvariantCulture);

            /// <summary>Fills <c>{to}</c>/<c>{from}</c> placeholders in the template.</summary>
            public string Render(string? to, string? from) =>
                MessageTemplate
                    .Replace("{to}", to ?? "(none)")
                    .Replace("{from}", from ?? "(none)");
        }

        private static readonly Dictionary<int, TwilioErrorInfo> Catalog = new Dictionary<int, TwilioErrorInfo>
        {
            // ---- Send-time failures: the REST call throws ----
            [21211] = new TwilioErrorInfo { Code = 21211, HttpStatus = 400, MessageTemplate = "The 'To' number {to} is not a valid phone number." },
            [21212] = new TwilioErrorInfo { Code = 21212, HttpStatus = 400, MessageTemplate = "The 'From' number {from} is not a valid phone number, shortcode, or alphanumeric sender ID." },
            [21408] = new TwilioErrorInfo { Code = 21408, HttpStatus = 400, MessageTemplate = "Permission to send an SMS has not been enabled for the region indicated by the 'To' number {to}." },
            [21606] = new TwilioErrorInfo { Code = 21606, HttpStatus = 400, MessageTemplate = "The 'From' phone number {from} is not a valid, SMS-capable inbound phone number or short code for your account." },
            [21610] = new TwilioErrorInfo { Code = 21610, HttpStatus = 400, MessageTemplate = "Attempt to send to unsubscribed recipient {to}." },
            [21611] = new TwilioErrorInfo { Code = 21611, HttpStatus = 429, MessageTemplate = "This 'From' number {from} has exceeded the maximum number of queued messages." },
            [21612] = new TwilioErrorInfo { Code = 21612, HttpStatus = 400, MessageTemplate = "The 'To' phone number {to} is not currently reachable via SMS." },
            [21614] = new TwilioErrorInfo { Code = 21614, HttpStatus = 400, MessageTemplate = "'To' number {to} is not a valid mobile number." },
            [20003] = new TwilioErrorInfo { Code = 20003, HttpStatus = 401, MessageTemplate = "Authentication Error - invalid username or password." },
            [20429] = new TwilioErrorInfo { Code = 20429, HttpStatus = 429, MessageTemplate = "Too Many Requests - your account is being rate limited." },

            // ---- Delivery-time failures: the REST call succeeds, the callback reports failure ----
            [30003] = new TwilioErrorInfo { Code = 30003, HttpStatus = 400, IsDeliveryTime = true, MessageTemplate = "Unreachable destination handset." },
            [30004] = new TwilioErrorInfo { Code = 30004, HttpStatus = 400, IsDeliveryTime = true, MessageTemplate = "Message blocked by the carrier or the recipient." },
            [30005] = new TwilioErrorInfo { Code = 30005, HttpStatus = 400, IsDeliveryTime = true, MessageTemplate = "Unknown destination handset." },
            [30006] = new TwilioErrorInfo { Code = 30006, HttpStatus = 400, IsDeliveryTime = true, MessageTemplate = "Landline or unreachable carrier." },
            [30007] = new TwilioErrorInfo { Code = 30007, HttpStatus = 400, IsDeliveryTime = true, MessageTemplate = "Message filtered as spam by the carrier." },
            [30008] = new TwilioErrorInfo { Code = 30008, HttpStatus = 400, IsDeliveryTime = true, MessageTemplate = "Unknown error - the carrier gave no reason." },
        };

        /// <summary>Every error this toolkit can reproduce, for the inspector's picker.</summary>
        public static IReadOnlyCollection<TwilioErrorInfo> All => Catalog.Values;

        /// <summary>Looks up an error, or <c>null</c> when the code is not in the catalog.</summary>
        public static TwilioErrorInfo? Get(int code) =>
            Catalog.TryGetValue(code, out var info) ? info : null;

        /// <summary>
        /// Looks up an error, falling back to a generic entry so an unknown code still
        /// produces a well-formed Twilio-shaped failure rather than throwing.
        /// </summary>
        public static TwilioErrorInfo GetOrGeneric(int code) =>
            Get(code) ?? new TwilioErrorInfo
            {
                Code = code,
                HttpStatus = 400,
                MessageTemplate = "Simulated Twilio failure (error " + code.ToString(CultureInfo.InvariantCulture) + ").",
            };

        /// <summary>True when the code is reported on a status callback rather than at send time.</summary>
        public static bool IsDeliveryTime(int code) => Get(code)?.IsDeliveryTime ?? false;
    }
}
