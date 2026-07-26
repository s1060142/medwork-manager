namespace MedWork.Api.Models;

/// <summary>
/// Represents a group of companies for organizational purposes
/// </summary>
public class CompanyGroup
{
    public int Id { get; set; }
    public string Descrizione { get; set; } = string.Empty;
    public string RagioneSociale { get; set; } = string.Empty;
    public string Indirizzo { get; set; } = string.Empty;
    public string Citta { get; set; } = string.Empty;
    public string Cap { get; set; } = string.Empty;
    public string Provincia { get; set; } = string.Empty;
    public string PartitaIva { get; set; } = string.Empty;
    public string CodiceFiscale { get; set; } = string.Empty;
    public bool ArchivioUnico { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";

    // Navigation properties
    public virtual ICollection<Company>? Companies { get; set; } = new List<Company>();
}
