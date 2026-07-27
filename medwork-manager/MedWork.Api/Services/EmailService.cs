using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using MedWork.Api.Security;

namespace MedWork.Api.Services;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string bodyHtml, byte[]? attachment = null, string? attachmentName = null, CancellationToken cancellationToken = default);
}

/// <summary>
/// Invio email reale via SMTP (System.Net.Mail). Se l'host non è configurato,
/// viene simulato (log a console) per permettere l'esecuzione in dev senza server SMTP.
/// </summary>
public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendAsync(string to, string subject, string bodyHtml, byte[]? attachment = null, string? attachmentName = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.SmtpHost))
        {
            // Dev-mode: nessun SMTP configurato → simula invio.
            Console.WriteLine($"[EmailService:SIMULATED] To={to} Subject=\"{subject}\" Attachment={(attachment?.Length ?? 0)} bytes");
            return;
        }

        using var mail = new MailMessage
        {
            From = new MailAddress(_settings.FromAddress, _settings.FromDisplayName),
            Subject = subject,
            Body = bodyHtml,
            IsBodyHtml = true
        };
        mail.To.Add(to);

        if (attachment is not null)
        {
            var stream = new MemoryStream(attachment);
            mail.Attachments.Add(new Attachment(stream, attachmentName ?? "convocazione.pdf", "application/pdf"));
        }

        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = _settings.EnableSsl,
            Credentials = string.IsNullOrWhiteSpace(_settings.SmtpUser)
                ? null
                : new NetworkCredential(_settings.SmtpUser, _settings.SmtpPassword)
        };

        await client.SendMailAsync(mail, cancellationToken);
    }
}
