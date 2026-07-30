using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Municipality
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(6)]
    public string IstatCode { get; set; } = string.Empty; // Codice ISTAT 6 cifre

    [StringLength(5)]
    public string? Cap { get; set; } // CAP

    [StringLength(10)]
    public string? BelfioreCode { get; set; } // Codice Belfiore

    public int ProvinceId { get; set; }
    public Province? Province { get; set; }

    public int RegionId { get; set; }
    public Region? Region { get; set; }

    public ICollection<Company> Companies { get; set; } = new List<Company>();
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
}