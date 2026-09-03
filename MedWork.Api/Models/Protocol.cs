using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Protocol
{
    public int Id { get; set; }

    public int TenantId { get; set; }

    [Required]
    [StringLength(160, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    [StringLength(30, MinimumLength = 2)]
    public string LawReference { get; set; } = string.Empty;

    [Range(1, 3650)]
    public int CadenceDays { get; set; } = 365;

    [StringLength(1000)]
    public string? Objective { get; set; }

    [StringLength(4000)]
    public string? RulesJson { get; set; }

    public int? JobRoleId { get; set; }

    public bool IsTemplate { get; set; } = false;

    public bool IsActive { get; set; } = true;

    public int Version { get; set; } = 1;

    public int? ParentProtocolId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public JobRole? JobRole { get; set; }
    public Protocol? ParentProtocol { get; set; }
    public ICollection<Protocol> ChildProtocols { get; set; } = new List<Protocol>();
    public ICollection<PersonalProtocol> PersonalProtocols { get; set; } = new List<PersonalProtocol>();
    public string Steps { get; set; } = "[]";
}