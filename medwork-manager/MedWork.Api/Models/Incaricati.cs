using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Incaricato
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Role { get; set; }

    [StringLength(32)]
    public string? TaxCode { get; set; }

    [StringLength(150)]
    public string? Email { get; set; }

    [StringLength(30)]
    public string? Phone { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    public DateTime? AppointmentDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    public bool IsActive { get; set; } = true;
}
