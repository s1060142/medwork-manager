using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class CompanyService
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int ServiceCode { get; set; }

    public DateTime ServiceDate { get; set; }
    public int ServiceNumber { get; set; }
    public decimal ServicePrice { get; set; }
    public decimal ServiceVat { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public decimal? Hours { get; set; }

    public int? InvoiceNumber { get; set; }
    public int? InvoiceYear { get; set; }

    public DateTime? ExpiryDate { get; set; }
}
