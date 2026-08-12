using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Vaccination
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string VaccineName { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Manufacturer { get; set; }

    [StringLength(50)]
    public string? BatchNumber { get; set; }

    [Required]
    public DateTime DateAdministered { get; set; }

    public DateTime? NextDueDate { get; set; }

    [StringLength(200)]
    public string? AdministeredBy { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Employee? Employee { get; set; }
}