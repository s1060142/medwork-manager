using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class EmailSettings
{
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string SmtpServer { get; set; } = string.Empty;

    public int SmtpPort { get; set; } = 587;

    [Required]
    [StringLength(150)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Password { get; set; } = string.Empty;

    [StringLength(150)]
    public string FromEmail { get; set; } = string.Empty;

    [StringLength(150)]
    public string FromName { get; set; } = string.Empty;

    public bool EnableSsl { get; set; } = true;

    public bool IsDefault { get; set; } = false;
}
