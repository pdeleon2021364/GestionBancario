using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.IO;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AuthService.Application.Interfaces;

namespace AuthService.Application.Services;

public class EmailService(IConfiguration configuration, ILogger<EmailService> logger) : IEmailService
{
    private static readonly string[] PlaceholderValues =
    [
        "PUT_YOUR_SENDGRID_API_KEY_HERE",
        "YOUR_SENDGRID_API_KEY",
        "changeme",
        "change-me"
    ];

    public async Task SendEmailVerificationAsync(string email, string username, string token)
    {
        var subject = "Verifica tu correo electrónico - Kinal Sports";
        var frontendVerificationUrl = $"{configuration["AppSettings:FrontendUrl"]}/verify-email?token={token}";
        var backendVerificationUrl = configuration["AppSettings:BackendUrl"] ?? "http://localhost:5156";
        backendVerificationUrl = $"{backendVerificationUrl.TrimEnd('/')}/api/v1/auth/verify-email?token={token}";

        var body = $@"
            <h2>¡Bienvenido a BanksCool, {username}!</h2>
            <p>Por favor, verifica tu correo electrónico para tu cuenta de Kinal Sports haciendo clic en el siguiente enlace:</p>
            <a href='{frontendVerificationUrl}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                Verificar correo
            </a>
            <p>Si tienes problemas con la aplicación web, usa este enlace directo al servidor:</p>
            <p><a href='{backendVerificationUrl}'>{backendVerificationUrl}</a></p>
            <p>Si no puedes hacer clic en el enlace, copia y pega esta URL en tu navegador:</p>
            <p>{frontendVerificationUrl}</p>
            <p>Este enlace expirará en 24 horas.</p>
            <p>Si no creaste una cuenta, ignora este correo.</p>
        ";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetAsync(string email, string username, string token)
    {
        var subject = "Restablece tu contraseña - Kinal Sports";
        var resetUrl = $"{configuration["AppSettings:FrontendUrl"]}/reset-password?token={token}";

        var body = $@"
            <h2>Solicitud de restablecimiento de contraseña - Kinal Sports</h2>
            <p>Hola {username},</p>
            <p>Este mensaje es de Kinal Sports.</p>
            <p>Solicitaste restablecer tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p>
            <a href='{resetUrl}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                Restablecer contraseña
            </a>
            <p>Si no puedes hacer clic en el enlace, copia y pega esta URL en tu navegador:</p>
            <p>{resetUrl}</p>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste esto, ignora este correo y tu contraseña permanecerá sin cambios.</p>
        ";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendWelcomeEmailAsync(string email, string username)
    {
        var subject = "¡Bienvenido a Kinal Sports!";

        var body = $@"
            <h2>¡Bienvenido a Kinal Sports, {username}!</h2>
            <p>Tu cuenta ha sido verificada y activada exitosamente.</p>
            <p>Ahora puedes disfrutar de todas las funciones de nuestra plataforma.</p>
            <p>Si tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte.</p>
            <p>¡Gracias por unirte a nosotros!</p>
        ";

        await SendEmailAsync(email, subject, body);
    }

    private async Task SendEmailAsync(string to, string subject, string body)
    {
        var smtpSettings = configuration.GetSection("SmtpSettings");
        var configuredProvider = smtpSettings["Provider"]?.Trim().ToLowerInvariant() ?? "auto";
        var fromEmail = smtpSettings["FromEmail"]?.Trim() ?? Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") ?? string.Empty;
        var fromName = smtpSettings["FromName"]?.Trim() ?? Environment.GetEnvironmentVariable("SMTP_FROM_NAME") ?? string.Empty;

        if (!bool.TryParse(smtpSettings["Enabled"], out var enabled))
            enabled = true;

        if (!enabled)
        {
            logger.LogInformation("Email sending disabled in configuration. Skipping send.");
            return;
        }

        if (string.IsNullOrWhiteSpace(fromEmail) || string.IsNullOrWhiteSpace(fromName))
        {
            logger.LogError("FromEmail or FromName is not configured");
            throw new InvalidOperationException("FromEmail and FromName must be configured in SmtpSettings or as SMTP_FROM_EMAIL/SMTP_FROM_NAME environment variables.");
        }

        var emailProvider = configuredProvider;
        if (emailProvider == "auto")
        {
            var smtpHost = smtpSettings["Host"] ?? Environment.GetEnvironmentVariable("SMTP_HOST");
            var smtpUsername = smtpSettings["Username"] ?? Environment.GetEnvironmentVariable("SMTP_USERNAME");
            var smtpPassword = smtpSettings["Password"] ?? Environment.GetEnvironmentVariable("SMTP_PASSWORD");
            var sendGridApiKey = GetSendGridApiKey();

            if (HasValue(smtpHost) && HasValue(smtpUsername) && HasValue(smtpPassword))
            {
                emailProvider = "smtp";
            }
            else if (HasValue(sendGridApiKey))
            {
                emailProvider = "sendgrid";
            }
            else
            {
                emailProvider = "file";
            }
        }

        try
        {
            switch (emailProvider)
            {
                case "sendgrid":
                    var apiKey = GetSendGridApiKey();
                    if (!HasValue(apiKey))
                    {
                        logger.LogError("SendGrid API key is not configured");
                        throw new InvalidOperationException("SendGrid API key is not configured.");
                    }

                    await SendEmailWithSendGridAsync(to, subject, body, fromEmail, fromName, apiKey!);
                    break;

                case "file":
                case "pickupdirectory":
                    await SaveEmailToFileAsync(to, subject, body, fromEmail, fromName, smtpSettings["PickupDirectory"] ?? "emails");
                    break;

                default:
                    await SendEmailWithSmtpAsync(to, subject, body, smtpSettings, fromEmail, fromName);
                    break;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email with provider {Provider}", emailProvider);

            var useFallback = bool.TryParse(smtpSettings["UseFallback"], out var fallbackEnabled) && fallbackEnabled;
            if (useFallback)
            {
                var fallbackProvider = smtpSettings["FallbackProvider"]?.Trim().ToLowerInvariant() ?? "file";
                if (string.Equals(fallbackProvider, emailProvider, StringComparison.OrdinalIgnoreCase))
                {
                    fallbackProvider = "file";
                }

                try
                {
                    await SendEmailWithFallbackAsync(fallbackProvider, to, subject, body, fromEmail, fromName, smtpSettings);
                    return;
                }
                catch (Exception fallbackEx)
                {
                    logger.LogError(fallbackEx, "Email fallback provider {FallbackProvider} failed", fallbackProvider);
                    throw new InvalidOperationException($"Failed to send email using fallback provider: {fallbackEx.Message}", fallbackEx);
                }
            }

            throw new InvalidOperationException($"Failed to send email: {ex.Message}", ex);
        }
    }

    private async Task SendEmailWithFallbackAsync(
        string fallbackProvider,
        string to,
        string subject,
        string body,
        string fromEmail,
        string fromName,
        IConfigurationSection smtpSettings)
    {
        switch (fallbackProvider)
        {
            case "sendgrid":
                var fallbackApiKey = GetSendGridApiKey();
                if (!HasValue(fallbackApiKey))
                {
                    logger.LogWarning("SendGrid fallback skipped because API key is not configured.");
                    await SaveEmailToFileAsync(to, subject, body, fromEmail, fromName, smtpSettings["PickupDirectory"] ?? "emails");
                    return;
                }

                logger.LogWarning("Attempting email send via SendGrid fallback");
                await SendEmailWithSendGridAsync(to, subject, body, fromEmail, fromName, fallbackApiKey!);
                break;

            case "smtp":
                logger.LogWarning("Attempting email send via SMTP fallback");
                await SendEmailWithSmtpAsync(to, subject, body, smtpSettings, fromEmail, fromName);
                break;

            case "file":
            case "pickupdirectory":
            default:
                logger.LogWarning("Saving email to local pickup directory after provider failure");
                await SaveEmailToFileAsync(to, subject, body, fromEmail, fromName, smtpSettings["PickupDirectory"] ?? "emails");
                break;
        }
    }

    private string? GetSendGridApiKey()
    {
        var value = configuration["SendGridSettings:ApiKey"] ?? Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
        return HasValue(value) ? value : null;
    }

    private static bool HasValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return !PlaceholderValues.Any(placeholder =>
            string.Equals(value.Trim(), placeholder, StringComparison.OrdinalIgnoreCase));
    }

    private async Task SendEmailWithSmtpAsync(string to, string subject, string body, IConfigurationSection smtpSettings, string fromEmail, string fromName)
    {
        var host = smtpSettings["Host"] ?? Environment.GetEnvironmentVariable("SMTP_HOST");
        var portString = smtpSettings["Port"] ?? Environment.GetEnvironmentVariable("SMTP_PORT");
        var username = smtpSettings["Username"] ?? Environment.GetEnvironmentVariable("SMTP_USERNAME");
        var password = smtpSettings["Password"] ?? Environment.GetEnvironmentVariable("SMTP_PASSWORD");

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogError("SMTP settings are not properly configured");
            throw new InvalidOperationException("SMTP settings are not properly configured. Provide SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, FromEmail and FromName.");
        }

        var port = int.TryParse(portString, out var parsedPort) ? parsedPort : 587;
        using var client = new SmtpClient();

        var timeoutMs = int.Parse(smtpSettings["Timeout"] ?? "30000");
        client.Timeout = timeoutMs;

        client.CheckCertificateRevocation = false;
        client.ServerCertificateValidationCallback = (s, c, h, e) => true;

        try
        {
            var useImplicitSsl = bool.Parse(smtpSettings["UseImplicitSsl"] ?? "false");
            var requireSsl = bool.Parse(smtpSettings["EnableSsl"] ?? "false");

            if (useImplicitSsl || port == 465)
            {
                await client.ConnectAsync(host, port, SecureSocketOptions.SslOnConnect);
            }
            else if (requireSsl || port == 587)
            {
                await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            }
            else
            {
                await client.ConnectAsync(host, port, SecureSocketOptions.Auto);
            }

            await client.AuthenticateAsync(username, password);

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(new MailboxAddress("", to));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = body };

            await client.SendAsync(message);
            logger.LogInformation("Email sent successfully via SMTP");
            await client.DisconnectAsync(true);
        }
        catch (MailKit.Security.AuthenticationException authEx)
        {
            logger.LogError(authEx, "SMTP authentication failed. Check credentials.");
            throw new InvalidOperationException($"SMTP authentication failed: {authEx.Message}. Please check credentials.", authEx);
        }
    }

