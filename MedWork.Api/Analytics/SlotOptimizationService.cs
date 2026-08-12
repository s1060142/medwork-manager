namespace MedWork.Api.Analytics;

/// <summary>
/// FASE 4 - Slot / Route Optimization. Greedy clustering of visits by geographic area
/// and company to minimize travel distance (OR-Tools replacement, deterministic).
/// </summary>

public sealed record VisitStop(int Id, double Lat, double Lng, int CompanyId);

public sealed record OptimizedRoute(int CompanyId, IReadOnlyList<int> OrderedStopIds, double EstimatedKm);

public interface ISlotOptimizationService
{
    IReadOnlyList<OptimizedRoute> ClusterByCompany(IEnumerable<VisitStop> stops);
}

public sealed class SlotOptimizationService : ISlotOptimizationService
{
    public IReadOnlyList<OptimizedRoute> ClusterByCompany(IEnumerable<VisitStop> stops)
    {
        var byCompany = stops.GroupBy(s => s.CompanyId);
        var routes = new List<OptimizedRoute>();
        foreach (var group in byCompany)
        {
            var list = group.ToList();
            // Nearest-neighbour greedy starting from first stop.
            var remaining = list.ToList();
            var ordered = new List<VisitStop>();
            var current = remaining[0];
            remaining.RemoveAt(0);
            ordered.Add(current);
            while (remaining.Count > 0)
            {
                var next = remaining.OrderBy(s => Haversine(current, s)).First();
                ordered.Add(next);
                remaining.Remove(next);
                current = next;
            }
            var km = 0.0;
            for (var i = 1; i < ordered.Count; i++)
                km += Haversine(ordered[i - 1], ordered[i]);

            routes.Add(new OptimizedRoute(group.Key, ordered.Select(s => s.Id).ToList(), Math.Round(km, 2)));
        }
        return routes;
    }

    private static double Haversine(VisitStop a, VisitStop b)
    {
        const double R = 6371.0;
        var dLat = (b.Lat - a.Lat) * Math.PI / 180;
        var dLng = (b.Lng - a.Lng) * Math.PI / 180;
        var la1 = a.Lat * Math.PI / 180;
        var la2 = b.Lat * Math.PI / 180;
        var h = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(la1) * Math.Cos(la2) * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return 2 * R * Math.Asin(Math.Min(1, Math.Sqrt(h)));
    }
}
