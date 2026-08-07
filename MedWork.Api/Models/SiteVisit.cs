namespace MedWork.Api.Models;

/// <summary>
/// Represents a site visit (sopralluogo) conducted at a work location
/// </summary>
public class SiteVisit
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string StrutturaVisitata { get; set; } = string.Empty;
    public string Luogo { get; set; } = string.Empty;
    public string Medico { get; set; } = string.Empty;
    public DateTime Data { get; set; }
    public string Periodicita { get; set; } = string.Empty;
    public DateTime? Scadenza { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";

    // Navigation properties
    public virtual Company? Company { get; set; }
}
