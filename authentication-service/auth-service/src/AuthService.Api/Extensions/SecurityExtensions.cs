using Microsoft.AspNetCore.DataProtection;

namespace AuthService.Api.Extensions;

public static class SecurityExtensions
{
    private static readonly string[] DefaultAllowedOrigins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"];
    private static readonly string[] DefaultAdminOrigins = ["http://localhost:5173"];

    public static IServiceCollection AddSecurityPolicies(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("DefaultCorsPolicy", builder =>
            {
                _ = configuration.GetSection("Security:AllowedOrigins").Get<string[]>() ?? DefaultAllowedOrigins;

                builder.SetIsOriginAllowed(origin => true)
                       .AllowAnyHeader()
                       .AllowAnyMethod()
                       .AllowCredentials()
                       .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
            });

            options.AddPolicy("AdminCorsPolicy", builder =>
            {
                _ = configuration.GetSection("Security:AdminAllowedOrigins").Get<string[]>() ?? DefaultAdminOrigins;

                builder.SetIsOriginAllowed(origin => true)
                       .AllowAnyHeader()
                       .AllowAnyMethod()
                       .AllowCredentials();
            });
        });

        var keysDirectoryName = environment.IsDevelopment() ? "./keys-development" : "./keys";
        var keysDirectory = new DirectoryInfo(keysDirectoryName);
        if (!keysDirectory.Exists)
        {
            keysDirectory.Create();
        }

        var dataProtectionBuilder = services.AddDataProtection()
            .PersistKeysToFileSystem(keysDirectory)
            .SetApplicationName("AuthDotnetApi")
            .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

        if (environment.IsProduction() && OperatingSystem.IsWindows())
        {
            dataProtectionBuilder.ProtectKeysWithDpapi();
        }

        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-CSRF-TOKEN";
            options.SuppressXFrameOptionsHeader = false;
            options.Cookie.Name = "__RequestVerificationToken";
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.Cookie.SameSite = SameSiteMode.Strict;
        });

        return services;
    }

    public static IServiceCollection AddSecurityOptions(this IServiceCollection services)
    {
        services.Configure<CookiePolicyOptions>(options =>
        {
            options.CheckConsentNeeded = context => true;
            options.MinimumSameSitePolicy = SameSiteMode.Strict;
            options.HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always;
            options.Secure = CookieSecurePolicy.SameAsRequest;
        });

        return services;
    }
}
