using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class EmployeePpe
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int PpeId { get; set; }
    public Ppe? Ppe { get; set; }

    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiryDate { get; set; }

    [StringLength(50)]
    public string? Size { get; set; }

    [StringLength(100)]
    public string? SerialNumber { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public bool IsReturned { get; set; }
    public DateTime? ReturnedDate { get; set; }
}
