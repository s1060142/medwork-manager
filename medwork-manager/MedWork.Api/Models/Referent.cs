using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Referent
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Role { get; set; } // Datore di lavoro, RSPP, RLS, MC, ASPP

    [StringLength(150)]
    public string? Email { get; set; }

    [StringLength(30)]
    public string? Phone { get; set; }

    [StringLength(30)]
    public string? Mobile { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    public bool IsActive { get; set; } = true;
}
