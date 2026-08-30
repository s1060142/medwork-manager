using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedWork.Api.Models;

public class BillingDocument
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }

    [StringLength(30)]
    public string Period { get; set; } = string.Empty; // "YYYY-MM"

    [StringLength(50)]
    public string InvoiceNumber { get; set; } = string.Empty;

    public int VisitCount { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Amount { get; set; }

    [StringLength(30)]
    public string Status { get; set; } = "emesso"; // bozza / emesso / pagato / scaduto

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    [StringLength(120)]
    public string? GeneratedById { get; set; }

    // Navigation
    public Tenant? Tenant { get; set; }
    public Company? Company { get; set; }
}