    private async Task SendEmailWithSendGridAsync(string to, string subject, string body, string fromEmail, string fromName, string apiKey)
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var payload = new
        {
            personalizations = new[]
            {
                new
                {
                    to = new[] { new { email = to } },
                    subject
                }
            },
            from = new { email = fromEmail, name = fromName },
            content = new[] { new { type = "text/html", value = body } }
        };

        var json = JsonSerializer.Serialize(payload);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await client.PostAsync("https://api.sendgrid.com/v3/mail/send", content);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            logger.LogError("SendGrid response error: {StatusCode} {ErrorBody}", response.StatusCode, errorBody);
            throw new InvalidOperationException($"SendGrid error: {(int)response.StatusCode} {response.ReasonPhrase}. {errorBody}");
        }

        logger.LogInformation("Email sent successfully via SendGrid");
    }

    private async Task SaveEmailToFileAsync(string to, string subject, string body, string fromEmail, string fromName, string pickupDirectory)
    {
        var directory = Path.GetFullPath(pickupDirectory);
        Directory.CreateDirectory(directory);

        var fileName = $"email_{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid()}.html";
        var filePath = Path.Combine(directory, fileName);

        var emailContent = $@"
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='utf-8'>
    <title>{subject}</title>
</head>
<body>
    <h3>From: {fromName} &lt;{fromEmail}&gt;</h3>
    <h4>To: {to}</h4>
    <h2>{subject}</h2>
    {body}
</body>
</html>";

        await File.WriteAllTextAsync(filePath, emailContent, Encoding.UTF8);
        logger.LogInformation("Email saved to local pickup directory: {FilePath}", filePath);
    }
}

