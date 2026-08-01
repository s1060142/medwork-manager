using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Attività/Task per il dashboard utente
/// </summary>
public class Activity
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    [Range(1, int.MaxValue)]
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = string.Empty; // "SCADENZE", "FATTURE", "PROTOCOLLI", "VISITE", "VACCINAZIONI", "NOMINE"

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = "Aperta"; // "Aperta", "In corso", "Completata", "Annullata", "Scaduta"

    [StringLength(50)]
    public string Priority { get; set; } = "Normale"; // "Bassa", "Normale", "Alta", "Urgente"

    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }

    public int? RelatedEntityId { get; set; }
    [StringLength(50)]
    public string? RelatedEntityType { get; set; } // "MedicalVisit", "Invoice", "Accreditation", "Protocol", "Vaccination"

    [Range(1, int.MaxValue)]
    public int AssignedToUserId { get; set; }
    public AppUser? AssignedToUser { get; set; }

    [Range(1, int.MaxValue)]
    public int CreatedByUserId { get; set; }
    public AppUser? CreatedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }

    public bool IsSystemGenerated { get; set; } = false;
}