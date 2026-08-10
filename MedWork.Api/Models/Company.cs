using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Company
{
    public int Id { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [RegularExpression("^[A-Z]{2}[0-9]{11}$|^[0-9]{11}$")]
    public string? VATNumber { get; set; }

    [EmailAddress]
    [StringLength(150)]
    public string? ContactEmail { get; set; }

    [Phone]
    [StringLength(30)]
    public string? ContactPhone { get; set; }

    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<CompanyContact> CompanyContacts { get; set; } = new List<CompanyContact>();
    public ICollection<Department> Departments { get; set; } = new List<Department>();
    public ICollection<WorkLocation> WorkLocations { get; set; } = new List<WorkLocation>();
    public ICollection<SiteVisit> SiteVisits { get; set; } = new List<SiteVisit>();
}
