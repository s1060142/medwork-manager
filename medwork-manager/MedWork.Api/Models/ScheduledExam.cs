using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ScheduledExam
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [Range(1, int.MaxValue)]
    public int ExamTypeId { get; set; }

    [Required]
    public DateTime DueDate { get; set; }

    public ScheduledExamStatus Status { get; set; } = ScheduledExamStatus.Planned;

    public Employee? Employee { get; set; }
    public ExamType? ExamType { get; set; }
}