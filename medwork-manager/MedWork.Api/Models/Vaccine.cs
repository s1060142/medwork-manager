using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Vaccine
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Name { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Code { get; set; }

    public int? DefaultPeriodMonths { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public ICollection<VisitVaccination> VisitVaccinations { get; set; } = new List<VisitVaccination>();
    public ICollection<Vaccination> Vaccinations { get; set; } = new List<Vaccination>();
}
