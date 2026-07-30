using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class MansioniVaccinazioni
{
    public int Id { get; set; }

    [StringLength(120)]
    public string Mansione { get; set; } = string.Empty;

    public int VaccineId { get; set; }
    public Vaccine? Vaccine { get; set; }

    public int ScadenzaMesi { get; set; } = 12;
}
