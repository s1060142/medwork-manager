using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class CompanyContact
{
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string ContactType { get; set; } = string.Empty; // RSPP, RLS, MC, ASPP, ecc.

    /// <summary>
    /// Ruolo del contatto
    /// </summary>
    [StringLength(120)]
    public string? Ruolo { get; set; }

    [Required]
    [StringLength(150)]
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Nominativo completo
    /// </summary>
    [StringLength(120)]
    public string? Nominativo { get; set; }

    [StringLength(150)]
    public string? Email { get; set; }

    [StringLength(30)]
    public string? Phone { get; set; }

    /// <summary>
    /// Telefono
    /// </summary>
    [StringLength(30)]
    public string? Telefono { get; set; }

    [StringLength(30)]
    public string? Mobile { get; set; }

    public DateTime? AppointmentDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }
}
