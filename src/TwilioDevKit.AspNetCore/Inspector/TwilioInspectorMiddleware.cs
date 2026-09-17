using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Twilio.Clients;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using TwilioDevKit.Policy;
using TwilioDevKit.Recording;

namespace TwilioDevKit.AspNetCore.Inspector
{
    /// <summary>
    /// Serves the inspector screen and its JSON API.
    /// </summary>
    /// <remarks>
    /// Implemented as plain middleware rather than MVC controllers or Razor pages so it
    /// mounts into any ASP.NET Core application regardless of how that application is built,
    /// and needs no views, no static files, and no client build step.
    /// </remarks>
    public sealed class TwilioInspectorMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly TwilioDevKitOptions _options;
        private readonly ISmsRecordStore _store;
        private readonly NumberPolicy _policy;

        private static readonly JsonSerializerOptions Json = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            Converters = { new JsonStringEnumConverter() },
        };

        /// <summary>Creates the middleware.</summary>
        public TwilioInspectorMiddleware(
            RequestDelegate next,
            TwilioDevKitOptions options,
            ISmsRecordStore store,
            NumberPolicy policy)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _options = options ?? throw new ArgumentNullException(nameof(options));
            _store = store ?? throw new ArgumentNullException(nameof(store));
            _policy = policy ?? throw new ArgumentNullException(nameof(policy));
        }

        /// <summary>Handles a request, or passes it along if it is not for the inspector.</summary>
        public async Task InvokeAsync(HttpContext context)
        {
            var basePath = NormalizeBase(_options.Inspector?.Path ?? "/_twilio");
            var path = context.Request.Path.Value ?? string.Empty;

            if (!path.StartsWith(basePath, StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            if (_options.Inspector?.Enabled != true)
            {
                await _next(context);
                return;
            }

            var relative = path.Substring(basePath.Length).TrimEnd('/');
            if (relative.Length == 0) relative = "/";
            if (!relative.StartsWith("/", StringComparison.Ordinal)) relative = "/" + relative;

            // The status webhook is how real Twilio delivery receipts reach the screen, so it
            // is deliberately outside the token/localhost gate: Twilio cannot present either.
            if (relative.Equals("/webhook/status", StringComparison.OrdinalIgnoreCase))
            {
                await HandleStatusWebhookAsync(context);
                return;
            }

            if (!IsAuthorized(context, out var denial))
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                await WriteJsonAsync(context, new { error = denial });
                return;
            }

            var method = context.Request.Method;

            switch (relative.ToLowerInvariant())
            {
                case "/" when IsGet(method):
                    context.Response.ContentType = "text/html; charset=utf-8";
                    await context.Response.WriteAsync(InspectorPage.Html(basePath));
                    return;

                case "/api/messages" when IsGet(method):
                    await HandleListAsync(context);
                    return;

                case "/api/messages" when method == HttpMethods.Delete:
                    RequireRuntimeChanges();
                    _store.Clear();
                    await WriteJsonAsync(context, new { cleared = true });
                    return;

                case "/api/stats" when IsGet(method):
                    await WriteJsonAsync(context, Stats());
                    return;

                case "/api/config" when IsGet(method):
                    await WriteJsonAsync(context, DescribeConfig());
                    return;

                case "/api/config" when method == HttpMethods.Post:
                    await HandleUpdateConfigAsync(context);
                    return;

                case "/api/reference" when IsGet(method):
                    await WriteJsonAsync(context, Reference());
                    return;

                case "/api/preview" when IsGet(method):
                    await HandlePreviewAsync(context);
                    return;

                case "/api/test-send" when method == HttpMethods.Post:
                    await HandleTestSendAsync(context);
                    return;

                case "/api/events" when IsGet(method):
                    await HandleEventStreamAsync(context);
                    return;
            }

            if (relative.StartsWith("/api/messages/", StringComparison.OrdinalIgnoreCase) && IsGet(method))
            {
                var id = relative.Substring("/api/messages/".Length);
                var record = _store.GetById(id);
                if (record == null)
                {
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    await WriteJsonAsync(context, new { error = "No message with that id is still in the buffer." });
                    return;
                }
                await WriteJsonAsync(context, Present(record));
                return;
            }

            context.Response.StatusCode = (int)HttpStatusCode.NotFound;
            await WriteJsonAsync(context, new { error = "Unknown inspector endpoint." });
        }

        // ------------------------------------------------------------------ handlers

        private async Task HandleListAsync(HttpContext context)
        {
            var q = context.Request.Query;
            var query = new SmsRecordQuery
            {
                Search = q["search"].FirstOrDefault(),
                Status = q["status"].FirstOrDefault(),
                Action = q["action"].FirstOrDefault(),
                FailuresOnly = string.Equals(q["failuresOnly"].FirstOrDefault(), "true", StringComparison.OrdinalIgnoreCase),
                Limit = ParseInt(q["limit"].FirstOrDefault(), 100),
                Offset = ParseInt(q["offset"].FirstOrDefault(), 0),
            };

            var records = _store.Query(query).Select(Present).ToList();
            await WriteJsonAsync(context, new { messages = records, stats = Stats() });
        }

        private async Task HandleUpdateConfigAsync(HttpContext context)
        {
            if (_options.Inspector?.AllowRuntimeChanges != true)
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                await WriteJsonAsync(context, new { error = "Runtime changes are disabled for this inspector." });
                return;
            }

            ConfigUpdate? update;
            try
            {
                update = await JsonSerializer.DeserializeAsync<ConfigUpdate>(context.Request.Body, Json);
            }
            catch (JsonException ex)
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                await WriteJsonAsync(context, new { error = "Could not read the request body: " + ex.Message });
                return;
            }

            if (update == null)
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                await WriteJsonAsync(context, new { error = "Empty request body." });
                return;
            }

            var current = _policy.Options;

            // Mutate the live options object so anything holding a reference sees the change.
            if (update.Enabled.HasValue) current.Enabled = update.Enabled.Value;
            if (update.DefaultAction.HasValue) current.DefaultAction = update.DefaultAction.Value;
            if (update.RedirectTo != null) current.RedirectTo = string.IsNullOrWhiteSpace(update.RedirectTo) ? null : update.RedirectTo;
            if (update.DefaultCountry != null) current.DefaultCountry = string.IsNullOrWhiteSpace(update.DefaultCountry) ? null : update.DefaultCountry;

            if (update.Rules != null)
            {
                foreach (var rule in update.Rules)
                {
                    var problem = NumberMatcher.Validate(rule?.Match);
                    if (problem != null)
                    {
                        context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                        await WriteJsonAsync(context, new { error = $"Rule '{rule?.Match}': {problem}" });
                        return;
                    }
                }
                current.Rules = update.Rules.Where(r => r != null).ToList()!;
            }

            if (update.AllowedNumbers != null)
            {
                current.AllowedNumbers = update.AllowedNumbers
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .Select(n => E164.Normalize(n, current.DefaultCountry) ?? n.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }

            _policy.Update(current);
            await WriteJsonAsync(context, DescribeConfig());
        }

        /// <summary>
        /// Explains what would happen to a number without sending anything - the quickest way
        /// to answer "why did that message not go where I expected?".
        /// </summary>
        private async Task HandlePreviewAsync(HttpContext context)
        {
            var to = context.Request.Query["to"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(to))
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                await WriteJsonAsync(context, new { error = "Supply ?to=<number>." });
                return;
            }

            var decision = _policy.Resolve(to);
            await WriteJsonAsync(context, new
            {
                input = to,
                normalized = decision.OriginalTo,
                country = E164.CountryOf(decision.OriginalTo),
                valid = E164.IsValid(decision.OriginalTo),
                action = decision.Action.ToString(),
                effectiveTo = decision.EffectiveTo,
                rewritten = decision.WasRewritten,
                reachesTwilio = decision.ReachesTwilio,
                errorCode = decision.ErrorCode,
                matchedRule = decision.MatchedRule?.ToString(),
                reason = decision.Reason,
            });
        }

        private async Task HandleTestSendAsync(HttpContext context)
        {
            TestSendRequest? request;
            try
            {
                request = await JsonSerializer.DeserializeAsync<TestSendRequest>(context.Request.Body, Json);
            }
            catch (JsonException ex)
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                await WriteJsonAsync(context, new { error = "Could not read the request body: " + ex.Message });
                return;
            }

            if (request == null || string.IsNullOrWhiteSpace(request.To))
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                await WriteJsonAsync(context, new { error = "A 'to' number is required." });
                return;
            }

            var client = context.RequestServices.GetService<ITwilioRestClient>();
            if (client == null)
            {
                context.Response.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
                await WriteJsonAsync(context, new { error = "No ITwilioRestClient is registered in this application." });
                return;
            }

            try
            {
                var message = await MessageResource.CreateAsync(
                    to: new PhoneNumber(request.To),
                    from: string.IsNullOrWhiteSpace(request.From) ? null! : new PhoneNumber(request.From),
                    body: string.IsNullOrWhiteSpace(request.Body) ? "TwilioDevKit test message" : request.Body,
                    statusCallback: string.IsNullOrWhiteSpace(request.StatusCallback) ? null! : new Uri(request.StatusCallback),
                    client: client);

                await WriteJsonAsync(context, new
                {
                    sent = true,
                    sid = message.Sid,
                    status = message.Status?.ToString(),
                    to = message.To,
                });
            }
            catch (Twilio.Exceptions.ApiException ex)
            {
                // A deliberate simulated failure is a successful test, so report it as data
                // rather than as a 500.
                await WriteJsonAsync(context, new
                {
                    sent = false,
                    errorCode = ex.Code,
                    httpStatus = ex.Status,
                    error = ex.Message,
                    moreInfo = ex.MoreInfo,
                });
            }
            catch (Exception ex)
            {
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                await WriteJsonAsync(context, new { sent = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Receives real Twilio status callbacks and attaches them to the matching record, so
        /// delivery outcomes appear on the screen next to the send.
        /// </summary>
        private async Task HandleStatusWebhookAsync(HttpContext context)
        {
            if (!context.Request.HasFormContentType)
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                await context.Response.WriteAsync("Expected a form-encoded Twilio callback.");
                return;
            }

            var form = await context.Request.ReadFormAsync();
            var sid = form["MessageSid"].FirstOrDefault() ?? form["SmsSid"].FirstOrDefault();
            var status = form["MessageStatus"].FirstOrDefault() ?? form["SmsStatus"].FirstOrDefault();
            var errorCode = ParseNullableInt(form["ErrorCode"].FirstOrDefault());

            if (!string.IsNullOrWhiteSpace(sid) && !string.IsNullOrWhiteSpace(status))
            {
                var updated = _store.UpdateBySid(sid!, record =>
                {
                    record.RecordStatus(status!, "callback", errorCode);
                    if (errorCode.HasValue)
                    {
                        record.ErrorMessage = TwilioErrorCatalog.Get(errorCode.Value)?.Render(record.To, record.From)
                                              ?? record.ErrorMessage;
                    }
                });

                if (updated == null)
                {
                    // The message predates this process, or fell out of the ring buffer.
                    _store.Add(new SmsRecord
                    {
                        Sid = sid,
                        To = form["To"].FirstOrDefault(),
                        From = form["From"].FirstOrDefault(),
                        Status = status!,
                        ErrorCode = errorCode,
                        ReachedTwilio = true,
                        Reason = "Status callback arrived for a message this process did not record.",
                        History = { new SmsRecord.StatusChange { Status = status!, Source = "callback", ErrorCode = errorCode } },
                    });
                }
            }

            // Twilio expects 204 with no body, or it retries.
            context.Response.StatusCode = (int)HttpStatusCode.NoContent;
        }

        /// <summary>Streams record changes to the screen so it updates without polling.</summary>
        private async Task HandleEventStreamAsync(HttpContext context)
        {
            context.Response.Headers["Content-Type"] = "text/event-stream";
            context.Response.Headers["Cache-Control"] = "no-cache";
            context.Response.Headers["X-Accel-Buffering"] = "no";

            var queue = new System.Collections.Concurrent.ConcurrentQueue<SmsRecord>();
            var signal = new SemaphoreSlim(0);

            void OnChanged(object? sender, SmsRecord record)
            {
                queue.Enqueue(record);
                try { signal.Release(); } catch (ObjectDisposedException) { }
            }

            _store.RecordChanged += OnChanged;

            try
            {
                await context.Response.WriteAsync(": connected\n\n");
                await context.Response.Body.FlushAsync();

                while (!context.RequestAborted.IsCancellationRequested)
                {
                    // Wake on a new record, or periodically to send a keep-alive comment so
                    // proxies do not close an idle stream.
                    var got = await signal.WaitAsync(TimeSpan.FromSeconds(20), context.RequestAborted);

                    if (!got)
                    {
                        await context.Response.WriteAsync(": keep-alive\n\n");
                        await context.Response.Body.FlushAsync(context.RequestAborted);
                        continue;
                    }

                    while (queue.TryDequeue(out var record))
                    {
                        var payload = JsonSerializer.Serialize(Present(record), Json);
                        await context.Response.WriteAsync($"event: message\ndata: {payload}\n\n", context.RequestAborted);
                    }
                    await context.Response.Body.FlushAsync(context.RequestAborted);
                }
            }
            catch (OperationCanceledException)
            {
                // The browser navigated away; nothing to do.
            }
            finally
            {
                _store.RecordChanged -= OnChanged;
                signal.Dispose();
            }
        }

        // ------------------------------------------------------------------ helpers

        private object Present(SmsRecord record)
        {
            var presented = _options.RedactRecords ? record.Redacted() : record;
            return new
            {
                presented.Id,
                presented.Timestamp,
                presented.Sid,
                presented.To,
                presented.EffectiveTo,
                presented.From,
                presented.Body,
                presented.Status,
                presented.ErrorCode,
                presented.ErrorMessage,
                Action = presented.Action.ToString(),
                presented.Reason,
                presented.MatchedRule,
                presented.ReachedTwilio,
                presented.DurationMs,
                presented.Segments,
                presented.Encoding,
                presented.ForcedUnicodeBy,
                presented.StatusCallbackUrl,
                presented.MessagingServiceSid,
                presented.MediaUrls,
                Rewritten = !string.Equals(presented.To, presented.EffectiveTo, StringComparison.OrdinalIgnoreCase),
                History = presented.History.Select(h => new { h.Status, h.At, h.ErrorCode, h.Source }),
                presented.Parameters,
            };
        }

        private object Stats()
        {
            if (_store is InMemorySmsRecordStore memory) return memory.Stats();
            return new SmsRecordStats { Total = _store.Count };
        }

        private object DescribeConfig()
        {
            var options = _policy.Options;
            return new
            {
                options.Enabled,
                DefaultAction = options.DefaultAction.ToString(),
                options.DefaultCountry,
                options.RedirectTo,
                options.MapToTestNumber,
                options.AllowedNumbers,
                options.MaxRecords,
                options.RedactRecords,
                Rules = options.Rules.Select(r => new
                {
                    r.Match,
                    Action = r.Action.ToString(),
                    r.MapTo,
                    r.RedirectTo,
                    r.ErrorCode,
                    r.Note,
                    r.Enabled,
                }),
                StatusCallbacks = new
                {
                    options.StatusCallbacks.Enabled,
                    options.StatusCallbacks.Sequence,
                    options.StatusCallbacks.DelayMs,
                    Signed = !string.IsNullOrEmpty(options.StatusCallbacks.SigningAuthToken),
                },
                Inspector = new
                {
                    options.Inspector.Path,
                    options.Inspector.AllowRuntimeChanges,
                    options.Inspector.LocalOnly,
                    TokenRequired = !string.IsNullOrEmpty(options.Inspector.AccessToken),
                },
                Problems = options.Validate(),
            };
        }

        private static object Reference() => new
        {
            TestNumbers = TwilioTestNumbers.All.Select(n => new { n.Number, n.Field, n.ErrorCode, n.Description }),
            Errors = TwilioErrorCatalog.All
                .OrderBy(e => e.Code)
                .Select(e => new
                {
                    e.Code,
                    Message = e.MessageTemplate,
                    e.HttpStatus,
                    e.IsDeliveryTime,
                    e.MoreInfo,
                }),
            Actions = Enum.GetNames(typeof(NumberAction)),
        };

        private bool IsAuthorized(HttpContext context, out string denial)
        {
            denial = string.Empty;
            var inspector = _options.Inspector;
            if (inspector == null) return true;

            if (inspector.LocalOnly)
            {
                var remote = context.Connection.RemoteIpAddress;
                var isLocal = remote != null &&
                              (IPAddress.IsLoopback(remote) || remote.Equals(context.Connection.LocalIpAddress));
                if (!isLocal)
                {
                    denial = "The inspector is restricted to local requests.";
                    return false;
                }
            }

            if (!string.IsNullOrEmpty(inspector.AccessToken))
            {
                var supplied = context.Request.Headers["X-DevKit-Token"].FirstOrDefault()
                               ?? context.Request.Query["token"].FirstOrDefault();

                if (!FixedTimeEquals(supplied, inspector.AccessToken!))
                {
                    denial = "A valid inspector token is required.";
                    return false;
                }
            }

            return true;
        }

        private void RequireRuntimeChanges()
        {
            if (_options.Inspector?.AllowRuntimeChanges != true)
                throw new InvalidOperationException("Runtime changes are disabled for this inspector.");
        }

        private static bool FixedTimeEquals(string? supplied, string expected)
        {
            if (supplied == null) return false;
            var a = System.Text.Encoding.UTF8.GetBytes(supplied);
            var b = System.Text.Encoding.UTF8.GetBytes(expected);
            var difference = a.Length ^ b.Length;
            for (var i = 0; i < a.Length && i < b.Length; i++) difference |= a[i] ^ b[i];
            return difference == 0;
        }

        private static bool IsGet(string method) => HttpMethods.IsGet(method);

        private static string NormalizeBase(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return "/_twilio";
            var trimmed = path.Trim();
            if (!trimmed.StartsWith("/", StringComparison.Ordinal)) trimmed = "/" + trimmed;
            return trimmed.TrimEnd('/');
        }

        private static int ParseInt(string? value, int fallback) =>
            int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) ? parsed : fallback;

        private static int? ParseNullableInt(string? value) =>
            int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) ? parsed : (int?)null;

        private static Task WriteJsonAsync(HttpContext context, object payload)
        {
            context.Response.ContentType = "application/json; charset=utf-8";
            return context.Response.WriteAsync(JsonSerializer.Serialize(payload, Json));
        }

        /// <summary>Body of a POST to <c>/api/config</c>.</summary>
        private sealed class ConfigUpdate
        {
            public bool? Enabled { get; set; }
            public NumberAction? DefaultAction { get; set; }
            public string? RedirectTo { get; set; }
            public string? DefaultCountry { get; set; }
            public List<NumberRule>? Rules { get; set; }
            public List<string>? AllowedNumbers { get; set; }
        }

        /// <summary>Body of a POST to <c>/api/test-send</c>.</summary>
        private sealed class TestSendRequest
        {
            public string? To { get; set; }
            public string? From { get; set; }
            public string? Body { get; set; }
            public string? StatusCallback { get; set; }
        }
    }
}
