using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ScheduledExam
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int ExamTypeId { get; set; }
    public ExamType? ExamType { get; set; }

    public DateTime ScheduledDate { get; set; }

    /// <summary>
    /// Alias per compatibilità con controller che usano DueDate
    /// </summary>
    public DateTime DueDate 
    { 
        get => ScheduledDate; 
        set => ScheduledDate = value; 
    }

    public ScheduledExamStatus Status { get; set; } = ScheduledExamStatus.Planned;

    [StringLength(500)]
    public string? Notes { get; set; }
}