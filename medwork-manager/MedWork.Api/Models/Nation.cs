using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Nation
{
    public int Id { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(3)]
    public string? IsoCode2 { get; set; }

    [StringLength(3)]
    public string? IsoCode3 { get; set; }

    [StringLength(10)]
    public string? PhoneCode { get; set; }
}