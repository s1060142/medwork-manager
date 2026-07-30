using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitVisioTest
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    [StringLength(10)]
    public string? DifficultyType { get; set; } // I, L, M
    [StringLength(1)]
    public string? UsesLenses { get; set; }
    [StringLength(10)]
    public string? LensType { get; set; }
    [StringLength(20)]
    public string? CorrectionOD { get; set; }
    [StringLength(20)]
    public string? CorrectionOS { get; set; }
    public int? LastControl { get; set; }
    public int? Observations { get; set; }

    // Test Lontano (TL)
    [StringLength(1)]
    public string? TL_Es_Lent { get; set; }
    public int? TL_OD_Test { get; set; }
    [StringLength(20)]
    public string? TL_OD_Asti { get; set; }
    [StringLength(1)]
    public string? TL_OD_Iper { get; set; }
    public int? TL_OS_Test { get; set; }
    [StringLength(20)]
    public string? TL_OS_Asti { get; set; }
    [StringLength(1)]
    public string? TL_OS_Iper { get; set; }
    public int? TL_Bi_Test { get; set; }
    [StringLength(20)]
    public string? TL_Bi_Ster { get; set; }
    [StringLength(10)]
    public string? TL_Am_Test { get; set; }
    [StringLength(10)]
    public string? TL_Fo_Test { get; set; }
    [StringLength(20)]
    public string? TL_Pc_Test { get; set; }

    // Test Vicino (TV)
    [StringLength(1)]
    public string? TV_Es_Lent { get; set; }
    public int? TV_OD_Test { get; set; }
    [StringLength(20)]
    public string? TV_OD_Asti { get; set; }
    [StringLength(1)]
    public string? TV_OD_Iper { get; set; }
    public int? TV_OS_Test { get; set; }
    [StringLength(20)]
    public string? TV_OS_Asti { get; set; }
    [StringLength(1)]
    public string? TV_OS_Iper { get; set; }
    public int? TV_Bi_Test { get; set; }
    [StringLength(20)]
    public string? TV_Bi_Ster { get; set; }
    [StringLength(10)]
    public string? TV_Am_Test { get; set; }
    [StringLength(10)]
    public string? TV_Fo_Test { get; set; }
    [StringLength(20)]
    public string? TV_Pc_Test { get; set; }

    [StringLength(10)]
    public string? Visione_Vi { get; set; }
    public double? Conc_Visio { get; set; }

    // Test Intermedio (TI)
    [StringLength(1)]
    public string? TI_Es_Lent { get; set; }
    public int? TI_OD_Test { get; set; }
    [StringLength(20)]
    public string? TI_OD_Asti { get; set; }
    [StringLength(1)]
    public string? TI_OD_Iper { get; set; }
    public int? TI_OS_Test { get; set; }
    [StringLength(20)]
    public string? TI_OS_Asti { get; set; }
    [StringLength(1)]
    public string? TI_OS_Iper { get; set; }
    public int? TI_Bi_Test { get; set; }
    [StringLength(20)]
    public string? TI_Bi_Ster { get; set; }
    [StringLength(10)]
    public string? TI_Am_Test { get; set; }
    [StringLength(10)]
    public string? TI_Fo_Test { get; set; }
    [StringLength(20)]
    public string? TI_Pc_Test { get; set; }

    // Convergenza (CV)
    public int? CV_OR_OD { get; set; }
    public int? CV_OR_OS { get; set; }
    [StringLength(10)]
    public string? Visione_CV { get; set; }
    [StringLength(500)]
    public string? Conc_CV { get; set; }
}
