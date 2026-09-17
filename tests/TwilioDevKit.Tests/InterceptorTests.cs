using System;
using System.Linq;
using System.Threading.Tasks;
using Twilio.Exceptions;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using TwilioDevKit.Interception;
using TwilioDevKit.Policy;
using TwilioDevKit.Recording;
using Xunit;

namespace TwilioDevKit.Tests
{
    /// <summary>
    /// Exercises the interceptor through the real Twilio SDK entry point that applications
    /// use - <c>MessageResource.CreateAsync</c> - so these tests prove the integration, not
    /// just the internals.
    /// </summary>
    public class InterceptorTests
    {
        private static (InspectingTwilioRestClient Client, RecordingTwilioClient Inner, InMemorySmsRecordStore Store)
            Build(TwilioDevKitOptions options, bool withInner = true)
        {
            var inner = new RecordingTwilioClient();
            var store = new InMemorySmsRecordStore(options.MaxRecords);
            var client = new InspectingTwilioRestClient(withInner ? inner : null, new NumberPolicy(options), store);
            return (client, inner, store);
        }

        private static TwilioDevKitOptions Enabled(NumberAction defaultAction = NumberAction.Simulate) =>
            new TwilioDevKitOptions { Enabled = true, DefaultAction = defaultAction };

        [Fact]
        public async Task Simulated_send_never_reaches_twilio_but_still_returns_a_usable_message()
        {
            var (client, inner, store) = Build(Enabled());

            var message = await MessageResource.CreateAsync(
                to: new PhoneNumber("+61412345678"),
                from: new PhoneNumber("+61400000000"),
                body: "Inspection due Tuesday",
                client: client);

            Assert.Empty(inner.Requests);
            Assert.StartsWith("SM", message.Sid);
            Assert.Equal("queued", message.Status.ToString());
            Assert.Equal("+61412345678", message.To);

            var record = Assert.Single(store.Query(new SmsRecordQuery()));
            Assert.False(record.ReachedTwilio);
            Assert.Equal(NumberAction.Simulate, record.Action);
            Assert.Equal("Inspection due Tuesday", record.Body);
        }

        [Fact]
        public async Task Any_number_can_be_tested_by_mapping_it_onto_a_magic_test_number()
        {
            // The headline case: test credentials reject +61412345678, so rewrite it on the
            // way out while keeping the real recipient in the record.
            var options = Enabled();
            options.Rules.Add(new NumberRule { Match = "country:AU", Action = NumberAction.MapToTestNumber });
            var (client, inner, store) = Build(options);

            var message = await MessageResource.CreateAsync(
                to: new PhoneNumber("+61412345678"),
                from: new PhoneNumber("+61400000000"),
                body: "hello",
                client: client);

            // Twilio saw the magic number...
            Assert.Single(inner.Requests);
            Assert.Equal(TwilioTestNumbers.ValidTo, inner.LastParam("To"));

            // ...while the record remembers who we were really trying to reach.
            var record = Assert.Single(store.Query(new SmsRecordQuery()));
            Assert.Equal("+61412345678", record.To);
            Assert.Equal(TwilioTestNumbers.ValidTo, record.EffectiveTo);
            Assert.True(record.ReachedTwilio);
            Assert.NotNull(message.Sid);
        }

        [Fact]
        public async Task Allowed_numbers_are_sent_for_real_and_untouched()
        {
            var options = Enabled();
            options.AllowedNumbers.Add("+61412345678");
            var (client, inner, store) = Build(options);

            await MessageResource.CreateAsync(
                to: new PhoneNumber("+61412345678"),
                from: new PhoneNumber("+61400000000"),
                body: "real one",
                client: client);

            Assert.Equal("+61412345678", inner.LastParam("To"));
            Assert.Equal("real one", inner.LastParam("Body"));

            var record = Assert.Single(store.Query(new SmsRecordQuery()));
            Assert.Equal(NumberAction.Allow, record.Action);
            Assert.True(record.ReachedTwilio);
        }

        [Fact]
        public async Task Allow_rules_are_evaluated_before_the_general_rule_list()
        {
            var options = Enabled();
            options.AllowedNumbers.Add("+61412345678");
            options.Rules.Add(new NumberRule { Match = "*", Action = NumberAction.Simulate });
            var (client, inner, _) = Build(options);

            await MessageResource.CreateAsync(
                to: new PhoneNumber("+61412345678"), from: new PhoneNumber("+61400000000"),
                body: "x", client: client);

            Assert.Single(inner.Requests);
        }

        [Fact]
        public async Task Redirect_sends_to_the_safe_number_and_labels_the_body()
        {
            var options = Enabled(NumberAction.Redirect);
            options.RedirectTo = "+61499999999";
            var (client, inner, store) = Build(options);

            await MessageResource.CreateAsync(
                to: new PhoneNumber("+61412345678"),
                from: new PhoneNumber("+61400000000"),
                body: "Your inspection is due",
                client: client);

            Assert.Equal("+61499999999", inner.LastParam("To"));
            Assert.Equal("[to +61412345678] Your inspection is due", inner.LastParam("Body"));

            var record = Assert.Single(store.Query(new SmsRecordQuery()));
            Assert.Equal("+61412345678", record.To);
            Assert.Equal("+61499999999", record.EffectiveTo);
        }

        [Fact]
        public async Task Redirect_without_a_target_simulates_rather_than_sending_to_the_real_recipient()
        {
            // A misconfigured redirect must never fall through to the real number.
            var options = Enabled(NumberAction.Redirect);
            var (client, inner, store) = Build(options);

            await MessageResource.CreateAsync(
                to: new PhoneNumber("+61412345678"), from: new PhoneNumber("+61400000000"),
                body: "x", client: client);

            Assert.Empty(inner.Requests);
            Assert.False(Assert.Single(store.Query(new SmsRecordQuery())).ReachedTwilio);
        }

