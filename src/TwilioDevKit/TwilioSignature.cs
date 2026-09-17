using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace TwilioDevKit
{
    /// <summary>
    /// Computes and checks the <c>X-Twilio-Signature</c> header Twilio puts on its webhooks.
    /// </summary>
    /// <remarks>
    /// Twilio's scheme: concatenate the full request URL with every POST parameter sorted by
    /// name (name immediately followed by value, no separators), HMAC-SHA1 it with the
    /// account auth token, and Base64 the result. Reproducing it here means simulated
    /// delivery callbacks carry a signature your real validation middleware accepts, so you
    /// can test the validating path rather than switching validation off for testing.
    /// </remarks>
    public static class TwilioSignature
    {
        /// <summary>Computes the signature for a webhook request.</summary>
        /// <param name="authToken">The Twilio auth token to sign with.</param>
        /// <param name="url">The full URL Twilio would POST to, including any query string.</param>
        /// <param name="parameters">The form parameters being posted.</param>
        public static string Compute(string authToken, string url, IEnumerable<KeyValuePair<string, string>>? parameters)
        {
            if (authToken == null) throw new ArgumentNullException(nameof(authToken));
            if (url == null) throw new ArgumentNullException(nameof(url));

            var builder = new StringBuilder(url);
            if (parameters != null)
            {
                foreach (var pair in parameters.OrderBy(p => p.Key, StringComparer.Ordinal))
                {
                    builder.Append(pair.Key).Append(pair.Value);
                }
            }

            using var hmac = new HMACSHA1(Encoding.UTF8.GetBytes(authToken));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(builder.ToString()));
            return Convert.ToBase64String(hash);
        }

        /// <summary>
        /// Constant-time comparison of a received signature against the expected one.
        /// </summary>
        public static bool Validate(
            string authToken,
            string url,
            IEnumerable<KeyValuePair<string, string>>? parameters,
            string? receivedSignature)
        {
            if (string.IsNullOrEmpty(receivedSignature)) return false;

            var expected = Compute(authToken, url, parameters);
            var a = Encoding.UTF8.GetBytes(expected);
            var b = Encoding.UTF8.GetBytes(receivedSignature!);

            // Compare every byte regardless of mismatch so timing does not leak the signature.
            var difference = a.Length ^ b.Length;
            for (var i = 0; i < a.Length && i < b.Length; i++) difference |= a[i] ^ b[i];
            return difference == 0;
        }
    }
}
