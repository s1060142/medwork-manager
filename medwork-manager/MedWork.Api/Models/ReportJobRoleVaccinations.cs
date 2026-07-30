using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ReportJobRoleVaccinations
{
    public int Id { get; set; }

    public int JobRoleId { get; set; }
    public JobRole? JobRole { get; set; }

    public int VaccineId { get; set; }
    public Vaccine? Vaccine { get; set; }

    public int PeriodicityMonths { get; set; }
    public bool IsMandatory { get; set; } = true;
}
