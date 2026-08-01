using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Tracciamento esportazione cartella sanitaria
/// </summary>
public class HealthRecordExport
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    [Range(1, int.MaxValue)]
    public int RequestedByUserId { get; set; }
    public AppUser? RequestedByUser { get; set; }

    [Required]
    [StringLength(50)]
    public string ExportType { get; set; } = "All"; // "All", "Period"

    public DateTime? PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }

    public bool IncludeAttachments { get; set; } = true;
    public bool IncludeServices { get; set; } = true;
    public bool IncludePrivacyInfo { get; set; } = true;

    [StringLength(50)]
    public string Status { get; set; } = "Pending"; // "Pending", "Processing", "Completed", "Failed", "Downloaded"

    [StringLength(500)]
    public string? FilePath { get; set; }

    [StringLength(100)]
    public string? FileName { get; set; }

    public long? FileSizeBytes { get; set; }

    [StringLength(2000)]
    public string? ErrorMessage { get; set; }

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public DateTime? DownloadedAt { get; set; }

    public int DownloadCount { get; set; } = 0;

    [StringLength(1000)]
    public string? Notes { get; set; }
}