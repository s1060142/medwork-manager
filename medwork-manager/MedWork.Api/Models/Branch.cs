using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Branch
{
    public int Id { get; set; }

    [Required]
    [StringLength(250)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string City { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Province { get; set; }

    [StringLength(10)]
    public string? PostalCode { get; set; }

    [StringLength(30)]
    public string? Phone { get; set; }

    [StringLength(150)]
    public string? Description { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<SiteVisit> SiteVisits { get; set; } = new List<SiteVisit>();
}
