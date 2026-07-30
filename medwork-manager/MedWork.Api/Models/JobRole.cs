using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class JobRole
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(50)]
    public string? Code { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<JobRoleRiskFactor> JobRoleRiskFactors { get; set; } = new List<JobRoleRiskFactor>();
    public ICollection<Protocol> Protocols { get; set; } = new List<Protocol>();
    public ICollection<JobRolePpe> JobRolePpes { get; set; } = new List<JobRolePpe>();
}
