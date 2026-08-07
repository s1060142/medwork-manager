using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Branch
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }

    [Required]
    [StringLength(250, MinimumLength = 5)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string City { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Province { get; set; }

    [StringLength(10)]
    public string? PostalCode { get; set; }

    public Company? Company { get; set; }
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
