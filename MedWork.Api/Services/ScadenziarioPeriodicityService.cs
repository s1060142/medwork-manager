namespace MedWork.Api.Services;

/// <summary>
/// Pure domain service (FASE 1 - Scadenziario Intelligente).
/// Computes the periodicity / next due date of a medical surveillance visit
/// from the visit type, the worker's job role risk class, the active risk factors
/// and the worker's age, following D.Lgs. 81/08 general criteria.
/// No database access: callers pass a plain input record.
/// </summary>
public interface IScadenziarioPeriodicityService
{
    /// <summary>Returns the recommended interval in months for the next visit.</summary>
    int ComputeIntervalMonths(PeriodicityInput input);

    /// <summary>Returns the next due date given the last visit date and the computed interval.</summary>
    DateTime ComputeNextDueDate(PeriodicityInput input, DateTime lastVisitDate);
}

public sealed class ScadenziarioPeriodicityService : IScadenziarioPeriodicityService
{
    // Default periodicities by visit type (months) - D.Lgs. 81/08 general baseline.
    private static readonly Dictionary<VisitType, int> DefaultIntervalMonths = new()
    {
        [VisitType.Preventive] = 12,
        [VisitType.Periodic] = 12,
        [VisitType.RoleChange] = 12,
        [VisitType.EmployeeRequest] = 12,
        [VisitType.EndOfRelationship] = 0, // no follow-up
        [VisitType.ReturnToWork] = 6,
        [VisitType.Surprise] = 12,
    };

    // Risk factors that, when present, shorten the interval.
    private static readonly HashSet<string> HighFrequencyRiskFactors = new(StringComparer.OrdinalIgnoreCase)
    {
        "rumore", "vibrazioni", "amianto", "amianto-siti", "radiazioni", "radiazioni-ionizzanti",
        "agenti-cancerogeni", "pneumopatie", "siderosilicosi"
    };

    private static readonly HashSet<string> MediumFrequencyRiskFactors = new(StringComparer.OrdinalIgnoreCase)
    {
        "chimico", "solventi", "polveri", "metalli", "videoterminali", "movimentazione-manuale-carichi"
    };

    public int ComputeIntervalMonths(PeriodicityInput input)
    {
        if (input.VisitType == VisitType.EndOfRelationship)
            return 0;

        var baseInterval = DefaultIntervalMonths.TryGetValue(input.VisitType, out var v) ? v : 12;

        // High-risk factors halve the interval (minimum 6 months) for periodic surveillance.
        var hasHigh = input.RiskFactors.Any(r => HighFrequencyRiskFactors.Contains(r));
        var hasMedium = input.RiskFactors.Any(r => MediumFrequencyRiskFactors.Contains(r));

        if (hasHigh)
            baseInterval = Math.Max(6, baseInterval / 2);
        else if (hasMedium)
            baseInterval = Math.Max(6, (int)Math.Ceiling(baseInterval * 0.75));

        // Older workers (>50) on periodic visits get a shorter interval.
        if (input.AgeYears >= 50 && input.VisitType is VisitType.Periodic or VisitType.Preventive)
            baseInterval = Math.Max(6, baseInterval - 3);

        // Young workers (<18) in first surveillance: keep standard, no shortening.
        return Math.Clamp(baseInterval, 6, 24);
    }

    public DateTime ComputeNextDueDate(PeriodicityInput input, DateTime lastVisitDate)
    {
        var months = ComputeIntervalMonths(input);
        if (months <= 0)
            return DateTime.MaxValue.Date; // no scheduled follow-up

        return lastVisitDate.Date.AddMonths(months);
    }
}

public enum VisitType
{
    Preventive,
    Periodic,
    RoleChange,
    EmployeeRequest,
    EndOfRelationship,
    ReturnToWork,
    Surprise
}

/// <summary>Plain input for periodicity computation (avoids coupling to EF models).</summary>
public sealed class PeriodicityInput
{
    public VisitType VisitType { get; init; } = VisitType.Periodic;
    public int AgeYears { get; init; }
    public IReadOnlyList<string> RiskFactors { get; init; } = Array.Empty<string>();
}
