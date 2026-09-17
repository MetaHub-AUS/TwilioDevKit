using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TwilioDevKit.Simulation
{
    /// <summary>
    /// Builds the JSON the Twilio API would have returned, so the SDK deserializes a real
    /// <c>MessageResource</c> without a request ever leaving the process.
    /// </summary>
    /// <remarks>
    /// Shape and field names follow the Messages resource, including Twilio's RFC-2822 date
    /// format, so calling code that reads <c>DateCreated</c>, <c>NumSegments</c> or
    /// <c>Status</c> behaves identically against a simulated send.
    /// </remarks>
    public static class MessageSimulator
    {
        /// <summary>Generates a Twilio-shaped SID: a two-letter prefix plus 32 hex characters.</summary>
        public static string NewSid(string prefix = "SM")
        {
            var bytes = new byte[16];
#if NET6_0_OR_GREATER
            RandomNumberGenerator.Fill(bytes);
#else
            using (var rng = RandomNumberGenerator.Create()) rng.GetBytes(bytes);
#endif
            var hex = new StringBuilder(32);
            foreach (var b in bytes) hex.Append(b.ToString("x2", CultureInfo.InvariantCulture));
            return prefix + hex;
        }

        /// <summary>Formats a timestamp the way the Twilio API does.</summary>
        public static string FormatDate(DateTimeOffset value) =>
            value.ToUniversalTime().ToString("ddd, dd MMM yyyy HH:mm:ss +0000", CultureInfo.InvariantCulture);

        /// <summary>Everything needed to synthesise one message response.</summary>
        public sealed class SimulatedMessage
        {
            /// <summary>The SID to report.</summary>
            public string Sid { get; set; } = NewSid();

            /// <summary>Account SID to report.</summary>
            public string AccountSid { get; set; } = "AC" + new string('0', 32);

            /// <summary>Recipient as it should appear on the resource.</summary>
            public string? To { get; set; }

            /// <summary>Sender as it should appear on the resource.</summary>
            public string? From { get; set; }

            /// <summary>Messaging Service SID, when used.</summary>
            public string? MessagingServiceSid { get; set; }

            /// <summary>Message body.</summary>
            public string? Body { get; set; }

            /// <summary>Status to report, normally "queued".</summary>
            public string Status { get; set; } = "queued";

            /// <summary>Billable segments.</summary>
            public int NumSegments { get; set; } = 1;

            /// <summary>Attached media count.</summary>
            public int NumMedia { get; set; }

            /// <summary>Error code, when simulating a failure.</summary>
            public int? ErrorCode { get; set; }

            /// <summary>Error message matching <see cref="ErrorCode"/>.</summary>
            public string? ErrorMessage { get; set; }

            /// <summary>Creation timestamp.</summary>
            public DateTimeOffset DateCreated { get; set; } = DateTimeOffset.UtcNow;
        }

        /// <summary>Serialises a simulated message into Twilio's Messages-resource JSON.</summary>
        public static string ToJson(SimulatedMessage message)
        {
            if (message == null) throw new ArgumentNullException(nameof(message));

            var created = FormatDate(message.DateCreated);
            var uri = $"/2010-04-01/Accounts/{message.AccountSid}/Messages/{message.Sid}.json";

            using var stream = new System.IO.MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                writer.WriteStartObject();
                writer.WriteString("sid", message.Sid);
                writer.WriteString("account_sid", message.AccountSid);
                WriteNullable(writer, "messaging_service_sid", message.MessagingServiceSid);
                WriteNullable(writer, "to", message.To);
                WriteNullable(writer, "from", message.From);
                WriteNullable(writer, "body", message.Body);
                writer.WriteString("status", message.Status);
                writer.WriteString("num_segments", message.NumSegments.ToString(CultureInfo.InvariantCulture));
                writer.WriteString("num_media", message.NumMedia.ToString(CultureInfo.InvariantCulture));
                writer.WriteString("direction", "outbound-api");
                writer.WriteString("api_version", "2010-04-01");
                writer.WriteNull("price");
                writer.WriteString("price_unit", "USD");

                if (message.ErrorCode.HasValue) writer.WriteNumber("error_code", message.ErrorCode.Value);
                else writer.WriteNull("error_code");

                WriteNullable(writer, "error_message", message.ErrorMessage);

                writer.WriteString("uri", uri);
                writer.WriteString("date_created", created);
                writer.WriteString("date_updated", created);
                writer.WriteNull("date_sent");

                writer.WriteStartObject("subresource_uris");
                writer.WriteString("media", $"/2010-04-01/Accounts/{message.AccountSid}/Messages/{message.Sid}/Media.json");
                writer.WriteEndObject();

                writer.WriteEndObject();
            }

            return Encoding.UTF8.GetString(stream.ToArray());
        }

        /// <summary>Serialises a Twilio API error payload.</summary>
        public static string ErrorToJson(int code, string message, string moreInfo, int status)
        {
            using var stream = new System.IO.MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                writer.WriteStartObject();
                writer.WriteNumber("code", code);
                writer.WriteString("message", message);
                writer.WriteString("more_info", moreInfo);
                writer.WriteNumber("status", status);
                writer.WriteEndObject();
            }
            return Encoding.UTF8.GetString(stream.ToArray());
        }

        /// <summary>Extracts the SID from a Twilio message response, if present.</summary>
        public static string? ReadSid(string? json) => ReadStringField(json, "sid");

        /// <summary>Extracts the status from a Twilio message response, if present.</summary>
        public static string? ReadStatus(string? json) => ReadStringField(json, "status");

        private static string? ReadStringField(string? json, string field)
        {
            if (string.IsNullOrWhiteSpace(json)) return null;
            try
            {
                using var document = JsonDocument.Parse(json!);
                return document.RootElement.TryGetProperty(field, out var value) && value.ValueKind == JsonValueKind.String
                    ? value.GetString()
                    : null;
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private static void WriteNullable(Utf8JsonWriter writer, string name, string? value)
        {
            if (value == null) writer.WriteNull(name);
            else writer.WriteString(name, value);
        }
    }
}
