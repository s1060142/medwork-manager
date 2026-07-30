using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitReportTra
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(100)]
    public string Nation { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
