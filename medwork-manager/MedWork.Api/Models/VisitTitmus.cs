using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitTitmus
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    // Titmus Light (TL) - Vision Binoculare
    public int? TL_VB_4Cubi { get; set; }
    public int? TL_VB_2Cubi { get; set; }
    public int? TL_VB_3Cubi { get; set; }
    public bool? TL_VB_Buona { get; set; }
    public bool? TL_VB_Alterata { get; set; }
    public bool? TL_VB_Iper_Si { get; set; }
    public bool? TL_VB_Iper_No { get; set; }

    public string? TL_AB_Valori { get; set; }
    public string? TL_AB_Visus { get; set; }
    public string? TL_ODX_Valori { get; set; }
    public string? TL_ODX_Visus { get; set; }
    public string? TL_OSX_Valori { get; set; }
    public string? TL_OSX_Visus { get; set; }
    public string? TL_Ste_Valori { get; set; }
    public bool? TL_Ste_Buona { get; set; }
    public bool? TL_Ste_Alterata { get; set; }
    public string? TL_Col_Valori { get; set; }
    public bool? TL_Col_Buona { get; set; }
    public bool? TL_Col_Sufficiente { get; set; }
    public bool? TL_Col_Insufficiente { get; set; }
    public bool? TL_Col_Dubbia { get; set; }
    public string? TL_Fov_Valori { get; set; }
    public bool? TL_Fov_Ip_Sx { get; set; }
    public bool? TL_Fov_Ortof { get; set; }
    public bool? TL_Fov_Ip_Dx { get; set; }
    public string? TL_Fol_Valori { get; set; }
    public bool? TL_Fol_Esot { get; set; }
    public bool? TL_Fol_Ortof { get; set; }
    public bool? TL_Fol_Exot { get; set; }

    // Titmus Vision (TV)
    public int? TV_VB_4Cubi { get; set; }
    public int? TV_VB_2Cubi { get; set; }
    public int? TV_VB_3Cubi { get; set; }
    public bool? TV_VB_Buona { get; set; }
    public bool? TV_VB_Alterata { get; set; }
    public bool? TV_VB_Iper_Sn { get; set; }
    public string? TV_AB_Valori { get; set; }
    public string? TV_AB_Visus { get; set; }
    public string? TV_ODX_Valori { get; set; }
    public string? TV_ODX_Visus { get; set; }
    public string? TV_OSX_Valori { get; set; }
    public string? TV_OSX_Visus { get; set; }
    public string? TV_Ste_Valori { get; set; }
    public bool? TV_Ste_Buona { get; set; }
    public bool? TV_Ste_Alterata { get; set; }
    public string? TV_Col_Valori { get; set; }
    public bool? TV_Col_Buona { get; set; }
    public bool? TV_Col_Sufficiente { get; set; }
    public bool? TV_Col_Insufficiente { get; set; }
    public bool? TV_Col_Dubbia { get; set; }
    public string? TV_Fov_Valori { get; set; }
    public bool? TV_Fov_Ip_Sx { get; set; }
    public bool? TV_Fov_Ortof { get; set; }
    public bool? TV_Fov_Ip_Dx { get; set; }
    public string? TV_Fol_Valori { get; set; }
    public bool? TV_Fol_Esot { get; set; }
    public bool? TV_Fol_Ortof { get; set; }
    public bool? TV_Fol_Exot { get; set; }

    // Titmus Intermediate (TI)
    public int? TI_Dis_2050 { get; set; }
    public int? TI_Dis_2257 { get; set; }
    public int? TI_Dis_2666 { get; set; }
    public int? TI_Dis_3180 { get; set; }
    public int? TI_Dis_40100 { get; set; }
    public string? TI_AB_Valori { get; set; }
    public string? TI_AB_Visus { get; set; }
    public string? TI_ODX_Valori { get; set; }
    public string? TI_ODX_Visus { get; set; }
    public string? TI_OSX_Valori { get; set; }
    public string? TI_OSX_Visus { get; set; }

    // Convergenza (CV)
    public int? CV_TDX_85 { get; set; }
    public int? CV_TDX_70 { get; set; }
    public int? CV_TDX_55 { get; set; }
    public int? CV_TDX_45 { get; set; }
    public int? CV_TDX_Tot { get; set; }
    public int? CV_TSX_85 { get; set; }
    public int? CV_TSX_70 { get; set; }
    public int? CV_TSX_55 { get; set; }
    public int? CV_TSX_45 { get; set; }
    public int? CV_TSX_Tot { get; set; }
    public int? CV_Bin_Tot { get; set; }
    public bool? CV_Sufficiente { get; set; }
    public bool? CV_Insufficiente { get; set; }
    public bool? Visus_Normale { get; set; }
    public bool? Visus_Dif_Lontano { get; set; }
    public bool? Visus_Dif_Intermedio { get; set; }
    public bool? Visus_Dif_Vicino { get; set; }
    public bool? Lenti_Contatto { get; set; }
    public bool? Occhiali { get; set; }
    public string? Tipo_Occhiali { get; set; }

    public string? TL_Note { get; set; }
    public string? TL_AB_Note { get; set; }
    public string? TL_ODX_Note { get; set; }
    public string? TL_OSX_Note { get; set; }
    public string? TV_Note { get; set; }
    public string? TV_AB_Note { get; set; }
    public string? TV_ODX_Note { get; set; }
    public string? TV_OSX_Note { get; set; }
    public string? TI_Note { get; set; }
    public string? TI_AB_Note { get; set; }
    public string? TI_ODX_Note { get; set; }
    public string? TI_OSX_Note { get; set; }
}
