using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class FileUsage
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string FileName { get; set; } = string.Empty;

    [StringLength(500)]
    public string? FilePath { get; set; }

    public long FileSize { get; set; }

    public DateTime LastAccessed { get; set; } = DateTime.UtcNow;

    public int AccessCount { get; set; } = 0;

    [StringLength(120)]
    public string? LastAccessedBy { get; set; }
}
