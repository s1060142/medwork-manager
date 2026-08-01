using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class MedicalVisit
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    public DateTime VisitDate { get; set; }
    public TimeOnly? VisitTime { get; set; }

    public MedicalVisitType VisitType { get; set; } = MedicalVisitType.Periodic;

    [StringLength(50)]
    public string? SchedulingCode { get; set; }

    [StringLength(50)]
    public string? ExamCode { get; set; }

    [StringLength(50)]
    public string? RiskCode { get; set; }

    [StringLength(50)]
    public string? OutcomeCode { get; set; }

    /// <summary>
    /// Esito della visita (testo libero per compatibilità)
    /// </summary>
    [StringLength(4000)]
    public string? Outcome { get; set; }

    [StringLength(4000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Note cliniche (per compatibilità con DoctorCrudController)
    /// </summary>
    [StringLength(4000)]
    public string? ClinicalNotes { get; set; }

    public decimal? Weight { get; set; }
    public int? HeartRate { get; set; }
    public int? SystolicPressure { get; set; }
    public int? DiastolicPressure { get; set; }

    public int FitnessOutcome { get; set; }

    [StringLength(4000)]
    public string? UnfitNotes { get; set; }

    [StringLength(4000)]
    public string? Pathologies { get; set; }

    public int? JobRoleId { get; set; }
    public JobRole? JobRole { get; set; }

    public int VisitTypeDetail { get; set; }
    public int Periodicity { get; set; }
    public int? ReasonForVisit { get; set; }

    public int? ValidationCode { get; set; }

    public DateTime? LastTidDate { get; set; }
    [StringLength(50)]
    public string? TidType { get; set; }

    public int? AnalyticalInterval { get; set; }

    [StringLength(1)]
    public string? ConEsito { get; set; }

    public int? NotCoe { get; set; }

    public int? ValidityDays { get; set; }

    [StringLength(1)]
    public string? PrescriptionRequired { get; set; }

    public int? IdoneitaLavorativa { get; set; }

    [StringLength(1)]
    public string? InvoiceFlag { get; set; }

    public DateTime? PrescriptionExpiry { get; set; }

    public DateTime? EmployeeTidDate { get; set; }
    [StringLength(50)]
    public string? EmployeeTidType { get; set; }

    [StringLength(4000)]
    public string? RiskAssessment { get; set; }

    public double? UnfitNotes2 { get; set; }

    /// <summary>
    /// Data scadenza prossima visita (per compatibilità DoctorCrudController)
    /// </summary>
    public DateTime? NextDeadlineDate { get; set; }

    [StringLength(4000)]
    public string? Signature { get; set; }

    public int? InvoiceNumber { get; set; }
    public int? InvoiceYear { get; set; }

    [StringLength(1)]
    public string? NoExpiry { get; set; }

    [StringLength(1)]
    public string? IsAltered { get; set; }

    [StringLength(1)]
    public string? No3b { get; set; }

    public int? UnfitNew { get; set; }

    /// <summary>
    /// Organi bersaglio (per compatibilità DoctorCrudController)
    /// </summary>
    [StringLength(2000)]
    public string? TargetOrgans { get; set; }

    /// <summary>
    /// Esame obiettivo (per compatibilità DoctorCrudController)
    /// </summary>
    [StringLength(4000)]
    public string? ObjectiveExam { get; set; }

    // Navigation
    public ICollection<VisitExam> Exams { get; set; } = new List<VisitExam>();
    public Anamnesis? Anamnesis { get; set; }
}
