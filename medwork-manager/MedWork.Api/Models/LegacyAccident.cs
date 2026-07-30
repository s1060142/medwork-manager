using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class LegacyAccident
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public LegacyEmployee? Employee { get; set; }

    public DateTime AccidentDate { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public int DaysLost { get; set; }
}
