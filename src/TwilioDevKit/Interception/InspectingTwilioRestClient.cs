using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Twilio.Clients;
using Twilio.Exceptions;
using Twilio.Http;
using TwilioDevKit.Policy;
using TwilioDevKit.Recording;
using TwilioDevKit.Simulation;

namespace TwilioDevKit.Interception
{
    /// <summary>
    /// An <see cref="ITwilioRestClient"/> that sits in front of the real one: it applies the
    /// number-override rules to outbound messages and records every attempt.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This is the whole integration surface. Every Twilio SDK call takes an
    /// <see cref="ITwilioRestClient"/>, so replacing the registered client changes behaviour
    /// everywhere without touching a single call site - no wrapper service to adopt, no
    /// <c>MessageResource.Create</c> to find and rewrite, and nothing to undo later.
    /// </para>
    /// <para>
    /// Only <c>POST .../Messages.json</c> is touched. Every other request - fetches, lookups,
    /// calls, verify - is forwarded untouched.
    /// </para>
    /// </remarks>
    public sealed class InspectingTwilioRestClient : ITwilioRestClient
    {
        private readonly ITwilioRestClient? _inner;
        private readonly NumberPolicy _policy;
        private readonly ISmsRecordStore _store;
        private readonly IStatusCallbackSender? _callbackSender;
        private readonly Action<string, Exception?>? _log;

        /// <summary>Creates an intercepting client.</summary>
        /// <param name="inner">
        /// The real client. May be null when nothing should ever reach Twilio - in that case
        /// actions that would send are downgraded to simulation rather than throwing.
        /// </param>
        /// <param name="policy">The override rules to apply.</param>
        /// <param name="store">Where message records are written.</param>
        /// <param name="callbackSender">Optional sender for simulated delivery receipts.</param>
        /// <param name="log">Optional log sink.</param>
        public InspectingTwilioRestClient(
            ITwilioRestClient? inner,
            NumberPolicy policy,
            ISmsRecordStore store,
            IStatusCallbackSender? callbackSender = null,
            Action<string, Exception?>? log = null)
        {
            _inner = inner;
            _policy = policy ?? throw new ArgumentNullException(nameof(policy));
            _store = store ?? throw new ArgumentNullException(nameof(store));
            _callbackSender = callbackSender;
            _log = log;
        }

        /// <inheritdoc />
        public string AccountSid => _inner?.AccountSid ?? SimulatedAccountSid;

        /// <inheritdoc />
        public string Region => _inner?.Region!;

        /// <inheritdoc />
        public Twilio.Http.HttpClient HttpClient => _inner?.HttpClient!;

        private const string SimulatedAccountSid = "ACsimulated00000000000000000000000";

