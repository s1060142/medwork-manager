using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class PersonalProtocol
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [Range(1, int.MaxValue)]
    public int ProtocolId { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public bool IsOverride { get; set; } = true;

    [StringLength(1000)]
    public string? Notes { get; set; }

    public Employee? Employee { get; set; }
    public Protocol? Protocol { get; set; }
}