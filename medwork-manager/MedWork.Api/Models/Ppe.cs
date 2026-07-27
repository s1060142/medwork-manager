using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Dispositivo di Protezione Individuale (DPI) - PPE
/// </summary>
public class Ppe
{
    public int Id { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Category { get; set; } // Es: "Protezione vie respiratorie", "Protezione udito", "Protezione occhi", "Protezione testa", "Protezione mani", "Protezione piedi", "Protezione corpo", "Protezione cadute"

    [StringLength(100)]
    public string? Standard { get; set; } // Normativa di riferimento (es. EN 149, EN 352, EN 166)

    [StringLength(100)]
    public string? ProtectionLevel { get; set; } // Livello di protezione (es. FFP2, FFP3, SNR 30dB)

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(100)]
    public string? Manufacturer { get; set; }

    [StringLength(100)]
    public string? Model { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<EmployeePpe> EmployeePpes { get; set; } = new List<EmployeePpe>();
    public ICollection<JobRolePpe> JobRolePpes { get; set; } = new List<JobRolePpe>();
}

/// <summary>
/// Assegnazione DPI a lavoratore
/// </summary>
public class EmployeePpe
{
    public int EmployeeId { get; set; }
    public int PpeId { get; set; }

    [Required]
    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiryDate { get; set; } // Scadenza DPI (se applicabile)

    [StringLength(50)]
    public string? Size { get; set; } // Taglia

    [StringLength(100)]
    public string? SerialNumber { get; set; } // Numero di serie/matricola

    [StringLength(500)]
    public string? Notes { get; set; }

    public bool IsReturned { get; set; } = false;

    public DateTime? ReturnedDate { get; set; }

    // Navigation properties
    public Employee? Employee { get; set; }
    public Ppe? Ppe { get; set; }
}

/// <summary>
/// DPI richiesti per mansione
/// </summary>
public class JobRolePpe
{
    public int JobRoleId { get; set; }
    public int PpeId { get; set; }

    public bool IsMandatory { get; set; } = true;

    [StringLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    public JobRole? JobRole { get; set; }
    public Ppe? Ppe { get; set; }
}