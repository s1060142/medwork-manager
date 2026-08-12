namespace MedWork.Api.Compliance;

/// <summary>
/// FASE 3 - Compliance Engine. Pure domain logic that evaluates a medical-surveillance
/// protocol / visit against codified D.Lgs. 81/08 rules. No database access: callers
/// pass a plain context record. Rules are data, so they are testable and extensible.
/// </summary>

public sealed record ComplianceRuleResult(string RuleId, string Description, bool Passed, string Severity);

public sealed record ProtocolEvaluationContext(
    IReadOnlyList<string> RiskFactors,
    IReadOnlyList<string> ExamTypeNames,
    int WorkerAge,
    string VisitType,
    string? OutcomeCode,
    bool HasPrescriptionOrNotes);

public interface IComplianceRuleEngine
{
    IReadOnlyList<ComplianceRuleResult> Evaluate(ProtocolEvaluationContext context);
    bool IsCompliant(ProtocolEvaluationContext context);
}

public sealed class ComplianceRuleEngine : IComplianceRuleEngine
{
    private static readonly HashSet<string> HighFrequencyRisk = new(StringComparer.OrdinalIgnoreCase)
    {
        "rumore", "vibrazioni", "amianto", "radiazioni", "agenti-cancerogeni", "pneumopatie"
    };

    private static readonly HashSet<string> ChemicalRisk = new(StringComparer.OrdinalIgnoreCase)
    {
        "chimico", "solventi", "polveri", "metalli"
    };

    public IReadOnlyList<ComplianceRuleResult> Evaluate(ProtocolEvaluationContext context)
    {
        var results = new List<ComplianceRuleResult>();

        // Rule C1: high-noise exposure requires an audiometry exam.
        if (context.RiskFactors.Any(r => HighFrequencyRisk.Contains(r)))
        {
            var hasAudiometry = context.ExamTypeNames.Any(e =>
                e.Contains("uditiv", StringComparison.OrdinalIgnoreCase) ||
                e.Contains("audiometr", StringComparison.OrdinalIgnoreCase));
            results.Add(new ComplianceRuleResult(
                "C1", "Rischio acustico/vibrazioni richiede audiometria", hasAudiometry, "error"));
        }

        // Rule C2: chemical risk requires at least one lab exam (emocromo/sangue/urine).
        if (context.RiskFactors.Any(r => ChemicalRisk.Contains(r)))
        {
            var hasLab = context.ExamTypeNames.Any(e =>
                e.Contains("emocromo", StringComparison.OrdinalIgnoreCase) ||
                e.Contains("sangue", StringComparison.OrdinalIgnoreCase) ||
                e.Contains("urine", StringComparison.OrdinalIgnoreCase));
            results.Add(new ComplianceRuleResult(
                "C2", "Rischio chimico richiede esami di laboratorio", hasLab, "error"));
        }

        // Rule C3: workers under 18 require periodic surveillance.
        if (context.WorkerAge < 18 && context.VisitType is not ("Periodic" or "Preventive"))
        {
            results.Add(new ComplianceRuleResult(
                "C3", "Lavoratore minorenne richiede sorveglianza periodica", false, "error"));
        }

        // Rule C4: an "unfit" judgement must carry a prescription or clinical note.
        if (!string.IsNullOrWhiteSpace(context.OutcomeCode) &&
            context.OutcomeCode.Equals("NON_IDONEO", StringComparison.OrdinalIgnoreCase) &&
            !context.HasPrescriptionOrNotes)
        {
            results.Add(new ComplianceRuleResult(
                "C4", "Giudizio 'Non idoneo' richiede prescrizioni/motivazione", false, "error"));
        }

        // Rule C5: any scheduled surveillance should include at least one exam.
        if (context.ExamTypeNames.Count == 0 && context.VisitType is ("Periodic" or "Preventive" or "ReturnToWork"))
        {
            results.Add(new ComplianceRuleResult(
                "C5", "Visita periodica senza accertamenti pianificati", false, "warning"));
        }

        return results;
    }

    public bool IsCompliant(ProtocolEvaluationContext context)
    {
        return Evaluate(context).All(r => r.Passed || r.Severity != "error");
    }
}
