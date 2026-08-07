using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ExamType
{
    public int Id { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(120)]
    public string? Category { get; set; }

    public ICollection<VisitExam> VisitExams { get; set; } = new List<VisitExam>();
}
