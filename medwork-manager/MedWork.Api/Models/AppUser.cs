using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public enum UserRole
{
    Admin = 1,
    Doctor = 2,
    CompanyAdmin = 3,
    Employee = 4,
    HealthSurveillance = 5
}

public class AppUser
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [StringLength(40)]
    public string Role { get; set; } = UserRole.Employee.ToString();

    [StringLength(32)]
    public string? TaxCode { get; set; }

    [StringLength(120)]
    [EmailAddress]
    public string? Email { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int? DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Data creazione UTC
    /// </summary>
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Ultimo accesso UTC
    /// </summary>
    public DateTime? LastLoginAtUtc { get; set; }

    /// <summary>
    /// Flag per forzare cambio password al primo accesso
    /// </summary>
    public bool MustChangePassword { get; set; } = false;
}
