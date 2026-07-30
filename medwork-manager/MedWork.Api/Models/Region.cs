using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Region
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(3)]
    public string Code { get; set; } = string.Empty; // Codice ISTAT regione

    public ICollection<Province> Provinces { get; set; } = new List<Province>();
    public ICollection<Company> Companies { get; set; } = new List<Company>();
}