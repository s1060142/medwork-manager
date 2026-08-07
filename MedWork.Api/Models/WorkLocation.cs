namespace MedWork.Api.Models;

/// <summary>
/// Represents a work location / site for a company
/// </summary>
public class WorkLocation
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Descrizione { get; set; } = string.Empty;
    public string Citta { get; set; } = string.Empty;
    public string Cap { get; set; } = string.Empty;
    public string Provincia { get; set; } = string.Empty;
    public bool Attivo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";

    // Navigation properties
    public virtual Company? Company { get; set; }
    public virtual ICollection<SiteVisit>? SiteVisits { get; set; } = new List<SiteVisit>();
}
