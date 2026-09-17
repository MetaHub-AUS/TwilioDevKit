using System;
using System.Collections.Generic;
using TwilioDevKit.Policy;

namespace TwilioDevKit.Recording
{
    /// <summary>One outbound message attempt, as shown on the inspector screen.</summary>
    /// <remarks>
    /// A record is written for <i>every</i> attempt, including ones that never reached
    /// Twilio and ones that failed. That is the point: the screen answers "did we try to
    /// text this person, what did we say, and what came back?" without anyone needing
    /// access to the Twilio console.
    /// </remarks>
    public sealed class SmsRecord
    {
        /// <summary>Stable local identifier, assigned even when Twilio never issued a SID.</summary>
        public string Id { get; set; } = Guid.NewGuid().ToString("N");

        /// <summary>When the application asked for the message to be sent (UTC).</summary>
        public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;

        /// <summary>Twilio message SID, real or simulated.</summary>
        public string? Sid { get; set; }

        /// <summary>Account the message was sent under.</summary>
        public string? AccountSid { get; set; }

        /// <summary>The recipient the application asked for.</summary>
        public string? To { get; set; }

        /// <summary>The recipient actually used, after any mapping or redirect.</summary>
        public string? EffectiveTo { get; set; }

        /// <summary>Sender number, short code, or alphanumeric sender ID.</summary>
        public string? From { get; set; }

        /// <summary>Messaging Service SID, when one was used instead of an explicit sender.</summary>
        public string? MessagingServiceSid { get; set; }

        /// <summary>The message body.</summary>
        public string? Body { get; set; }

        /// <summary>Any media URLs attached to the message.</summary>
        public List<string> MediaUrls { get; set; } = new List<string>();

        /// <summary>Current status: queued, sent, delivered, failed, undelivered, simulated.</summary>
        public string Status { get; set; } = "queued";

        /// <summary>Twilio error code, when the message failed.</summary>
        public int? ErrorCode { get; set; }

        /// <summary>Error message matching <see cref="ErrorCode"/>.</summary>
        public string? ErrorMessage { get; set; }

        /// <summary>The override action applied to this message.</summary>
        public NumberAction Action { get; set; }

        /// <summary>Why that action applied, in plain English.</summary>
        public string? Reason { get; set; }

        /// <summary>The rule that matched, if any.</summary>
        public string? MatchedRule { get; set; }

        /// <summary>True when an HTTP request actually reached Twilio.</summary>
        public bool ReachedTwilio { get; set; }

        /// <summary>Round-trip time for the send call, in milliseconds.</summary>
        public double DurationMs { get; set; }

        /// <summary>The status callback URL the application supplied, if any.</summary>
        public string? StatusCallbackUrl { get; set; }

        /// <summary>Billable segments for the body.</summary>
        public int Segments { get; set; } = 1;

        /// <summary>"GSM-7" or "UCS-2".</summary>
        public string Encoding { get; set; } = "GSM-7";

        /// <summary>The character that forced UCS-2 encoding, when applicable.</summary>
        public string? ForcedUnicodeBy { get; set; }

        /// <summary>Every status this message has passed through, oldest first.</summary>
        public List<StatusChange> History { get; set; } = new List<StatusChange>();

        /// <summary>All parameters posted to Twilio, for the detail pane.</summary>
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();

        /// <summary>One entry in <see cref="History"/>.</summary>
        public sealed class StatusChange
        {
            /// <summary>The status reached.</summary>
            public string Status { get; set; } = string.Empty;

            /// <summary>When it was reached (UTC).</summary>
            public DateTimeOffset At { get; set; } = DateTimeOffset.UtcNow;

            /// <summary>Error code reported with this status, if any.</summary>
            public int? ErrorCode { get; set; }

            /// <summary>Where the update came from: "send", "callback", or "simulator".</summary>
            public string Source { get; set; } = "send";
        }

        /// <summary>True when the message ended in a failure state.</summary>
        public bool IsFailure =>
            string.Equals(Status, "failed", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(Status, "undelivered", StringComparison.OrdinalIgnoreCase);

        /// <summary>Records a status transition and updates <see cref="Status"/>.</summary>
        public void RecordStatus(string status, string source, int? errorCode = null)
        {
            if (string.IsNullOrWhiteSpace(status)) return;

            Status = status;
            if (errorCode.HasValue) ErrorCode = errorCode;

            History.Add(new StatusChange
            {
                Status = status,
                At = DateTimeOffset.UtcNow,
                ErrorCode = errorCode,
                Source = source,
            });
        }

        /// <summary>Returns a copy with numbers and body masked, for redacted mode.</summary>
        public SmsRecord Redacted()
        {
            var copy = (SmsRecord)MemberwiseClone();
            copy.To = E164.Mask(To);
            copy.EffectiveTo = E164.Mask(EffectiveTo);
            copy.From = E164.Mask(From);
            copy.Body = Body == null ? null : $"[redacted, {Body.Length} chars]";
            copy.Parameters = new Dictionary<string, string>();
            return copy;
        }
    }
}