        [Fact]
        public async Task Forced_failures_throw_the_same_exception_the_real_sdk_throws()
        {
            var options = Enabled();
            options.Rules.Add(new NumberRule
            {
                Match = "+61411111111",
                Action = NumberAction.Fail,
                ErrorCode = 21610,
                Note = "unsubscribed recipient",
            });
            var (client, inner, store) = Build(options);

            var ex = await Assert.ThrowsAsync<ApiException>(() => MessageResource.CreateAsync(
                to: new PhoneNumber("+61411111111"), from: new PhoneNumber("+61400000000"),
                body: "x", client: client));

            Assert.Equal(21610, ex.Code);
            Assert.Equal(400, ex.Status);
            Assert.Contains("unsubscribed", ex.Message, StringComparison.OrdinalIgnoreCase);
            Assert.Empty(inner.Requests);

            var record = Assert.Single(store.Query(new SmsRecordQuery()));
            Assert.Equal("failed", record.Status);
            Assert.Equal(21610, record.ErrorCode);
        }

        [Fact]
        public async Task Delivery_time_failures_succeed_at_send_time_like_the_real_api()
        {
            // 30xxx codes are reported on the status callback, not by the REST call. Code
            // that only try/catches the send must still see a success here.
            var options = Enabled();
            options.Rules.Add(new NumberRule { Match = "*", Action = NumberAction.Fail, ErrorCode = 30003 });
            var (client, _, store) = Build(options);

            var message = await MessageResource.CreateAsync(
                to: new PhoneNumber("+61412345678"), from: new PhoneNumber("+61400000000"),
                body: "x", client: client);

            Assert.NotNull(message.Sid);
            Assert.Equal("queued", message.Status.ToString());
            Assert.Equal(30003, Assert.Single(store.Query(new SmsRecordQuery())).ErrorCode);
        }

        [Fact]
        public async Task Errors_raised_by_twilio_itself_are_recorded_and_rethrown()
        {
            var options = Enabled();
            options.AllowedNumbers.Add("*");
            var (client, inner, store) = Build(options);
            inner.NextResponse = null;

            // Make the inner client throw the way the real one does on a 400.
            var throwingInner = new ThrowingClient(new ApiException(21211, 400, "bad number", "info"));
            var throwingClient = new InspectingTwilioRestClient(throwingInner, new NumberPolicy(options), store);

            await Assert.ThrowsAsync<ApiException>(() => MessageResource.CreateAsync(
                to: new PhoneNumber("+61412345678"), from: new PhoneNumber("+61400000000"),
                body: "x", client: throwingClient));

            var record = Assert.Single(store.Query(new SmsRecordQuery()));
            Assert.Equal("failed", record.Status);
            Assert.Equal(21211, record.ErrorCode);
            Assert.True(record.ReachedTwilio);
        }

        [Fact]
        public async Task Disabled_toolkit_passes_everything_through_and_records_nothing()
        {
            var (client, inner, store) = Build(new TwilioDevKitOptions { Enabled = false });

            await MessageResource.CreateAsync(
                to: new PhoneNumber("+61412345678"), from: new PhoneNumber("+61400000000"),
                body: "x", client: client);

            Assert.Single(inner.Requests);
            Assert.Equal("+61412345678", inner.LastParam("To"));
            // Records are still written when disabled only if a rule matched; with the
            // toolkit off the decision is a plain pass-through.
            Assert.Equal(NumberAction.Allow, Assert.Single(store.Query(new SmsRecordQuery())).Action);
        }

        [Fact]
        public async Task Without_a_live_client_sends_are_simulated_instead_of_throwing()
        {
            var options = Enabled(NumberAction.Allow);
            var (client, _, store) = Build(options, withInner: false);

            var message = await MessageResource.CreateAsync(
                to: new PhoneNumber("+61412345678"), from: new PhoneNumber("+61400000000"),
                body: "x", client: client);

            Assert.NotNull(message.Sid);
            var record = Assert.Single(store.Query(new SmsRecordQuery()));
            Assert.False(record.ReachedTwilio);
            Assert.Contains("No live Twilio client", record.Reason);
        }

        [Fact]
        public async Task Non_message_requests_are_forwarded_untouched()
        {
            var options = Enabled();
            var (client, inner, store) = Build(options);

            // Fetching an existing message must not be intercepted or recorded.
            var request = new Twilio.Http.Request(
                Twilio.Http.HttpMethod.Get,
                "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages/SM123.json");
            await client.RequestAsync(request);

            Assert.Single(inner.Requests);
            Assert.Empty(store.Query(new SmsRecordQuery()));
        }

        [Fact]
        public async Task Segment_and_encoding_details_are_captured_for_each_message()
        {
            var (client, _, store) = Build(Enabled());

            await MessageResource.CreateAsync(
                to: new PhoneNumber("+61412345678"), from: new PhoneNumber("+61400000000"),
                body: "Curly quote ’ forces unicode", client: client);

            var record = Assert.Single(store.Query(new SmsRecordQuery()));
            Assert.Equal("UCS-2", record.Encoding);
            Assert.NotNull(record.ForcedUnicodeBy);
        }

        private sealed class ThrowingClient : Twilio.Clients.ITwilioRestClient
        {
            private readonly Exception _exception;
            public ThrowingClient(Exception exception) => _exception = exception;
            public string AccountSid => "ACthrow";
            public string Region => null!;
            public Twilio.Http.HttpClient HttpClient => null!;
            public Twilio.Http.Response Request(Twilio.Http.Request request) => throw _exception;
            public Task<Twilio.Http.Response> RequestAsync(Twilio.Http.Request request) => throw _exception;
        }
    }
}
