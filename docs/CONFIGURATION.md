# Configuration reference

Everything binds from the `TwilioDevKit` section of `IConfiguration`, so it works from
`appsettings.{Environment}.json`, environment variables, user secrets, or code.

```csharp
builder.Services.AddTwilioDevKit(builder.Configuration);

// or, overriding in code after binding:
builder.Services.AddTwilioDevKit(builder.Configuration, options =>
{
    options.Enabled = builder.Environment.IsDevelopment();
    options.AllowedNumbers.Add("+61412345678");
});
```

## Top level

| Setting | Default | Meaning |
|---|---|---|
| `Enabled` | `false` | Master switch. When false every call passes through to Twilio and nothing is recorded. |
| `DefaultAction` | `Simulate` | Applied when no rule matches. Defaults to the safe option. |
| `Rules` | empty | Ordered override rules; first match wins. |
| `AllowedNumbers` | empty | Shorthand for `Allow` rules, evaluated **before** `Rules`. |
| `DefaultCountry` | `null` | ISO country assumed for national-format numbers, e.g. `AU`. |
| `MapToTestNumber` | `+15005550006` | Magic number used by `MapToTestNumber` rules that do not name one. |
| `RedirectTo` | `null` | Fallback target for `Redirect` rules. |
| `AnnotateRedirectedBody` | `true` | Prepend `[to +61...]` to redirected messages. |
| `MaxRecords` | `500` | Ring-buffer size. The oldest record is dropped when full. |
| `PersistPath` | `null` | Optional newline-delimited JSON file to append records to. |
| `RedactRecords` | `false` | Mask numbers and bodies everywhere they are shown. |
| `AllowInProduction` | `false` | Required before the toolkit will intercept in the Production environment. |

## Rules

```jsonc
{
  "Match": "country:AU",        // required
  "Action": "MapToTestNumber",  // Allow | Simulate | MapToTestNumber | Redirect | Fail
  "MapTo": "+15005550006",      // MapToTestNumber only
  "RedirectTo": "+61499999999", // Redirect only
  "ErrorCode": 21610,           // Fail only
  "Note": "why this exists",    // shown in the inspector
  "Enabled": true               // set false to park a rule without deleting it
}
```

### Match forms

| Form | Example |
|---|---|
| Exact | `+61412345678` |
| Prefix wildcard | `+614*` |
| Country | `country:AU` |
| Regular expression | `regex:^\+614\d{8}$` |
| Catch-all | `*` |

Patterns are matched after normalisation, so `0412 345 678` and `+61 412 345 678` are the
same number when `DefaultCountry` is `AU`. A malformed `regex:` pattern never matches rather
than throwing, and `Validate()` reports it.

## StatusCallbacks

| Setting | Default | Meaning |
|---|---|---|
| `Enabled` | `false` | Replay the delivery lifecycle to the caller's `StatusCallback` URL for simulated sends. |
| `Sequence` | `queued, sent, delivered` | Statuses to walk through. |
| `DelayMs` | `750` | Delay between each callback. |
| `SigningAuthToken` | `null` | Sign callbacks with a real `X-Twilio-Signature`. |

> `Sequence` starts **empty** in code and falls back to the standard lifecycle. This is
> deliberate: `IConfiguration.Bind` *appends* to a list that already holds items, so a seeded
> default would turn a configured sequence into the default followed by the configured one,
> and every message would report its lifecycle twice. `ConfigurationTests` pins this.

## Inspector

| Setting | Default | Meaning |
|---|---|---|
| `Enabled` | `true` | Serve the screen (still gated by the top-level `Enabled`). |
| `Path` | `/_twilio` | Base path for the screen and its API. |
| `AccessToken` | `null` | When set, requests need `?token=` or an `X-DevKit-Token` header. |
| `LocalOnly` | `false` | Reject requests that did not come from loopback. |
| `AllowRuntimeChanges` | `true` | Allow rule edits from the screen. Set false for read-only. |

## Endpoints

All relative to `Inspector:Path`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | The screen. |
| `GET` | `/api/messages` | List records. Supports `search`, `status`, `action`, `failuresOnly`, `limit`, `offset`. |
| `GET` | `/api/messages/{id}` | One record. |
| `DELETE` | `/api/messages` | Clear the buffer. |
| `GET` | `/api/stats` | Aggregate counts. |
| `GET` | `/api/config` | Current options, plus any validation problems. |
| `POST` | `/api/config` | Update rules at runtime. |
| `GET` | `/api/preview?to=` | Resolve the rules for a number without sending. |
| `POST` | `/api/test-send` | Send a message through the pipeline. |
| `GET` | `/api/events` | Server-sent events stream of record changes. |
| `POST` | `/webhook/status` | Receive real Twilio status callbacks. |

`/webhook/status` sits outside the token and localhost gate, because Twilio cannot present
either. Everything else is gated.

## Suggested setups

**Developer machine, no Twilio account**

```jsonc
{ "TwilioDevKit": { "Enabled": true, "DefaultAction": "Simulate" } }
```

**Shared test environment, real API, nothing delivered to real people**

```jsonc
{
  "TwilioDevKit": {
    "Enabled": true,
    "DefaultAction": "MapToTestNumber",
    "AllowedNumbers": [ "+61412345678" ],
    "Inspector": { "AccessToken": "...", "AllowRuntimeChanges": false }
  }
}
```

**Staging, one shared QA handset**

```jsonc
{
  "TwilioDevKit": {
    "Enabled": true,
    "DefaultAction": "Redirect",
    "RedirectTo": "+61499999999",
    "RedactRecords": true
  }
}
```
