using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ExamType
{
    public int Id { get; set; }

    public int TenantId { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(120)]
    public string? Category { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(100)]
    public string? Unit { get; set; }

    [StringLength(300)]
    public string? ReferenceRange { get; set; }

    [StringLength(50)]
    public string? LOINCCode { get; set; }

    public bool RequiresNumericResult { get; set; } = false;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ICollection<VisitExam> VisitExams { get; set; } = new List<VisitExam>();
    public ICollection<ScheduledExam> ScheduledExams { get; set; } = new List<ScheduledExam>();
}