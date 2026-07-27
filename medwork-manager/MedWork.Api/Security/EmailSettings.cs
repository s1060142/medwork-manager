namespace MedWork.Api.Security;

public class EmailSettings
{
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 25;
    public string SmtpUser { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = false;
    public string FromAddress { get; set; } = "no-reply@medwork.it";
    public string FromDisplayName { get; set; } = "Suite MedWork - Medicina del Lavoro";
}
