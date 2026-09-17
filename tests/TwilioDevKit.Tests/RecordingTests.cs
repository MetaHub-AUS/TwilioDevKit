using System;
using System.Collections.Generic;
using System.Linq;
using TwilioDevKit.Policy;
using TwilioDevKit.Recording;
using Xunit;

namespace TwilioDevKit.Tests
{
    public class SegmentCalculatorTests
    {
        [Fact]
        public void Plain_text_stays_gsm7_and_fits_one_segment()
        {
            var info = SegmentCalculator.Measure("Your inspection is booked for Tuesday at 9am.");
            Assert.Equal("GSM-7", info.Encoding);
            Assert.Equal(1, info.Segments);
            Assert.Null(info.ForcedUnicodeBy);
        }

        [Fact]
        public void One_hundred_and_sixty_characters_is_still_a_single_segment()
        {
            Assert.Equal(1, SegmentCalculator.Measure(new string('a', 160)).Segments);
            Assert.Equal(2, SegmentCalculator.Measure(new string('a', 161)).Segments);
        }

        [Fact]
        public void A_smart_quote_drops_the_message_to_ucs2_and_names_the_culprit()
        {
            // The whole point of surfacing this: one pasted character cuts the per-segment
            // budget from 160 to 70 and silently multiplies the cost.
            var info = SegmentCalculator.Measure("Don’t forget your inspection");
            Assert.Equal("UCS-2", info.Encoding);
            Assert.Contains("U+2019", info.ForcedUnicodeBy);
        }

        [Fact]
        public void Ucs2_messages_break_at_seventy_characters()
        {
            Assert.Equal(1, SegmentCalculator.Measure("’" + new string('a', 69)).Segments);
            Assert.Equal(2, SegmentCalculator.Measure("’" + new string('a', 70)).Segments);
        }

        [Fact]
        public void Gsm_extended_characters_cost_two_septets()
        {
            // '{' is in the GSM extension table: 80 of them fill 160 septets.
            Assert.Equal(1, SegmentCalculator.Measure(new string('{', 80)).Segments);
            Assert.Equal(2, SegmentCalculator.Measure(new string('{', 81)).Segments);
        }

        [Fact]
        public void An_empty_body_is_one_segment_not_zero()
        {
            Assert.Equal(1, SegmentCalculator.Measure(null).Segments);
            Assert.Equal(1, SegmentCalculator.Measure("").Segments);
        }
    }

    public class TwilioSignatureTests
    {
        private const string Token = "12345";
        private const string Url = "https://mycompany.com/myapp.php?foo=1&bar=2";

        /// <summary>
        /// Checks our signature against Twilio's own <c>RequestValidator</c> rather than a
        /// constant copied from documentation. If the two ever disagree, simulated delivery
        /// callbacks would be rejected by real validation middleware - which is the entire
        /// reason for signing them.
        /// </summary>
        [Fact]
        public void Agrees_with_the_twilio_sdks_own_validator()
        {
            var parameters = new List<KeyValuePair<string, string>>
            {
                new KeyValuePair<string, string>("CallSid", "CA1234567890ABCDE"),
                new KeyValuePair<string, string>("Caller", "+12349013030"),
                new KeyValuePair<string, string>("Digits", "1234"),
                new KeyValuePair<string, string>("From", "+12349013030"),
                new KeyValuePair<string, string>("To", "+18005551212"),
            };

            var ours = TwilioSignature.Compute(Token, Url, parameters);
            var theirs = new Twilio.Security.RequestValidator(Token);

            Assert.True(theirs.Validate(Url, parameters.ToDictionary(p => p.Key, p => p.Value), ours));
        }

        [Fact]
        public void A_signed_status_callback_passes_twilios_validation()
        {
            // The exact payload HttpStatusCallbackSender posts for a delivery receipt.
            var callbackUrl = "https://app.example.com/twilio/status";
            var parameters = new List<KeyValuePair<string, string>>
            {
                new KeyValuePair<string, string>("MessageSid", "SM0123456789abcdef0123456789abcdef"),
                new KeyValuePair<string, string>("MessageStatus", "delivered"),
                new KeyValuePair<string, string>("To", "+61412345678"),
                new KeyValuePair<string, string>("From", "+15005550006"),
            };

            var signature = TwilioSignature.Compute(Token, callbackUrl, parameters);
            var validator = new Twilio.Security.RequestValidator(Token);

            Assert.True(validator.Validate(callbackUrl, parameters.ToDictionary(p => p.Key, p => p.Value), signature));
        }

        [Fact]
        public void Parameter_order_does_not_change_the_signature()
        {
            var forward = new List<KeyValuePair<string, string>>
            {
                new KeyValuePair<string, string>("A", "1"),
                new KeyValuePair<string, string>("B", "2"),
            };
            var reversed = Enumerable.Reverse(forward).ToList();

            Assert.Equal(
                TwilioSignature.Compute(Token, Url, forward),
                TwilioSignature.Compute(Token, Url, reversed));
        }

        [Fact]
        public void Validation_accepts_a_correct_signature_and_rejects_everything_else()
        {
            var parameters = new List<KeyValuePair<string, string>>
            {
                new KeyValuePair<string, string>("MessageStatus", "delivered"),
            };
            var signature = TwilioSignature.Compute(Token, Url, parameters);

            Assert.True(TwilioSignature.Validate(Token, Url, parameters, signature));
            Assert.False(TwilioSignature.Validate(Token, Url, parameters, "wrong"));
            Assert.False(TwilioSignature.Validate(Token, Url, parameters, null));
            Assert.False(TwilioSignature.Validate("different-token", Url, parameters, signature));
        }
    }

