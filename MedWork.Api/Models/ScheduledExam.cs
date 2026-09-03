using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ScheduledExam
{
    public int Id { get; set; }

    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [Range(1, int.MaxValue)]
    public int ExamTypeId { get; set; }

    [Required]
    public DateTime DueDate { get; set; }

    public DateTime? CompletedDate { get; set; }

    public ScheduledExamStatus Status { get; set; } = ScheduledExamStatus.Planned;

    [StringLength(500)]
    public string? Notes { get; set; }

    [StringLength(300)]
    public string? Result { get; set; }

    [StringLength(200)]
    public string? PrescribedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Employee? Employee { get; set; }
    public ExamType? ExamType { get; set; }
}