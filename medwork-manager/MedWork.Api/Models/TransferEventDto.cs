using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// DTO per evento trasferimento/mansione da sistema HR
/// </summary>
public class TransferEventDto
{
    [Required]
    public int CompanyId { get; set; }

    [Required]
    [StringLength(16)]
    public string TaxCode { get; set; } = string.Empty;

    public int EmployeeId { get; set; }

    [Required]
    public DateTime EffectiveDate { get; set; }

    [StringLength(120)]
    public string? NewJobRole { get; set; }

    public int? NewJobRoleId { get; set; }

    public int? NewBranchId { get; set; }

    public int? NewDepartmentId { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}
