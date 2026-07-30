using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitDrugTest
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int UrineQuantity { get; set; }

    public double? Mdma { get; set; }
    public double? Opiates { get; set; }
    public double? Mtd { get; set; }
    public double? Methamphetamine { get; set; }
    public double? Amphetamine { get; set; }
    public double? Cocaine { get; set; }
    public double? Thc { get; set; }
    public double? Bup { get; set; }

    public double? DeclaredMedications { get; set; }
    public double? DrugHandling { get; set; }
}
