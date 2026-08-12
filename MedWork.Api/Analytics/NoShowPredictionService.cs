namespace MedWork.Api.Analytics;

/// <summary>
/// FASE 4 - No-Show Prediction. Lightweight ML-style scorer (logistic-style linear
/// combination of features) used to suggest overbooking. Pure function, testable.
/// </summary>

public sealed record NoShowFeatures(
    int WorkerAge,
    double DistanceKm,
    DayOfWeek DayOfWeek,
    int PastNoShows,
    int PastAppointments,
    bool IsFirstVisit);

public interface INoShowPredictionService
{
    double PredictProbability(NoShowFeatures features);
    bool ShouldOverbook(NoShowFeatures features, double overbookingThreshold = 0.35);
}

public sealed class NoShowPredictionService : INoShowPredictionService
{
    public double PredictProbability(NoShowFeatures f)
    {
        // Normalized, bounded feature contributions in [0,1].
        var age = Clamp01((f.WorkerAge - 18) / 50.0);
        var dist = Clamp01(f.DistanceKm / 50.0);
        var dow = f.DayOfWeek is DayOfWeek.Monday or DayOfWeek.Friday ? 0.3 : 0.1;
        var history = f.PastAppointments > 0 ? Clamp01((double)f.PastNoShows / f.PastAppointments) : 0.2;
        var first = f.IsFirstVisit ? 0.2 : 0.0;

        // Weighted sum (weights sum to ~1).
        var score = 0.20 * age + 0.25 * dist + 0.15 * dow + 0.30 * history + 0.10 * first;
        return Math.Round(Clamp01(score), 3);
    }

    public bool ShouldOverbook(NoShowFeatures features, double overbookingThreshold = 0.35)
    {
        return PredictProbability(features) >= overbookingThreshold;
    }

    private static double Clamp01(double v) => v < 0 ? 0 : v > 1 ? 1 : v;
}
