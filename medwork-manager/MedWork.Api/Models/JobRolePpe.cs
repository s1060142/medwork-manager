using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class JobRolePpe
{
    public int JobRoleId { get; set; }
    public JobRole? JobRole { get; set; }

    public int PpeId { get; set; }
    public Ppe? Ppe { get; set; }

    public bool IsMandatory { get; set; } = true;

    [StringLength(500)]
    public string? Notes { get; set; }
}
