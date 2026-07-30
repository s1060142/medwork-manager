using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Province
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(2)]
    public string Code { get; set; } = string.Empty; // Sigla provincia (RN, MI, RM)

    public int RegionId { get; set; }
    public Region? Region { get; set; }

    public ICollection<Municipality> Municipalities { get; set; } = new List<Municipality>();
    public ICollection<Company> Companies { get; set; } = new List<Company>();
}