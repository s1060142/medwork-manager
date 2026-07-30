using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Invoice
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int Number { get; set; }
    public int Year { get; set; }

    public DateTime Date { get; set; }
    public decimal Amount { get; set; }

    public int? ReferenceId { get; set; }

    public DateTime? PaymentDate1 { get; set; }
    public decimal? PaymentAmount1 { get; set; }
    [StringLength(10)]
    public string? PaymentType1 { get; set; }

    public DateTime? PaymentDate2 { get; set; }
    public decimal? PaymentAmount2 { get; set; }
    [StringLength(10)]
    public string? PaymentType2 { get; set; }

    [StringLength(20)]
    public string Status { get; set; } = "Aperta";

    [StringLength(2000)]
    public string? Details { get; set; }
}
