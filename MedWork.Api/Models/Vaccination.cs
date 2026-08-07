using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Vaccination
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string VaccineName { get; set; } = string.Empty;

    [Required]
    public DateTime DateAdministered { get; set; }

    public DateTime? NextDueDate { get; set; }

    public Employee? Employee { get; set; }
}