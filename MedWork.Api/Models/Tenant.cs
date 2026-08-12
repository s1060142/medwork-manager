using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Tenant
{
    public int Id { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string Slug { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(200)]
    public string? LogoUrl { get; set; }

    [StringLength(200)]
    public string? PrimaryColor { get; set; }

    [StringLength(200)]
    public string? SecondaryColor { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Company> Companies { get; set; } = new List<Company>();
    public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<TenantSettings> Settings { get; set; } = new List<TenantSettings>();
}

public class TenantSettings
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Required]
    [StringLength(100)]
    public string Key { get; set; } = string.Empty;

    [StringLength(4000)]
    public string? Value { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public Tenant? Tenant { get; set; }
}