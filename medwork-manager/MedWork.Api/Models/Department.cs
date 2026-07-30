using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Department
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Nome del reparto (alias per compatibilità)
    /// </summary>
    [StringLength(120)]
    public string? Nome { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Referente del reparto
    /// </summary>
    [StringLength(120)]
    public string? Referente { get; set; }

    /// <summary>
    /// Email del referente
    /// </summary>
    [EmailAddress]
    [StringLength(150)]
    public string? EmailReferente { get; set; }

    /// <summary>
    /// Stato attivo
    /// </summary>
    public bool Attivo { get; set; } = true;

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
