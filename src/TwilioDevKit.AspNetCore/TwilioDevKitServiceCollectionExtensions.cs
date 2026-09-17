using System;
using System.Linq;
using System.Net.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Twilio.Clients;
using TwilioDevKit.Interception;
using TwilioDevKit.Policy;
using TwilioDevKit.Recording;
using TwilioDevKit.Simulation;

namespace TwilioDevKit.AspNetCore
{
    /// <summary>Registers TwilioDevKit in an ASP.NET Core application.</summary>
    public static class TwilioDevKitServiceCollectionExtensions
    {
        /// <summary>
        /// Adds the toolkit and wraps the registered <see cref="ITwilioRestClient"/> so every
        /// Twilio call in the application goes through the override rules and is recorded.
        /// </summary>
        /// <remarks>
        /// <para>
        /// Call this <b>after</b> the application has registered its own
        /// <see cref="ITwilioRestClient"/>. The existing registration is decorated, not
        /// replaced, so the real client is still used for anything that should really send.
        /// If no client is registered, the toolkit runs in simulation only - which is exactly
        /// what you want on a developer machine with no credentials.
        /// </para>
        /// <para>
        /// The toolkit refuses to intercept in the Production environment unless
        /// <see cref="TwilioDevKitOptions.AllowInProduction"/> is explicitly set, so shipping
        /// this registration to production is safe by default.
        /// </para>
        /// </remarks>
        /// <param name="services">The service collection.</param>
        /// <param name="configuration">Configuration to bind the <c>TwilioDevKit</c> section from.</param>
        /// <param name="configure">Optional code-based overrides applied after binding.</param>
        public static IServiceCollection AddTwilioDevKit(
            this IServiceCollection services,
            IConfiguration? configuration = null,
            Action<TwilioDevKitOptions>? configure = null)
        {
            if (services == null) throw new ArgumentNullException(nameof(services));

            var options = new TwilioDevKitOptions();
            configuration?.GetSection(TwilioDevKitOptions.SectionName).Bind(options);
            configure?.Invoke(options);

            services.TryAddSingleton(options);

            services.TryAddSingleton<ISmsRecordStore>(_ =>
                new InMemorySmsRecordStore(options.MaxRecords, options.PersistPath));

            services.TryAddSingleton(sp => new NumberPolicy(sp.GetRequiredService<TwilioDevKitOptions>()));

            services.TryAddSingleton<IStatusCallbackSender>(sp =>
            {
                var logger = sp.GetService<ILoggerFactory>()?.CreateLogger("TwilioDevKit.StatusCallbacks");
                return new HttpStatusCallbackSender(
                    sp.GetRequiredService<ISmsRecordStore>(),
                    options.StatusCallbacks?.SigningAuthToken,
                    sp.GetService<IHttpClientFactory>()?.CreateClient("TwilioDevKit"),
                    (message, ex) => Log(logger, message, ex));
            });

            DecorateTwilioClient(services);

            return services;
        }

        /// <summary>
        /// Replaces the registered <see cref="ITwilioRestClient"/> with one that wraps it.
        /// </summary>
        private static void DecorateTwilioClient(IServiceCollection services)
        {
            var existing = services.LastOrDefault(d => d.ServiceType == typeof(ITwilioRestClient));
            if (existing != null) services.Remove(existing);

            services.AddSingleton<ITwilioRestClient>(sp =>
            {
                var options = sp.GetRequiredService<TwilioDevKitOptions>();
                var environment = sp.GetService<IHostEnvironment>();
                var logger = sp.GetService<ILoggerFactory>()?.CreateLogger("TwilioDevKit");

                var inner = existing == null ? null : (ITwilioRestClient?)Resolve(sp, existing);

                var problems = options.Validate();
                foreach (var problem in problems)
                {
                    logger?.LogWarning("TwilioDevKit configuration problem: {Problem}", problem);
                }

                // Safety catch: never quietly divert or swallow messages in production.
                if (options.Enabled &&
                    environment != null &&
                    environment.IsProduction() &&
                    !options.AllowInProduction)
                {
                    logger?.LogWarning(
                        "TwilioDevKit is enabled but the environment is Production and AllowInProduction is false. " +
                        "Interception is switched off and all messages will be sent normally.");

                    if (inner != null) return inner;
                }

                if (options.Enabled)
                {
                    logger?.LogInformation(
                        "TwilioDevKit is active. Default action: {DefaultAction}. Rules: {RuleCount}. Inspector: {InspectorPath}",
                        options.DefaultAction,
                        options.EffectiveRules().Count(),
                        options.Inspector?.Enabled == true ? options.Inspector.Path : "(disabled)");
                }

                return new InspectingTwilioRestClient(
                    inner,
                    sp.GetRequiredService<NumberPolicy>(),
                    sp.GetRequiredService<ISmsRecordStore>(),
                    sp.GetRequiredService<IStatusCallbackSender>(),
                    (message, ex) => Log(logger, message, ex));
            });
        }

        /// <summary>Instantiates whatever the original registration described.</summary>
        private static object? Resolve(IServiceProvider sp, ServiceDescriptor descriptor)
        {
            if (descriptor.ImplementationInstance != null) return descriptor.ImplementationInstance;
            if (descriptor.ImplementationFactory != null) return descriptor.ImplementationFactory(sp);
            if (descriptor.ImplementationType != null)
                return ActivatorUtilities.CreateInstance(sp, descriptor.ImplementationType);
            return null;
        }

        private static void Log(ILogger? logger, string message, Exception? exception)
        {
            if (logger == null) return;
            if (exception != null) logger.LogWarning(exception, "{Message}", message);
            else logger.LogInformation("{Message}", message);
        }
    }
}
