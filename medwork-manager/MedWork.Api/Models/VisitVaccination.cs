using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitVaccination
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int VaccineId { get; set; }
    public Vaccine? Vaccine { get; set; }

    public DateTime VaccinationDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public int? PeriodMonths { get; set; }

    public bool IsInvoiced { get; set; }

    public int? InvoiceNumber { get; set; }
    public int? InvoiceYear { get; set; }

    public DateTime? ExpiryDate { get; set; }
}
