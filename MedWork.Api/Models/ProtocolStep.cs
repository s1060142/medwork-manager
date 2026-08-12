using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ProtocolStep
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int ProtocolId { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    [StringLength(50)]
    public string StepType { get; set; } = string.Empty;

    public int SortOrder { get; set; } = 0;

    [StringLength(4000)]
    public string? ConfigurationJson { get; set; }

    public bool IsRequired { get; set; } = true;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Protocol? Protocol { get; set; }
}