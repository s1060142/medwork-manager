using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class TableLock
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string TableName { get; set; } = string.Empty;

    public int RecordId { get; set; }

    [Required]
    [StringLength(120)]
    public string LockedBy { get; set; } = string.Empty;

    public DateTime LockedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiresAt { get; set; }

    public bool IsActive { get; set; } = true;
}
