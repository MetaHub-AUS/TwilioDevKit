using System.Collections.Generic;
using TwilioDevKit.Recording;

namespace TwilioDevKit.Simulation
{
    /// <summary>Delivers simulated status callbacks to the application's webhook.</summary>
    public interface IStatusCallbackSender
    {
        /// <summary>
        /// Walks <paramref name="record"/> through <paramref name="sequence"/>, POSTing each
        /// status to <paramref name="callbackUrl"/> exactly as Twilio would. Returns
        /// immediately; the walk happens in the background.
        /// </summary>
        /// <param name="record">The message whose lifecycle is being simulated.</param>
        /// <param name="callbackUrl">The <c>StatusCallback</c> URL the application supplied.</param>
        /// <param name="sequence">Statuses to walk through, in order.</param>
        /// <param name="delayMs">Delay between each callback.</param>
        /// <param name="finalErrorCode">
        /// When set, the final status is reported as a failure carrying this error code.
        /// </param>
        void Schedule(
            SmsRecord record,
            string callbackUrl,
            IReadOnlyList<string> sequence,
            int delayMs,
            int? finalErrorCode);
    }
}
