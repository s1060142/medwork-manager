using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class PersonalProtocol
{
    /// <summary>
    /// Identificativo univoco (per compatibilità con controller)
    /// </summary>
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int ProtocolId { get; set; }
    public Protocol? Protocol { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Data assegnazione (alias per compatibilità)
    /// </summary>
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Data assegnazione (legacy)
    /// </summary>
    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;

    public DateTime? CompletionDate { get; set; }

    /// <summary>
    /// Flag per override protocollo standard
    /// </summary>
    public bool IsOverride { get; set; } = false;
}
