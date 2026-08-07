namespace MedWork.Api.Models;

/// <summary>
/// Represents key contacts within a company (RSPP, RLS, etc.)
/// </summary>
public class CompanyContact
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Ruolo { get; set; } = string.Empty; // RSPP, RLS, Dirigente, DL, etc.
    public string Nominativo { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";

    // Navigation properties
    public virtual Company? Company { get; set; }
}
