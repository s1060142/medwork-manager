using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class PersonalProtocol
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [Range(1, int.MaxValue)]
    public int ProtocolId { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiresAt { get; set; }

    public bool IsOverride { get; set; } = true;

    [StringLength(1000)]
    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Employee? Employee { get; set; }
    public Protocol? Protocol { get; set; }
}