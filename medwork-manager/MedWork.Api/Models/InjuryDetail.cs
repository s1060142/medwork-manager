using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class InjuryDetail
{
    public int Id { get; set; }

    public int InjuryId { get; set; }
    public Injury? Injury { get; set; }

    [StringLength(100)]
    public string DetailType { get; set; } = string.Empty; // Testimoni, Misure preventive, ecc.

    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;
}
