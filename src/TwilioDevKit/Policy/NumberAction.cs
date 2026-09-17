namespace TwilioDevKit.Policy
{
    /// <summary>What the toolkit should do with a message addressed to a given number.</summary>
    public enum NumberAction
    {
        /// <summary>
        /// Send it for real. The request goes to Twilio untouched with whatever credentials
        /// the underlying client holds. Use for the one or two handsets you genuinely want
        /// to ring during testing.
        /// </summary>
        Allow = 0,

        /// <summary>
        /// Never contact Twilio. The toolkit synthesises the response the API would have
        /// returned, so calling code gets a real <c>MessageResource</c> with a SID and a
        /// status. Costs nothing, needs no credentials, and works offline.
        /// </summary>
        Simulate = 1,

        /// <summary>
        /// Rewrite the recipient to one of Twilio's magic test numbers so a call made with
        /// <b>test credentials</b> is accepted, then really call the API. This exercises the
        /// full HTTP path, authentication and error handling while the record keeps the
        /// number the application actually asked for.
        /// </summary>
        MapToTestNumber = 2,

        /// <summary>
        /// Really send, but to a safe number you control instead of the intended recipient.
        /// The original recipient is prepended to the body so the message is still traceable.
        /// Useful for a shared QA handset.
        /// </summary>
        Redirect = 3,

        /// <summary>
        /// Fail deliberately with a chosen Twilio error code, without contacting Twilio.
        /// Lets you exercise error handling for any number, including delivery-time
        /// (3xxxx) failures that a normal test can never provoke on demand.
        /// </summary>
        Fail = 4,
    }
}
