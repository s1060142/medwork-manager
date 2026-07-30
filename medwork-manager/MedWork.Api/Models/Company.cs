using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Company
{
    public int Id { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^[A-Z]{2}[0-9]{11}$|^[0-9]{11}$")]
    public string VATNumber { get; set; } = string.Empty;

    /// <summary>
    /// Codice fiscale (per aziende italiane = P.IVA)
    /// </summary>
    [StringLength(16)]
    public string? TaxCode { get; set; }

    [EmailAddress]
    [StringLength(150)]
    public string? ContactEmail { get; set; }

    [Phone]
    [StringLength(30)]
    public string? ContactPhone { get; set; }

    /// <summary>
    /// Indirizzo sede legale
    /// </summary>
    [StringLength(250)]
    public string? Address { get; set; }

    /// <summary>
    /// Numero civico
    /// </summary>
    [StringLength(20)]
    public string? CivicNumber { get; set; }

    /// <summary>
    /// CAP
    /// </summary>
    [StringLength(10)]
    public string? PostalCode { get; set; }

    /// <summary>
    /// Comune
    /// </summary>
    [StringLength(100)]
    public string? City { get; set; }

    /// <summary>
    /// Provincia (sigla 2 caratteri)
    /// </summary>
    [StringLength(2)]
    public string? Province { get; set; }

    /// <summary>
    /// Codice fiscale rappresentante legale
    /// </summary>
    [StringLength(16)]
    public string? LegalRepresentativeTaxCode { get; set; }

    /// <summary>
    /// Regime fiscale (RF01=Ordinario, RF02=Minimi, ecc.)
    /// </summary>
    [StringLength(4)]
    public string? TaxRegime { get; set; } = "RF01";

    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<CompanyContact> CompanyContacts { get; set; } = new List<CompanyContact>();
    public ICollection<Department> Departments { get; set; } = new List<Department>();
    public ICollection<WorkLocation> WorkLocations { get; set; } = new List<WorkLocation>();
    public ICollection<SiteVisit> SiteVisits { get; set; } = new List<SiteVisit>();
}
