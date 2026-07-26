using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class MedicalVisit : IValidatableObject
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [Range(1, int.MaxValue)]
    public int DoctorId { get; set; }

    [Required]
    public DateTime VisitDate { get; set; }

    [Required]
    public DateTime NextDeadlineDate { get; set; }

    [Required]
    [StringLength(250, MinimumLength = 3)]
    public string Outcome { get; set; } = string.Empty;

    [StringLength(4000)]
    public string? ClinicalNotes { get; set; }

    public MedicalVisitType VisitType { get; set; } = MedicalVisitType.Periodic;

    [StringLength(2000)]
    public string? TargetOrgans { get; set; }

    [StringLength(4000)]
    public string? ObjectiveExam { get; set; }

    public Employee? Employee { get; set; }
    public Doctor? Doctor { get; set; }
    public Anamnesis? Anamnesis { get; set; }
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
