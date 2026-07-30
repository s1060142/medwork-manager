using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Protocol
{
    public int Id { get; set; }

    [Required]
    [StringLength(160)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(30)]
    public string LawReference { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Objective { get; set; }

    /// <summary>
    /// Cadenza in giorni (es. 365 per annuale)
    /// </summary>
    [Range(1, 3650)]
    public int CadenceDays { get; set; } = 365;

    public int? JobRoleId { get; set; }
    public JobRole? JobRole { get; set; }

    public ICollection<PersonalProtocol> PersonalProtocols { get; set; } = new List<PersonalProtocol>();
}
