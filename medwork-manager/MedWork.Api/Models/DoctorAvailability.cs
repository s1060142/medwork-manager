using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class DoctorAvailability
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int DoctorId { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public Doctor? Doctor { get; set; }
}