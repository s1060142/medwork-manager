using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Signature
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Required]
    [StringLength(200)]
    public string Signer { get; set; } = string.Empty;

    [Required]
    [StringLength(128)]
    public string Hash { get; set; } = string.Empty;

    [StringLength(200)]
    public string? DocumentId { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant? Tenant { get; set; }
}
