using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ExamType
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Name { get; set; } = string.Empty;

    [StringLength(120)]
    public string? Category { get; set; }

    [StringLength(50)]
    public string? Code { get; set; }

    public ICollection<VisitExam> VisitExams { get; set; } = new List<VisitExam>();
    public ICollection<ScheduledExam> ScheduledExams { get; set; } = new List<ScheduledExam>();
}
