namespace MedWork.Api.Compliance;

/// <summary>
/// FASE 3 - DPIA Assistant. Builds a GDPR Art. 35 Data Protection Impact Assessment
/// for a new processing activity (e.g. sorveglianza sanitaria, AI charting).
/// Pure generator: maps a processing profile to required sections + risk score.
/// </summary>

public sealed record DpiaSection(string Heading, string Description, string Template);

public sealed record ProcessingProfile(
    string ActivityName,
    IReadOnlyList<string> DataCategories, // e.g. "dati salute", "dati genetici", "biometria"
    int DataSubjectsCount,
    bool InvolvesProfiling,
    bool InvolvesCrossBorderTransfer,
    string Purpose);

public sealed record DpiaAssessment(
    string ActivityName,
    int ResidualRiskScore,
    bool RequiresDpoReview,
    IReadOnlyList<DpiaSection> Sections);

public interface IDpiaAssistant
{
    DpiaAssessment Build(ProcessingProfile profile);
}

public sealed class DpiaAssistant : IDpiaAssistant
{
    private static readonly HashSet<string> SensitiveCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        "dati salute", "dati genetici", "biometria", "dati relativi alla salute", "art.9"
    };

    public DpiaAssessment Build(ProcessingProfile profile)
    {
        var score = 0;
        var sections = new List<DpiaSection>();

        sections.Add(new DpiaSection(
            "1. Descrizione trattamento",
            $"Attività: {profile.ActivityName}. Finalità: {profile.Purpose}. Interessati: {profile.DataSubjectsCount}.",
            "Descrivere natura, ambito, contesto e finalità del trattamento."));

        if (profile.DataCategories.Any(c => SensitiveCategories.Contains(c)))
        {
            score += 40;
            sections.Add(new DpiaSection(
                "2. Categorie particolari (Art. 9)",
                "Trattamento di dati relativi alla salute / biometrici / genetici.",
                "Indicare base giuridica ex Art. 9.2 e misure di minimizzazione."));
        }

        if (profile.InvolvesProfiling)
        {
            score += 25;
            sections.Add(new DpiaSection(
                "3. Profilazione / Decisioni automatizzate",
                "Il trattamento include profilazione o decisioni automatizzate (es. suggerimento giudizio AI).",
                "Valutare Art. 22 e garanzie per l'interessato (human-in-the-loop)."));
        }

        if (profile.InvolvesCrossBorderTransfer)
        {
            score += 15;
            sections.Add(new DpiaSection(
                "4. Trasferimento extra-UE",
                "Trasferimento di dati sanitari fuori dall'Unione Europea.",
                "Identificare capitolo V GDPR (decisione di adeguatezza / clausole contrattuali)."));
        }

        score += Math.Min(20, profile.DataSubjectsCount / 500);

        var requiresDpo = score >= 50 || profile.DataCategories.Any(c => SensitiveCategories.Contains(c));
        if (requiresDpo)
        {
            sections.Add(new DpiaSection(
                "5. Parere del DPO",
                "Rischio residuo elevato: richiesto parere del Responsabile della Protezione dei Dati.",
                "Allegare parere DPO e misure di mitigazione."));
        }

        sections.Add(new DpiaSection(
            "6. Misure di mitigazione",
            "Cifratura, pseudonimizzazione, minimizzazione, audit trail, consenso granulare.",
            "Elencare misure tecniche e organizzative implementate."));

        return new DpiaAssessment(profile.ActivityName, Math.Min(100, score), requiresDpo, sections);
    }
}
