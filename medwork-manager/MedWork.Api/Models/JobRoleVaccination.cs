using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class JobRoleVaccination
{
    public int JobRoleId { get; set; }
    public JobRole? JobRole { get; set; }

    public int VaccinationId { get; set; }
    public Vaccination? Vaccination { get; set; }

    public int PeriodicityMonths { get; set; } = 12;
    public bool IsMandatory { get; set; } = true;
}
