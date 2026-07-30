using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class CompanyGroup
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Descrizione del gruppo
    /// </summary>
    [StringLength(200)]
    public string? Descrizione { get; set; }

    /// <summary>
    /// Ragione sociale
    /// </summary>
    [StringLength(200)]
    public string? RagioneSociale { get; set; }

    /// <summary>
    /// Indirizzo sede
    /// </summary>
    [StringLength(250)]
    public string? Indirizzo { get; set; }

    /// <summary>
    /// Città
    /// </summary>
    [StringLength(100)]
    public string? Citta { get; set; }

    /// <summary>
    /// CAP
    /// </summary>
    [StringLength(10)]
    public string? Cap { get; set; }

    /// <summary>
    /// Provincia (2 caratteri)
    /// </summary>
    [StringLength(2)]
    public string? Provincia { get; set; }

    /// <summary>
    /// Partita IVA
    /// </summary>
    [StringLength(11)]
    [RegularExpression("^[0-9]{11}$")]
    public string? PartitaIva { get; set; }

    /// <summary>
    /// Codice Fiscale
    /// </summary>
    [StringLength(16)]
    [RegularExpression("^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$")]
    public string? CodiceFiscale { get; set; }

    /// <summary>
    /// Archivio unico
    /// </summary>
    [StringLength(500)]
    public string? ArchivioUnico { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public ICollection<Company> Companies { get; set; } = new List<Company>();
}
