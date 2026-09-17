using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using TwilioDevKit.Recording;

namespace TwilioDevKit.Simulation
{
    /// <summary>
    /// Posts simulated delivery receipts back to the application over HTTP.
    /// </summary>
    /// <remarks>
    /// This closes a real gap in SMS testing. Delivery outcomes arrive asynchronously on a
    /// webhook, so code that handles "delivered" or "failed" normally cannot be exercised
    /// without sending a real message and waiting for a carrier. Here the whole lifecycle is
    /// replayed locally, optionally signed with a valid <c>X-Twilio-Signature</c> so
    /// signature-validating endpoints accept it.
    /// </remarks>
    public sealed class HttpStatusCallbackSender : IStatusCallbackSender
    {
        private static readonly HttpClient SharedClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };

        private readonly HttpClient _httpClient;
        private readonly ISmsRecordStore _store;
        private readonly string? _signingAuthToken;
        private readonly Action<string, Exception?>? _log;

        /// <summary>Creates a sender.</summary>
        /// <param name="store">Store updated as each simulated status is delivered.</param>
        /// <param name="signingAuthToken">Auth token to sign callbacks with, or null to send unsigned.</param>
        /// <param name="httpClient">HTTP client to use; a shared default is used when null.</param>
        /// <param name="log">Optional log sink, called with a message and an optional exception.</param>
        public HttpStatusCallbackSender(
            ISmsRecordStore store,
            string? signingAuthToken = null,
            HttpClient? httpClient = null,
            Action<string, Exception?>? log = null)
        {
            _store = store ?? throw new ArgumentNullException(nameof(store));
            _signingAuthToken = signingAuthToken;
            _httpClient = httpClient ?? SharedClient;
            _log = log;
        }

        /// <inheritdoc />
        public void Schedule(
            SmsRecord record,
            string callbackUrl,
            IReadOnlyList<string> sequence,
            int delayMs,
            int? finalErrorCode)
        {
            if (record == null || string.IsNullOrWhiteSpace(callbackUrl)) return;
            if (sequence == null || sequence.Count == 0) return;

            // Fire and forget: a simulated delivery receipt must never block or fail a send.
            _ = Task.Run(() => WalkAsync(record, callbackUrl, sequence, delayMs, finalErrorCode));
        }

        private async Task WalkAsync(
            SmsRecord record,
            string callbackUrl,
            IReadOnlyList<string> sequence,
            int delayMs,
            int? finalErrorCode)
        {
            try
            {
                for (var i = 0; i < sequence.Count; i++)
                {
                    if (delayMs > 0) await Task.Delay(delayMs).ConfigureAwait(false);

                    var isFinal = i == sequence.Count - 1;
                    var status = sequence[i];
                    int? errorCode = null;

                    if (isFinal && finalErrorCode.HasValue)
                    {
                        // A delivery-time failure replaces the terminal status.
                        status = finalErrorCode.Value == 30008 ? "undelivered" : "failed";
                        errorCode = finalErrorCode;
                    }

                    if (!string.IsNullOrEmpty(record.Sid))
                    {
                        _store.UpdateBySid(record.Sid!, r => r.RecordStatus(status, "simulator", errorCode));
                    }

                    await PostAsync(record, callbackUrl, status, errorCode).ConfigureAwait(false);
                }
            }
            catch (Exception ex)
            {
                _log?.Invoke($"TwilioDevKit: simulated status callback to {callbackUrl} failed.", ex);
            }
        }

        private async Task PostAsync(SmsRecord record, string callbackUrl, string status, int? errorCode)
        {
            var parameters = new List<KeyValuePair<string, string>>
            {
                new KeyValuePair<string, string>("MessageSid", record.Sid ?? string.Empty),
                new KeyValuePair<string, string>("MessageStatus", status),
                new KeyValuePair<string, string>("SmsSid", record.Sid ?? string.Empty),
                new KeyValuePair<string, string>("SmsStatus", status),
                new KeyValuePair<string, string>("AccountSid", record.AccountSid ?? string.Empty),
                new KeyValuePair<string, string>("To", record.EffectiveTo ?? record.To ?? string.Empty),
                new KeyValuePair<string, string>("From", record.From ?? string.Empty),
            };

            if (errorCode.HasValue)
            {
                parameters.Add(new KeyValuePair<string, string>(
                    "ErrorCode", errorCode.Value.ToString(CultureInfo.InvariantCulture)));
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, callbackUrl)
            {
                Content = new FormUrlEncodedContent(parameters),
            };

            request.Headers.TryAddWithoutValidation("User-Agent", "TwilioProxy/1.1 (TwilioDevKit simulated)");
            request.Headers.TryAddWithoutValidation("X-TwilioDevKit-Simulated", "true");

            if (!string.IsNullOrEmpty(_signingAuthToken))
            {
                var signature = TwilioSignature.Compute(_signingAuthToken!, callbackUrl, parameters);
                request.Headers.TryAddWithoutValidation("X-Twilio-Signature", signature);
            }

            using var response = await _httpClient.SendAsync(request).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                _log?.Invoke(
                    $"TwilioDevKit: simulated '{status}' callback to {callbackUrl} returned {(int)response.StatusCode}.",
                    null);
            }
        }
    }
}
