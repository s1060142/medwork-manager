using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Personalization
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Key { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Value { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    public int? UserId { get; set; }
    public AppUser? User { get; set; }
}
