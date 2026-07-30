using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class WorkLocation
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Descrizione del luogo di lavoro
    /// </summary>
    [StringLength(200)]
    public string? Descrizione { get; set; }

    [StringLength(250)]
    public string? Address { get; set; }

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
    /// Provincia (sigla 2 caratteri)
    /// </summary>
    [StringLength(2)]
    public string? Provincia { get; set; }

    /// <summary>
    /// Stato attivo
    /// </summary>
    public bool Attivo { get; set; } = true;

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
