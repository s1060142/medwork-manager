using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitSpirometry
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public double? M_FVC_M { get; set; }
    public double? M_FVC_T { get; set; }
    public double? M_FEV1_M { get; set; }
    public double? M_FEV1_T { get; set; }
    public double? FVC_M { get; set; }
    public double? FVC_T { get; set; }
    public double? FEV1_FVC_M { get; set; }
    public double? FEV1_FVC_T { get; set; }
    public double? PEF_M { get; set; }
    public double? PEF_T { get; set; }
    public double? PEF_2575_M { get; set; }
    public double? PEF_2575_T { get; set; }
    public int? Outcome { get; set; }
    public double? FEF_25_T { get; set; }
    public double? FEF_25_M { get; set; }
    public double? FEF_50_T { get; set; }
    public double? FEF_50_M { get; set; }
    public double? FEF_75_T { get; set; }
    public double? FEF_75_M { get; set; }
    public int? Weight { get; set; }
    public int? Height { get; set; }
}
