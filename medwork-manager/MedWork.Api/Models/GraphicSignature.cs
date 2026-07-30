using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedWork.Api.Models;

/// <summary>
/// Rappresenta una firma grafometrica associata a un documento o visita medica
/// </summary>
public class GraphicSignature
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// ID dell'azienda a cui appartiene la firma (per il multi-tenancy)
    /// </summary>
    public int CompanyId { get; set; }

    /// <summary>
    /// Navigazione all'azienda
    /// </summary>
    [ForeignKey("CompanyId")]
    public Company? Company { get; set; }

    /// <summary>
    /// ID della visita medica associata (opzionale)
    /// </summary>
    public int? MedicalVisitId { get; set; }

    /// <summary>
    /// Navigazione alla visita medica
    /// </summary>
    [ForeignKey("MedicalVisitId")]
    public MedicalVisit? MedicalVisit { get; set; }

    /// <summary>
    /// ID del documento associato (opzionale, per future estensioni)
    /// </summary>
    public int? DocumentId { get; set; }

    /// <summary>
    /// Tipo di documento firmato (es. "FitnessJudgment", "SanitaryPlan", "Allegato3B")
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string DocumentType { get; set; } = default!;

    /// <summary>
    /// ID dell'entità che ha apposto la firma (dipendente, medico, etc.)
    /// </summary>
    public int? SignedById { get; set; }

    /// <summary>
    /// Tipo di soggetto che ha firmato (Employee, Doctor, etc.)
    /// </summary>
    [MaxLength(50)]
    public string? SignedByType { get; set; }

    /// <summary>
    /// Data e ora della firma
    /// </summary>
    public DateTime SignedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Dati della firma in formato PNG base64
    /// </summary>
    [Column(TypeName = "text")]
    public string SignatureData { get; set; } = default!;

    /// <summary>
    /// Nota opzionale sulla firma
    /// </summary>
    [MaxLength(500)]
    public string? Note { get; set; }

    /// <summary>
    /// Indica se la firma è stata verificata
    /// </summary>
    public bool IsVerified { get; set; }

    /// <summary>
    /// Data di creazione del record
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Data di ultima modifica
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}