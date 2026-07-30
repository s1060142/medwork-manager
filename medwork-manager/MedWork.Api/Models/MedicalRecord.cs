using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class MedicalRecord
{
    /// <summary>
    /// Chiave primaria (EmployeeId per relazione 1:1)
    /// </summary>
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    [Required]
    [StringLength(4000)]
    public string MedicalHistory { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Notes { get; set; }

    [StringLength(2000)]
    public string? CurrentTherapies { get; set; }

    public MedicalRecordStatus Status { get; set; } = MedicalRecordStatus.Active;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}