using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class MansioniEsamiScadenze
{
    public int Id { get; set; }

    [StringLength(120)]
    public string Mansione { get; set; } = string.Empty;

    public int ExamTypeId { get; set; }
    public ExamType? ExamType { get; set; }

    public int ScadenzaMesi { get; set; } = 12;
}
