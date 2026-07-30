using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class JobRoleVaccination
{
    public int JobRoleId { get; set; }
    public JobRole? JobRole { get; set; }

    public int VaccineId { get; set; }
    public Vaccine? Vaccine { get; set; }

    public int PeriodicityMonths { get; set; } = 12;
    public bool IsMandatory { get; set; } = true;
}
