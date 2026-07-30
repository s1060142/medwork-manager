using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class CompanyPerson
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    [StringLength(10)]
    public string PersonType { get; set; } = string.Empty; // RSPP, RLS, MC, ecc.

    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public bool IsActive { get; set; } = true;
}
