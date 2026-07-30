using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitVmDrugs
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    // Anamnesi
    [StringLength(500)]
    public string? PsAcc { get; set; }
    [StringLength(500)]
    public string? PsMot { get; set; }
    public int? Ricoveri { get; set; }
    public int? AssMal { get; set; }
    public int? Infort { get; set; }
    public int? RitPat { get; set; }
    public int? DocSan { get; set; }
    public int? Segnal { get; set; }
    [StringLength(50)]
    public string? TipAcc { get; set; }

    // Sintomi
    public int? Nausea { get; set; }
    public int? Vomito { get; set; }
    public int? Insonn { get; set; }
    public int? Sonnol { get; set; }
    public int? Ansia { get; set; }
    public int? Agitaz { get; set; }
    public int? Tabagi { get; set; }
    public int? Sudora { get; set; }
    public int? Orripi { get; set; }
    public int? Appeti { get; set; }
    public int? TurMne { get; set; }
    public int? PerCol { get; set; }
    public int? IgPer { get; set; }
    public int? ApnNot { get; set; }
    [StringLength(500)]
    public string? NotVmt { get; set; }
    [StringLength(500)]
    public string? TerFar { get; set; }
    public int? PrePil { get; set; }
    public int? MucIpe { get; set; }
    public int? PerSet { get; set; }
    public int? Alitosi { get; set; }
    public int? CicNc { get; set; }
    public int? UstBru { get; set; }
    public int? Venipun { get; set; }
    public int? Tattoo { get; set; }
    public int? Piercin { get; set; }
    public int? SpiNev { get; set; }
    public int? PupRea { get; set; }
    public int? Isocori { get; set; }
    public int? Anisoco { get; set; }
    public int? Miosi { get; set; }
    public int? Midrias { get; set; }
    public int? IpeCon { get; set; }
    public int? Rot { get; set; }
    public int? Romberg { get; set; }
    [StringLength(500)]
    public string? Linguag { get; set; }
    public int? PrInN { get; set; }
    public int? Marcia { get; set; }
    public int? Acromet { get; set; }
    public int? OrSpT { get; set; }
    public int? Sensori { get; set; }
}
