using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitExam
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int ExamTypeId { get; set; }
    public ExamType? ExamType { get; set; }

    [Required]
    [StringLength(3000)]
    public string Result { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Notes { get; set; }

    [StringLength(300)]
    public string? ReferenceRange { get; set; }
}