    public class InMemorySmsRecordStoreTests
    {
        private static SmsRecord Record(string to, string status = "queued", NumberAction action = NumberAction.Simulate) =>
            new SmsRecord
            {
                To = to,
                EffectiveTo = to,
                From = "+15005550006",
                Body = "body for " + to,
                Status = status,
                Action = action,
                Sid = "SM" + Guid.NewGuid().ToString("N"),
            };

        [Fact]
        public void The_buffer_is_bounded_and_drops_the_oldest_first()
        {
            var store = new InMemorySmsRecordStore(maxRecords: 3);
            for (var i = 0; i < 5; i++) store.Add(Record("+6141234567" + i));

            Assert.Equal(3, store.Count);
            var remaining = store.Query(new SmsRecordQuery()).Select(r => r.To).ToList();
            Assert.Equal(new[] { "+61412345674", "+61412345673", "+61412345672" }, remaining);
        }

        [Fact]
        public void Records_come_back_newest_first()
        {
            var store = new InMemorySmsRecordStore();
            store.Add(Record("+61400000001"));
            store.Add(Record("+61400000002"));

            Assert.Equal("+61400000002", store.Query(new SmsRecordQuery()).First().To);
        }

        [Fact]
        public void A_status_callback_updates_the_matching_record()
        {
            var store = new InMemorySmsRecordStore();
            var record = Record("+61412345678");
            store.Add(record);

            var updated = store.UpdateBySid(record.Sid!, r => r.RecordStatus("delivered", "callback"));

            Assert.NotNull(updated);
            Assert.Equal("delivered", updated!.Status);
            Assert.Contains(updated.History, h => h.Source == "callback");
            Assert.Null(store.UpdateBySid("SMunknown", _ => { }));
        }

        [Fact]
        public void Search_covers_recipient_body_and_sid()
        {
            var store = new InMemorySmsRecordStore();
            store.Add(Record("+61412345678"));
            store.Add(Record("+61499999999"));

            Assert.Single(store.Query(new SmsRecordQuery { Search = "412345678" }));
            Assert.Single(store.Query(new SmsRecordQuery { Search = "body for +61499999999" }));
            Assert.Empty(store.Query(new SmsRecordQuery { Search = "nothing here" }));
        }

        [Fact]
        public void Filters_narrow_by_status_action_and_failure()
        {
            var store = new InMemorySmsRecordStore();
            store.Add(Record("+61400000001", "delivered"));
            store.Add(Record("+61400000002", "failed", NumberAction.Fail));

            Assert.Single(store.Query(new SmsRecordQuery { Status = "delivered" }));
            Assert.Single(store.Query(new SmsRecordQuery { Action = "Fail" }));
            Assert.Single(store.Query(new SmsRecordQuery { FailuresOnly = true }));
        }

        [Fact]
        public void Paging_skips_and_takes()
        {
            var store = new InMemorySmsRecordStore();
            for (var i = 0; i < 5; i++) store.Add(Record("+6140000000" + i));

            var page = store.Query(new SmsRecordQuery { Offset = 2, Limit = 2 });
            Assert.Equal(2, page.Count);
            Assert.Equal("+61400000002", page[0].To);
        }

        [Fact]
        public void Changes_are_announced_so_the_screen_can_live_update()
        {
            var store = new InMemorySmsRecordStore();
            var seen = 0;
            store.RecordChanged += (_, __) => seen++;

            var record = Record("+61412345678");
            store.Add(record);
            store.UpdateBySid(record.Sid!, r => r.RecordStatus("sent", "callback"));

            Assert.Equal(2, seen);
        }

        [Fact]
        public void Stats_summarise_the_buffer()
        {
            var store = new InMemorySmsRecordStore();
            store.Add(Record("+61400000001", "delivered"));
            var failed = Record("+61400000002", "failed", NumberAction.Fail);
            store.Add(failed);
            var rewritten = Record("+61400000003");
            rewritten.EffectiveTo = TwilioTestNumbers.ValidTo;
            rewritten.ReachedTwilio = true;
            store.Add(rewritten);

            var stats = store.Stats();
            Assert.Equal(3, stats.Total);
            Assert.Equal(1, stats.Delivered);
            Assert.Equal(1, stats.Failed);
            Assert.Equal(1, stats.Rewritten);
            Assert.Equal(1, stats.ReachedTwilio);
            Assert.Equal(2, stats.Simulated);
        }

        [Fact]
        public void Redaction_hides_the_body_and_middle_of_each_number()
        {
            var record = Record("+61412345678");
            var redacted = record.Redacted();

            Assert.DoesNotContain("2345", redacted.To);
            Assert.DoesNotContain("body for", redacted.Body);
            Assert.Contains("redacted", redacted.Body);
            // The original must be untouched.
            Assert.Equal("+61412345678", record.To);
        }

        [Fact]
        public void Clearing_empties_the_buffer()
        {
            var store = new InMemorySmsRecordStore();
            store.Add(Record("+61412345678"));
            store.Clear();

            Assert.Equal(0, store.Count);
            Assert.Empty(store.Query(new SmsRecordQuery()));
        }
    }
}
