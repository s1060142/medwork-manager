using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Integrated questionnaire template (FASE 1 - Cartella Sanitaria 3A).
/// Supports standard occupational-medicine screenings: DMS, Audit C, NIOSH, and custom risk questionnaires.
/// </summary>
public class Questionnaire
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    /// <summary>Type discriminator: DMS, AuditC, NIOSH, Custom.</summary>
    [Required]
    [StringLength(50)]
    public string Type { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>Risk factor this questionnaire is associated with (e.g. "chimico", "videoterminali").</summary>
    [StringLength(100)]
    public string? RiskFactor { get; set; }

    /// <summary>JSON definition of items: [{ id, text, options:[{label,score}], maxScore }].</summary>
    [Required]
    public string DefinitionJson { get; set; } = "[]";

    /// <summary>Score above which the result is flagged as anomalous.</summary>
    public int? AnomalyThreshold { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant? Tenant { get; set; }
}

/// <summary>
/// A worker's filled-in questionnaire response with computed score and anomaly flag.
/// </summary>
public class QuestionnaireResponse
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    public int QuestionnaireId { get; set; }

    public int EmployeeId { get; set; }

    public int MedicalVisitId { get; set; }

    /// <summary>JSON of answers: [{ itemId, optionIndex }].</summary>
    [Required]
    public string AnswersJson { get; set; } = "[]";

    /// <summary>Total score computed by IQuestionnaireScoringService.</summary>
    public int Score { get; set; }

    public bool IsAnomalous { get; set; }

    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant? Tenant { get; set; }
    public Questionnaire? Questionnaire { get; set; }
    public Employee? Employee { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }
}
