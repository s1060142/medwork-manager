using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace MedWork.Api.Models;

public class MedicalVisit : IValidatableObject
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    // Nullable: when not supplied the server auto-assigns a doctor from the tenant.
    public int? DoctorId { get; set; }
    // Optional link to a personal protocol applied to this visit (AI‑assisted or custom)
    public int? PersonalProtocolId { get; set; }


    [Required]
    public DateTime VisitDate { get; set; }

    [Required]
    public DateTime NextDeadlineDate { get; set; }

    [Required]
    [StringLength(250, MinimumLength = 3)]
    public string Outcome { get; set; } = string.Empty;

    [StringLength(50)]
    public string? OutcomeCode { get; set; }

    [StringLength(4000)]
    public string? ClinicalNotes { get; set; }

    
    [Column(TypeName = "nvarchar(max)")]
    public string? OcrData { get; set; }

     [StringLength(500)]
    public string? VoiceNoteUrl { get; set; }


    public MedicalVisitType VisitType { get; set; } = MedicalVisitType.Periodic;

    [StringLength(2000)]
    public string? TargetOrgans { get; set; }

    [StringLength(4000)]
    public string? ObjectiveExam { get; set; }

    [StringLength(100)]
    public string? BloodPressure { get; set; }

    [StringLength(50)]
    public string? HeartRate { get; set; }

    [StringLength(50)]
    public string? Temperature { get; set; }

    [StringLength(50)]
    public string? SpO2 { get; set; }

    [StringLength(100)]
    public string? BMI { get; set; }

    public bool IsSigned { get; set; } = false;

    public DateTime? SignedAt { get; set; }

    [StringLength(200)]
    public string? SignatureImageUrl { get; set; }

    [StringLength(200)]
    public string? DigitalCertificateThumbprint { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Employee? Employee { get; set; }
    public Doctor? Doctor { get; set; }
    public Anamnesis? Anamnesis { get; set; }
    public PersonalProtocol? PersonalProtocol { get; set; }

    public ICollection<VisitExam> VisitExams { get; set; } = new List<VisitExam>();

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (NextDeadlineDate.Date < VisitDate.Date)
        {
            yield return new ValidationResult(
                "NextDeadlineDate must be greater than or equal to VisitDate.",
                new[] { nameof(NextDeadlineDate), nameof(VisitDate) });
        }
    }
}