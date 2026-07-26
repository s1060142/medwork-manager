namespace MedWork.Api.Models;

/// <summary>
/// Represents a department within a company
/// </summary>
public class Department
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Referente { get; set; } = string.Empty;
    public string EmailReferente { get; set; } = string.Empty;
    public bool Attivo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";

    // Navigation properties
    public virtual Company? Company { get; set; }
    public virtual ICollection<Employee>? Employees { get; set; } = new List<Employee>();
}
