using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ReportMansioni
{
    public int Id { get; set; }

    [StringLength(120)]
    public string Mansione { get; set; } = string.Empty;

    [StringLength(120)]
    public string? Descrizione { get; set; }

    public int? EsamiPrevisti { get; set; }
    public int? ProtocolliPrevisti { get; set; }
    public int? RischiPrevisti { get; set; }
    public int? VaccinazioniPreviste { get; set; }
}