        /// <inheritdoc />
        public Response Request(Request request)
        {
            if (!IsMessageCreate(request)) return Forward(request);

            var send = Begin(request);
            if (send.ShortCircuit != null) return send.ShortCircuit;

            var stopwatch = Stopwatch.StartNew();
            try
            {
                var response = Forward(request);
                CompleteFromTwilio(send, response, stopwatch);
                return response;
            }
            catch (Exception ex)
            {
                CompleteFromException(send, ex, stopwatch);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<Response> RequestAsync(Request request)
        {
            if (!IsMessageCreate(request)) return await ForwardAsync(request).ConfigureAwait(false);

            var send = Begin(request);
            if (send.ShortCircuit != null) return send.ShortCircuit;

            var stopwatch = Stopwatch.StartNew();
            try
            {
                var response = await ForwardAsync(request).ConfigureAwait(false);
                CompleteFromTwilio(send, response, stopwatch);
                return response;
            }
            catch (Exception ex)
            {
                CompleteFromException(send, ex, stopwatch);
                throw;
            }
        }

        // ---------------------------------------------------------------- pipeline

        /// <summary>State carried between the start and end of one intercepted send.</summary>
        private sealed class PendingSend
        {
            public SmsRecord Record { get; set; } = new SmsRecord();
            public PolicyDecision Decision { get; set; } = new PolicyDecision();
            public string? StatusCallbackUrl { get; set; }

            /// <summary>Set when the message never reaches Twilio; this response is returned as-is.</summary>
            public Response? ShortCircuit { get; set; }
        }

        /// <summary>
        /// Reads the outgoing request, decides what to do with it, rewrites it if needed and
        /// opens a record. Returns with <see cref="PendingSend.ShortCircuit"/> set when the
        /// message is handled entirely locally.
        /// </summary>
        private PendingSend Begin(Request request)
        {
            var parameters = request.PostParams ?? new List<KeyValuePair<string, string>>();
            var to = GetParam(parameters, "To");
            var from = GetParam(parameters, "From");
            var body = GetParam(parameters, "Body");
            var messagingServiceSid = GetParam(parameters, "MessagingServiceSid");
            var statusCallback = GetParam(parameters, "StatusCallback");
            var mediaUrls = parameters
                .Where(p => string.Equals(p.Key, "MediaUrl", StringComparison.OrdinalIgnoreCase))
                .Select(p => p.Value)
                .ToList();

            var decision = _policy.Resolve(to);
            var segments = SegmentCalculator.Measure(body);

            var record = new SmsRecord
            {
                To = decision.OriginalTo ?? to,
                EffectiveTo = decision.EffectiveTo ?? to,
                From = from,
                MessagingServiceSid = messagingServiceSid,
                Body = body,
                MediaUrls = mediaUrls,
                Action = decision.Action,
                Reason = decision.Reason,
                MatchedRule = decision.MatchedRule?.ToString(),
                AccountSid = AccountSid,
                StatusCallbackUrl = statusCallback,
                Segments = segments.Segments,
                Encoding = segments.Encoding,
                ForcedUnicodeBy = segments.ForcedUnicodeBy,
                Parameters = parameters
                    .GroupBy(p => p.Key, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => string.Join(", ", g.Select(x => x.Value)), StringComparer.OrdinalIgnoreCase),
            };

            var send = new PendingSend
            {
                Record = record,
                Decision = decision,
                StatusCallbackUrl = statusCallback,
            };

            var action = decision.Action;

            // Nothing to send through: downgrade anything that would hit the network.
            if (_inner == null && decision.ReachesTwilio)
            {
                action = NumberAction.Simulate;
                record.Action = action;
                record.Reason = decision.Reason +
                    " No live Twilio client is registered, so the message was simulated instead.";
            }

            switch (action)
            {
                case NumberAction.Simulate:
                    send.ShortCircuit = ShortCircuitSimulated(send, segments.Segments, mediaUrls.Count);
                    break;

                case NumberAction.Fail:
                    send.ShortCircuit = ShortCircuitFailed(send, segments.Segments, mediaUrls.Count);
                    break;

                case NumberAction.MapToTestNumber:
                case NumberAction.Redirect:
                    RewriteRecipient(request, decision, action);
                    record.EffectiveTo = decision.EffectiveTo;
                    record.Body = GetParam(request.PostParams, "Body");
                    record.ReachedTwilio = true;
                    break;

                case NumberAction.Allow:
                    record.ReachedTwilio = true;
                    break;
            }

            return send;
        }

        /// <summary>Rewrites the recipient on the outgoing request.</summary>
        private void RewriteRecipient(Request request, PolicyDecision decision, NumberAction action)
        {
            var parameters = request.PostParams;
            if (parameters == null || string.IsNullOrWhiteSpace(decision.EffectiveTo)) return;

            SetParam(parameters, "To", decision.EffectiveTo!);

            if (action == NumberAction.Redirect &&
                _policy.Options.AnnotateRedirectedBody &&
                !string.IsNullOrWhiteSpace(decision.OriginalTo))
            {
                var body = GetParam(parameters, "Body");
                // Prepending keeps the intended recipient visible on the handset that
                // actually receives the message, so a shared QA phone stays readable.
                SetParam(parameters, "Body", $"[to {decision.OriginalTo}] {body}");
            }
        }

        /// <summary>Builds the response for a message that is never sent.</summary>
        private Response ShortCircuitSimulated(PendingSend send, int segments, int mediaCount)
        {
            var record = send.Record;
            var simulated = new MessageSimulator.SimulatedMessage
            {
                Sid = MessageSimulator.NewSid(),
                AccountSid = AccountSid,
                To = record.EffectiveTo,
                From = record.From,
                MessagingServiceSid = record.MessagingServiceSid,
                Body = record.Body,
                Status = "queued",
                NumSegments = segments,
                NumMedia = mediaCount,
            };

            record.Sid = simulated.Sid;
            record.ReachedTwilio = false;
            record.RecordStatus("queued", "send");
            _store.Add(record);

            ScheduleCallbacks(send, finalErrorCode: null);

            return new Response(HttpStatusCode.Created, MessageSimulator.ToJson(simulated));
        }

        /// <summary>
        /// Builds the outcome for a deliberately failed message. Send-time errors throw the
        /// way the real SDK does; delivery-time errors succeed here and fail on the callback.
        /// </summary>
        private Response ShortCircuitFailed(PendingSend send, int segments, int mediaCount)
        {
            var record = send.Record;
            var code = send.Decision.ErrorCode ?? 21211;
            var error = TwilioErrorCatalog.GetOrGeneric(code);
            var message = error.Render(record.To, record.From);

            record.ReachedTwilio = false;
            record.ErrorCode = code;
            record.ErrorMessage = message;

            if (error.IsDeliveryTime)
            {
                // Twilio accepts the message, then reports the failure asynchronously.
                var simulated = new MessageSimulator.SimulatedMessage
                {
                    Sid = MessageSimulator.NewSid(),
                    AccountSid = AccountSid,
                    To = record.EffectiveTo,
                    From = record.From,
                    MessagingServiceSid = record.MessagingServiceSid,
                    Body = record.Body,
                    Status = "queued",
                    NumSegments = segments,
                    NumMedia = mediaCount,
                };

                record.Sid = simulated.Sid;
                record.RecordStatus("queued", "send");
                _store.Add(record);

                ScheduleCallbacks(send, finalErrorCode: code);
                return new Response(HttpStatusCode.Created, MessageSimulator.ToJson(simulated));
            }

            record.RecordStatus("failed", "send", code);
            _store.Add(record);

            // The concrete Twilio client is what raises ApiException on an error response -
            // the resource layer does not inspect status codes - so raise it here to match.
            throw new ApiException(
                code: code,
                status: error.HttpStatus,
                message: message,
                moreInfo: error.MoreInfo);
        }

        /// <summary>Records the outcome of a message that really went to Twilio.</summary>
        private void CompleteFromTwilio(PendingSend send, Response response, Stopwatch stopwatch)
        {
            stopwatch.Stop();
            var record = send.Record;
            record.DurationMs = stopwatch.Elapsed.TotalMilliseconds;
            record.ReachedTwilio = true;

            var content = response?.Content;
            record.Sid = MessageSimulator.ReadSid(content) ?? record.Sid;
            record.RecordStatus(MessageSimulator.ReadStatus(content) ?? "queued", "send");

            _store.Add(record);
        }

        /// <summary>Records a message whose send threw.</summary>
        private void CompleteFromException(PendingSend send, Exception exception, Stopwatch stopwatch)
        {
            stopwatch.Stop();
            var record = send.Record;
            record.DurationMs = stopwatch.Elapsed.TotalMilliseconds;
            record.ReachedTwilio = true;
            record.ErrorMessage = exception.Message;

            if (exception is ApiException api) record.ErrorCode = api.Code;

            record.RecordStatus("failed", "send", record.ErrorCode);
            _store.Add(record);
        }

        private void ScheduleCallbacks(PendingSend send, int? finalErrorCode)
        {
            var options = _policy.Options.StatusCallbacks;
            if (_callbackSender == null || options == null || !options.Enabled) return;
            if (string.IsNullOrWhiteSpace(send.StatusCallbackUrl)) return;

            _callbackSender.Schedule(
                send.Record,
                send.StatusCallbackUrl!,
                options.EffectiveSequence,
                options.DelayMs,
                finalErrorCode);
        }

        // ---------------------------------------------------------------- plumbing

        private Response Forward(Request request)
        {
            if (_inner == null) throw new ApiException("TwilioDevKit has no live Twilio client to forward this request to.");
            return _inner.Request(request);
        }

        private Task<Response> ForwardAsync(Request request)
        {
            if (_inner == null) throw new ApiException("TwilioDevKit has no live Twilio client to forward this request to.");
            return _inner.RequestAsync(request);
        }

        /// <summary>True only for a request that creates an SMS.</summary>
        private static bool IsMessageCreate(Request request)
        {
            if (request == null) return false;
            if (!string.Equals(request.Method?.ToString(), "POST", StringComparison.OrdinalIgnoreCase)) return false;

            var path = request.Uri?.AbsolutePath;
            if (string.IsNullOrEmpty(path)) return false;

            // Creating a message posts to /Messages.json; posting to
            // /Messages/{Sid}.json updates or redacts an existing one, which we leave alone.
            return path!.EndsWith("/Messages.json", StringComparison.OrdinalIgnoreCase);
        }

        private static string? GetParam(IList<KeyValuePair<string, string>>? parameters, string key) =>
            parameters?.FirstOrDefault(p => string.Equals(p.Key, key, StringComparison.OrdinalIgnoreCase)).Value;

        private static void SetParam(IList<KeyValuePair<string, string>> parameters, string key, string value)
        {
            for (var i = 0; i < parameters.Count; i++)
            {
                if (string.Equals(parameters[i].Key, key, StringComparison.OrdinalIgnoreCase))
                {
                    parameters[i] = new KeyValuePair<string, string>(parameters[i].Key, value);
                    return;
                }
            }
            parameters.Add(new KeyValuePair<string, string>(key, value));
        }
    }
}
