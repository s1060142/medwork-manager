namespace MedWork.Api.Analytics;

/// <summary>
/// FASE 4 - Anomaly Detection sui protocolli. Flags e.g. "Azienda X: 40% idoneità
/// parziale su rischio chimico -> rivedi protocollo". Pure statistics over aggregates.
/// </summary>

public sealed record ProtocolOutcomeAggregate(
    string CompanyId,
    string RiskFactor,
    int TotalVisits,
    int PartialUnfitCount,
    int UnfitCount);

public sealed record ProtocolAnomaly(string CompanyId, string RiskFactor, double PartialUnfitRate, string Reason);

public interface IAnomalyDetectionService
{
    IReadOnlyList<ProtocolAnomaly> Detect(IEnumerable<ProtocolOutcomeAggregate> aggregates, double threshold = 0.30);
}

public sealed class AnomalyDetectionService : IAnomalyDetectionService
{
    public IReadOnlyList<ProtocolAnomaly> Detect(IEnumerable<ProtocolOutcomeAggregate> aggregates, double threshold = 0.30)
    {
        var result = new List<ProtocolAnomaly>();
        foreach (var a in aggregates)
        {
            if (a.TotalVisits < 5) continue; // require statistical minimum
            var rate = (double)(a.PartialUnfitCount + a.UnfitCount) / a.TotalVisits;
            if (rate >= threshold)
            {
                result.Add(new ProtocolAnomaly(
                    a.CompanyId,
                    a.RiskFactor,
                    Math.Round(rate, 3),
                    $"Tasso idoneità parziale/non idonea {Math.Round(rate * 100, 1)}% su {a.RiskFactor} supera la soglia {Math.Round(threshold * 100, 1)}%"));
            }
        }
        return result.OrderByDescending(x => x.PartialUnfitRate).ToList();
    }
}
