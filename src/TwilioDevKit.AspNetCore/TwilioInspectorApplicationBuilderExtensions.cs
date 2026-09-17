using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using TwilioDevKit.AspNetCore.Inspector;

namespace TwilioDevKit.AspNetCore
{
    /// <summary>Mounts the inspector screen into the request pipeline.</summary>
    public static class TwilioInspectorApplicationBuilderExtensions
    {
        /// <summary>
        /// Serves the SMS inspector at the configured path (<c>/_twilio</c> by default).
        /// </summary>
        /// <remarks>
        /// Place this early in the pipeline - before authentication - so the screen is
        /// reachable in a test environment without signing in to the host application.
        /// Protect it with <see cref="TwilioDevKitOptions.InspectorOptions.AccessToken"/> or
        /// <see cref="TwilioDevKitOptions.InspectorOptions.LocalOnly"/> instead.
        /// </remarks>
        /// <exception cref="InvalidOperationException">
        /// Thrown when <c>AddTwilioDevKit</c> was not called first.
        /// </exception>
        public static IApplicationBuilder UseTwilioInspector(this IApplicationBuilder app)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));

            if (app.ApplicationServices.GetService<TwilioDevKitOptions>() == null)
            {
                throw new InvalidOperationException(
                    "UseTwilioInspector() requires AddTwilioDevKit() to have been called on the service collection.");
            }

            return app.UseMiddleware<TwilioInspectorMiddleware>();
        }
    }
}
