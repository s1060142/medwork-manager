using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ExportLog
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string ExportType { get; set; } = string.Empty; // CSV, Excel, PDF, XML

    [StringLength(200)]
    public string? FileName { get; set; }

    public int RecordsCount { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    [Required]
    [StringLength(120)]
    public string ExportedBy { get; set; } = string.Empty;

    public DateTime ExportedAt { get; set; } = DateTime.UtcNow;

    public long FileSizeBytes { get; set; }

    [StringLength(100)]
    public string? Status { get; set; } // Success, Failed

    [StringLength(2000)]
    public string? ErrorMessage { get; set; }
}
