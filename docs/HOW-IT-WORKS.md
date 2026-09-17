# How it works

## The seam

Every resource call in the Twilio .NET SDK accepts an `ITwilioRestClient`:

```csharp
await MessageResource.CreateAsync(to: ..., from: ..., body: ..., client: client);
```

The interface is small - `AccountSid`, `Region`, `HttpClient`, `Request`, `RequestAsync` -
which makes it a clean place to decorate. `InspectingTwilioRestClient` implements it and
wraps whatever client the application already registered.

That choice is what keeps integration to two lines. The alternatives are worse:

- **A wrapper service** (`ISmsSender`) means finding and rewriting every call site, and it
  only covers the calls you remembered to change.
- **A `DelegatingHandler`** on the HTTP client works, but means parsing and rebuilding HTTP
  bodies, and it depends on how the client was constructed.

Decorating `ITwilioRestClient` covers every call site by construction, including ones in code
you have never read.

## The send path

`InspectingTwilioRestClient.RequestAsync` only acts on `POST .../Messages.json`. Anything
else - fetching a message, Lookup, Voice, Verify - is forwarded untouched.

For a send:

1. **Read** `To`, `From`, `Body`, `MessagingServiceSid`, `StatusCallback` and any `MediaUrl`
   from the request's POST parameters.
2. **Resolve** the number against the rules, producing a decision: an action, the recipient
   actually to use, and a plain-English reason.
3. **Open a record** carrying both the requested and effective recipient, the matched rule,
   and the computed segment count and encoding.
4. **Act**:
   - `Allow` - forward unchanged.
   - `MapToTestNumber` / `Redirect` - rewrite the `To` parameter in place (and annotate the
     body when redirecting), then forward.
   - `Simulate` - never forward. Synthesise the JSON the API would have returned and hand it
     back, so the SDK deserializes a real `MessageResource`.
   - `Fail` - for a send-time (2xxxx) code, throw `ApiException` exactly as the real client
     does. For a delivery-time (3xxxx) code, return success and report the failure later on
     the status callback.
5. **Close the record** with the SID, status, round-trip time, and any error.

### Why `Fail` throws rather than returning an error response

The Twilio SDK's *resource* layer does not inspect status codes - it deserializes whatever
body it is given. The concrete `TwilioRestClient` is what turns a non-2xx response into an
`ApiException`. A decorator that returned an error response would therefore produce a
`MessageResource` full of nulls instead of an exception, which is not what calling code sees
in production. So the interceptor raises `ApiException` itself, built from the same
`TwilioErrorCatalog` entry that supplies the message, HTTP status and documentation link.

This was verified against the SDK rather than assumed.

## Simulated responses

`MessageSimulator` writes the Messages-resource JSON: Twilio's field names, a `SM`-prefixed
SID, and RFC-2822 dates. Calling code that reads `DateCreated`, `NumSegments` or `Status`
behaves identically against a simulated send.

## Delivery receipts

`HttpStatusCallbackSender` walks a simulated message through its statuses, POSTing each one
to the application's own `StatusCallback` URL in Twilio's form-encoded shape and updating the
stored record as it goes. It is fire-and-forget: a simulated receipt must never block or fail
a send.

With `SigningAuthToken` set, each POST carries a real `X-Twilio-Signature`, computed the way
Twilio computes it - URL, then every parameter sorted by name, HMAC-SHA1, Base64. The test
suite checks our implementation against Twilio's own `RequestValidator` rather than a
constant, because a silent disagreement would mean signature-validating endpoints rejecting
every simulated callback.

## Recording

`InMemorySmsRecordStore` is a bounded ring buffer with SID and id indexes, guarded by a lock,
raising `RecordChanged` on every write. The inspector's server-sent-events endpoint subscribes
to that event, so the screen updates without polling. `ISmsRecordStore` is the seam for
pointing the screen at something durable instead.

Optional `PersistPath` appends each record to a newline-delimited JSON file. Persistence
failures are swallowed by design: a full disk must not stop the application sending messages.

## The screen

One self-contained HTML document served by plain middleware - not MVC, not Razor, no static
files. It mounts into any ASP.NET Core application however that application is built, and
adds nothing to its asset pipeline.

## Segment counting

`SegmentCalculator` implements the GSM 03.38 basic and extension tables. A body that is
entirely GSM-7 gets 160 septets in one segment, 153 per part when concatenated; anything else
is UCS-2 at 70 and 67. Extension characters (`{`, `}`, `[`, `]`, `~`, `^`, `\`, `|`, `€`)
cost two septets each.

The screen names the first character that forced UCS-2, which turns "why is this message
three segments?" into a one-second fix. It is usually a smart quote pasted in from Word.

## Safety

- Options are inert by default; `Enabled` is false.
- The DI extension checks `IHostEnvironment`. In Production, interception is skipped and the
  real client returned unless `AllowInProduction` is set - and it logs that it did so.
- `DefaultAction` defaults to `Simulate`, so an incomplete rule list fails safe.
- A `Redirect` with no configured target degrades to `Simulate` rather than delivering to the
  real recipient.
- With no live client registered, actions that would send are downgraded to simulation
  instead of throwing.
- Options are swapped atomically, so runtime edits from the screen do not lock the send path.
