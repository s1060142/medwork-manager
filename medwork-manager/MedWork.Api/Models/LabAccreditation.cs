using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Accreditamento al laboratorio per invio campioni/esami
/// </summary>
public class LabAccreditation
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    [Required]
    [StringLength(200)]
    public string LaboratoryName { get; set; } = string.Empty;

    [StringLength(500)]
    public string? LaboratoryAddress { get; set; }

    [StringLength(150)]
    [EmailAddress]
    public string? LaboratoryEmail { get; set; }

    [StringLength(30)]
    [Phone]
    public string? LaboratoryPhone { get; set; }

    [StringLength(100)]
    public string? ContactPerson { get; set; }

    [StringLength(2000)]
    public string? AccreditedExams { get; set; } // JSON array of exam types

    public DateTime AccreditationDate { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiryDate { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = "Attivo"; // "Attivo", "Scaduto", "Sospeso", "Revoca"

    [StringLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [StringLength(120)]
    public string? CreatedBy { get; set; }
}