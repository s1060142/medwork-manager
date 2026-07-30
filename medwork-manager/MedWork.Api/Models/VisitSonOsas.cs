using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitSonOsas
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int? SleepinessScore { get; set; }
    public int? TvHours { get; set; }
    public int? IpuScore { get; set; }
    public int? PassiveSmoking { get; set; }
    public int? Snoring { get; set; }
    public int? ApneaWitnessed { get; set; }
    public int? Hypertension { get; set; }
    public int? SleepDisorders { get; set; }
    public int? TrafficAccidents { get; set; }
}
