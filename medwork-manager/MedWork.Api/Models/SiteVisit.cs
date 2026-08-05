using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class SiteVisit
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public DateTime VisitDate { get; set; }

    /// <summary>
    /// Data del sopralluogo
    /// </summary>
    public DateTime Data { get; set; }

    public int? BranchId { get; set; }
    public Branch? Branch { get; set; }

    /// <summary>
    /// Struttura visitata
    /// </summary>
    [StringLength(250)]
    public string? StrutturaVisitata { get; set; }

    /// <summary>
    /// Luogo del sopralluogo
    /// </summary>
    [StringLength(250)]
    public string? Luogo { get; set; }

    /// <summary>
    /// Medico responsabile
    /// </summary>
    [StringLength(120)]
    public string? Medico { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    /// <summary>
    /// Periodicità del sopralluogo
    /// </summary>
    [StringLength(100)]
    public string? Periodicita { get; set; }

    /// <summary>
    /// Scadenza prossimo sopralluogo
    /// </summary>
    public DateTime? Scadenza { get; set; }

    public bool IsInvoiced { get; set; }
    public int? InvoiceNumber { get; set; }
    public int? InvoiceYear { get; set; }

    public decimal Price { get; set; }
    public decimal Vat { get; set; }

    [StringLength(250)]
    public string? Location { get; set; }

    /// <summary>
    /// Utente che ha creato il record
    /// </summary>
    [StringLength(120)]
    public string? CreatedBy { get; set; }
}
