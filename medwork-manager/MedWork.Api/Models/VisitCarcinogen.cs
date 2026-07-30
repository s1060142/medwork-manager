using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Carcinogen
{
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(50)]
    public string? CasNumber { get; set; }

    public ICollection<VisitCarcinogen> VisitCarcinogens { get; set; } = new List<VisitCarcinogen>();
}

public class VisitCarcinogen
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int CarcinogenId { get; set; }
    public Carcinogen? Carcinogen { get; set; }

    public bool PastExposure { get; set; }
    public bool CurrentExposure { get; set; }
}
