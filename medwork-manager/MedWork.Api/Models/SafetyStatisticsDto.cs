using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// DTO per statistiche di sicurezza
/// </summary>
public class SafetyStatisticsDto
{
    public int TotalIncidents { get; set; }
    public int FatalInjuries { get; set; }
    public int LostTimeInjuries { get; set; }
    public int RecordableInjuries { get; set; }
    public int NearMissReports { get; set; }

    public double IncidentRatePer1000Employees { get; set; }
    public double LostTimeRatePer1000Employees { get; set; }
    public double SeverityRate { get; set; }

    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
}