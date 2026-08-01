using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// DTO per evento assunzione da sistema HR
/// </summary>
public class HireEventDto
{
    [Required]
    public int CompanyId { get; set; }

    [Required]
    public int BranchId { get; set; }

    [Required]
    [StringLength(16)]
    public string TaxCode { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public DateTime BirthDate { get; set; }

    [Required]
    [RegularExpression("^[MF]$")]
    public string Gender { get; set; } = "M";

    [Required]
    [StringLength(120)]
    public string BirthCity { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^[A-Z][0-9]{3}$")]
    public string BirthCityCode { get; set; } = string.Empty;

    [StringLength(150)]
    [EmailAddress]
    public string? PersonalEmail { get; set; }

    [StringLength(30)]
    [Phone]
    public string? PhoneNumber { get; set; }

    [Required]
    [StringLength(120)]
    public string JobRole { get; set; } = string.Empty;

    public int? JobRoleId { get; set; }

    public int? DepartmentId { get; set; }

    [Required]
    public DateTime HireDate { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}