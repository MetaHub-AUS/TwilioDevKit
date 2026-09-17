using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Twilio.Clients;
using Twilio.Http;

namespace TwilioDevKit.Tests
{
    /// <summary>
    /// Stands in for the real Twilio client so tests can assert on exactly what would have
    /// gone over the wire, without any network access or credentials.
    /// </summary>
    internal sealed class RecordingTwilioClient : ITwilioRestClient
    {
        public List<Request> Requests { get; } = new List<Request>();

        /// <summary>Set to make the next call return an error response instead of success.</summary>
        public Response? NextResponse { get; set; }

        public string AccountSid => "ACtestacctestacctestacctestacc001";
        public string Region => null!;
        public Twilio.Http.HttpClient HttpClient => null!;

        /// <summary>The value of a POST parameter on the most recent request.</summary>
        public string? LastParam(string key) =>
            Requests.LastOrDefault()?.PostParams
                ?.FirstOrDefault(p => string.Equals(p.Key, key, System.StringComparison.OrdinalIgnoreCase)).Value;

        public Response Request(Request request)
        {
            // Snapshot the parameters: the SDK reuses the request object, and we want to
            // assert on what was posted at this moment.
            var snapshot = new Request(request.Method, request.Uri.ToString());
            foreach (var p in request.PostParams) snapshot.AddPostParam(p.Key, p.Value);
            Requests.Add(snapshot);

            if (NextResponse != null) return NextResponse;

            var to = LastParam("To");
            var json = Simulation.MessageSimulator.ToJson(new Simulation.MessageSimulator.SimulatedMessage
            {
                AccountSid = AccountSid,
                To = to,
                From = LastParam("From"),
                Body = LastParam("Body"),
                Status = "queued",
            });
            return new Response(HttpStatusCode.Created, json);
        }

        public Task<Response> RequestAsync(Request request) => Task.FromResult(Request(request));
    }
}
