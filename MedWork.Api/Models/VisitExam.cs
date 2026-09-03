using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitExam
{
    public int Id { get; set; }

    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int MedicalVisitId { get; set; }

    [Range(1, int.MaxValue)]
    public int ExamTypeId { get; set; }

    [Required]
    [StringLength(3000, MinimumLength = 2)]
    public string Result { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Notes { get; set; }

    [StringLength(300)]
    public string? ReferenceRange { get; set; }

    public bool IsAbnormal { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }
    public ExamType? ExamType { get; set; }
}