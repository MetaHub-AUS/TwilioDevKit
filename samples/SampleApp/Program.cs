using Twilio.Clients;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using TwilioDevKit;
using TwilioDevKit.AspNetCore;
using SampleApp;

// ---------------------------------------------------------------------------
// A stand-in for the application you actually have. The only lines that matter
// for the toolkit are the two marked "TwilioDevKit" below; everything else is
// ordinary application code that sends SMS the normal way.
// ---------------------------------------------------------------------------

var builder = WebApplication.CreateBuilder(args);

// How an application normally registers Twilio. Left exactly as it would be:
// with no real credentials configured, nothing is registered and the toolkit
// runs in pure simulation - which is what you want on a laptop.
var accountSid = builder.Configuration["Twilio:AccountSid"];
var authToken = builder.Configuration["Twilio:AuthToken"];
if (!string.IsNullOrWhiteSpace(accountSid) && !string.IsNullOrWhiteSpace(authToken))
{
    builder.Services.AddSingleton<ITwilioRestClient>(_ => new TwilioRestClient(accountSid, authToken));
}
else
{
    // Sample scaffolding only. Stands in for the Twilio API authenticated with test
    // credentials, so the demo shows the real magic-number restriction with no account.
    // See TestCredentialApi. Delete this branch when wiring the toolkit into a real system.
    builder.Services.AddSingleton<ITwilioRestClient, TestCredentialApi>();
}

// TwilioDevKit (1 of 2): wrap whatever Twilio client is registered.
builder.Services.AddTwilioDevKit(builder.Configuration);

var app = builder.Build();

// TwilioDevKit (2 of 2): serve the inspector screen.
app.UseTwilioInspector();

// ---------------------------------------------------------------------------
// The demo application itself.
// ---------------------------------------------------------------------------

app.MapGet("/", () => Results.Content(DemoPage.Html, "text/html"));

/// Sends a message the ordinary way. Note there is nothing toolkit-specific
/// here: this is the code an application already has.
app.MapPost("/send", async (SendRequest request, ITwilioRestClient? client) =>
{
    if (client is null)
        return Results.BadRequest(new { error = "No ITwilioRestClient registered." });

    try
    {
        var message = await MessageResource.CreateAsync(
            to: new PhoneNumber(request.To),
            from: new PhoneNumber(string.IsNullOrWhiteSpace(request.From) ? "+15005550006" : request.From),
            body: request.Body,
            statusCallback: string.IsNullOrWhiteSpace(request.StatusCallback)
                ? null!
                : new Uri(request.StatusCallback),
            client: client);

        return Results.Ok(new { sid = message.Sid, status = message.Status?.ToString(), to = message.To });
    }
    catch (Twilio.Exceptions.ApiException ex)
    {
        return Results.Ok(new { error = ex.Message, code = ex.Code, status = ex.Status });
    }
});

/// Stands in for the application's own delivery-receipt webhook, so the
/// simulated status callbacks have somewhere real to land.
app.MapPost("/twilio/status", async (HttpRequest http) =>
{
    var form = await http.ReadFormAsync();
    app.Logger.LogInformation(
        "Delivery receipt: {Sid} is now {Status}{Error}",
        form["MessageSid"].FirstOrDefault(),
        form["MessageStatus"].FirstOrDefault(),
        form["ErrorCode"].FirstOrDefault() is { Length: > 0 } code ? $" (error {code})" : string.Empty);
    return Results.NoContent();
});

app.Run();

internal sealed record SendRequest(string To, string? From, string Body, string? StatusCallback);
