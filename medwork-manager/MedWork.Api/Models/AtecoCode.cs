using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class AtecoCode
{
    public int Id { get; set; }

    [Required]
    [StringLength(20)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    public int? ParentId { get; set; }
    public AtecoCode? Parent { get; set; }
    public ICollection<AtecoCode> Children { get; set; } = new List<AtecoCode>();

    public ICollection<Company> Companies { get; set; } = new List<Company>();
}