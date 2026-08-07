using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class MedicalRecord
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [Required]
    [StringLength(4000, MinimumLength = 20)]
    public string MedicalHistory { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Notes { get; set; }

    [StringLength(2000)]
    public string? CurrentTherapies { get; set; }

    public MedicalRecordStatus Status { get; set; } = MedicalRecordStatus.Active;

    public Employee? Employee { get; set; }
}
