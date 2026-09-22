using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class StaffDocument
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int DoctorId { get; set; }

    [Required]
    [StringLength(50)]
    public string DocumentType { get; set; } = "IscrizioneOrdine"; // IscrizioneOrdine, PolizzaAssicurativa, CertificatoDigitale, Altro

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(500)]
    public string? FilePath { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Doctor? Doctor { get; set; }
}
