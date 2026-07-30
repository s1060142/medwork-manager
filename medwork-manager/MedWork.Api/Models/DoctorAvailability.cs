using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class DoctorAvailability
{
    public int Id { get; set; }

    public int DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    /// <summary>
    /// Data della disponibilità (per disponibilità puntuale)
    /// </summary>
    public DateTime? Date { get; set; }

    /// <summary>
    /// Giorno della settimana (per disponibilità ricorrente)
    /// </summary>
    public DayOfWeek? DayOfWeek { get; set; }

    /// <summary>
    /// Ora inizio
    /// </summary>
    public TimeOnly StartTime { get; set; }

    /// <summary>
    /// Ora fine
    /// </summary>
    public TimeOnly EndTime { get; set; }

    [StringLength(250)]
    public string? Location { get; set; }

    public bool IsAvailable { get; set; } = true;
}
