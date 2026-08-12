namespace MedWork.Api.Analytics;

/// <summary>
/// FASE 4 - Anonymous Benchmark. Compares a studio's KPIs against anonymized peers.
/// No PII: only aggregated metrics cross a boundary. Pure aggregation + comparison.
/// </summary>

public sealed record StudioKpi(string StudioId, int VisitsPerMonth, double FitRate, double OverdueRate, double AvgVisitMinutes);

public sealed record BenchmarkComparison(
    string StudioId,
    double PeerMedianVisitsPerMonth,
    double PeerMedianFitRate,
    int PercentileVisits,
    string Verdict);

public interface IBenchmarkService
{
    IReadOnlyList<BenchmarkComparison> Compare(IEnumerable<StudioKpi> peers);
}

public sealed class BenchmarkService : IBenchmarkService
{
    public IReadOnlyList<BenchmarkComparison> Compare(IEnumerable<StudioKpi> peers)
    {
        var list = peers.ToList();
        if (list.Count == 0) return Array.Empty<BenchmarkComparison>();

        var visits = list.Select(x => x.VisitsPerMonth).OrderBy(v => v).ToList();
        var fits = list.Select(x => x.FitRate).OrderBy(v => v).ToList();

        double Median(IList<double> s) => s.Count % 2 == 1
            ? s[s.Count / 2]
            : (s[s.Count / 2 - 1] + s[s.Count / 2]) / 2.0;

        var medVisits = Median(visits.Select(v => (double)v).ToList());
        var medFit = Median(fits);

        return list.Select(s => new BenchmarkComparison(
            s.StudioId,
            medVisits,
            medFit,
            Percentile(visits, s.VisitsPerMonth),
            s.VisitsPerMonth >= medVisits ? "above median" : "below median")).ToList();
    }

    private static int Percentile(IList<int> sorted, int value)
    {
        if (sorted.Count == 0) return 0;
        var below = sorted.Count(v => v <= value);
        return (int)Math.Round(100.0 * below / sorted.Count, 0);
    }
}
