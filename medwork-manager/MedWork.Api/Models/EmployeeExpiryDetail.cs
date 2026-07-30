using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class EmployeeExpiryDetail
{
    public int Id { get; set; }

    public int EmployeeExpiryId { get; set; }
    public EmployeeExpiry? EmployeeExpiry { get; set; }

    [StringLength(200)]
    public string Detail { get; set; } = string.Empty;

    public DateTime? ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
