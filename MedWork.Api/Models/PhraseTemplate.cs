using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Reusable phrase library (FASE 1 - Cartella Sanitaria 3A).
/// Doctors pick pre-defined phrases for anamnesis / objective exam sections
/// instead of typing them from scratch. Supports fuzzy search and per-doctor favourites.
/// </summary>
public class PhraseTemplate
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    /// <summary>Section the phrase belongs to: Anamnesi, EsameObiettivo, Conclusioni, etc.</summary>
    [Required]
    [StringLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [StringLength(1000, MinimumLength = 2)]
    public string Text { get; set; } = string.Empty;

    /// <summary>Optional free tags for filtering (e.g. "cardiovascolare", "lavoro").</summary>
    [StringLength(250)]
    public string? Tags { get; set; }

    /// <summary>When set, the phrase is a personal favourite of a specific doctor.</summary>
    public int? DoctorId { get; set; }

    public bool IsFavourite { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Doctor? Doctor { get; set; }
}
