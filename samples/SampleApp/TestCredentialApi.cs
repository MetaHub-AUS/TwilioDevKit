using System.Net;
using Twilio.Clients;
using Twilio.Http;
using TwilioDevKit;
using TwilioDevKit.Simulation;

namespace SampleApp;

/// <summary>
/// Stands in for the Twilio API <b>authenticated with test credentials</b>, so the sample
/// demonstrates the real restriction without anyone needing an account.
/// </summary>
/// <remarks>
/// <para>
/// This is sample scaffolding, not part of the toolkit. It exists so you can see the problem
/// first-hand: it accepts <i>only</i> Twilio's magic test numbers and rejects everything else
/// with error 21211, exactly as test credentials do. Send to <c>+61412345678</c> with a rule
/// of <c>Allow</c> and it fails; switch that rule to <c>MapToTestNumber</c> and the same send
/// succeeds.
/// </para>
/// <para>
/// Put real credentials in configuration and this is not registered at all - the toolkit
/// talks to the real API instead.
/// </para>
/// </remarks>
internal sealed class TestCredentialApi : ITwilioRestClient
{
    public string AccountSid => "ACtestcredentials0000000000000000";
    public string Region => null!;
    public Twilio.Http.HttpClient HttpClient => null!;

    public Response Request(Request request)
    {
        var to = Param(request, "To");
        var from = Param(request, "From");
        var body = Param(request, "Body");

        // Test credentials accept only the documented magic numbers.
        var info = TwilioTestNumbers.Describe(to);
        if (info is null || info.Field != "to")
        {
            return Error(21211, $"The 'To' number {to} is not a valid phone number.", 400);
        }

        if (info.ErrorCode is int code)
        {
            var error = TwilioErrorCatalog.GetOrGeneric(code);
            return Error(code, error.Render(to, from), error.HttpStatus);
        }

        var json = MessageSimulator.ToJson(new MessageSimulator.SimulatedMessage
        {
            AccountSid = AccountSid,
            To = to,
            From = from,
            Body = body,
            Status = "queued",
            NumSegments = TwilioDevKit.Recording.SegmentCalculator.Measure(body).Segments,
        });

        return new Response(HttpStatusCode.Created, json);
    }

    public Task<Response> RequestAsync(Request request) => Task.FromResult(Request(request));

    private static string? Param(Request request, string key) =>
        request.PostParams?.FirstOrDefault(p =>
            string.Equals(p.Key, key, StringComparison.OrdinalIgnoreCase)).Value;

    /// <summary>
    /// Returns a Twilio-shaped error response. The real concrete client turns these into an
    /// <c>ApiException</c>, so this stand-in throws to match.
    /// </summary>
    private static Response Error(int code, string message, int httpStatus)
    {
        throw new Twilio.Exceptions.ApiException(
            code: code,
            status: httpStatus,
            message: message,
            moreInfo: "https://www.twilio.com/docs/errors/" + code);
    }
}
