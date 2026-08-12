namespace MedWork.Api.Compliance;

/// <summary>
/// FASE 3 - Consent Management. Granular consent per worker: which data, for which
/// purposes, with revocation + DSAR (GDPR Art. 15) export. Pure logic over a DTO.
/// </summary>

public sealed record ConsentRecord(string Purpose, bool Granted, DateTime? GrantedAt, DateTime? RevokedAt);

public sealed record ConsentState(
    int WorkerId,
    IReadOnlyList<ConsentRecord> Consents,
    DateTime GeneratedAt);

public interface IConsentManager
{
    ConsentState ApplyGrant(ConsentState state, string purpose);
    ConsentState ApplyRevocation(ConsentState state, string purpose);
    bool IsGranted(ConsentState state, string purpose);
    string ExportDsar(ConsentState state); // GDPR Art. 15 data-subject access
}

public sealed class ConsentManager : IConsentManager
{
    public ConsentState ApplyGrant(ConsentState state, string purpose)
    {
        var list = state.Consents.ToList();
        var existing = list.FirstOrDefault(c => c.Purpose == purpose);
        if (existing != null)
            list.Remove(existing);
        list.Add(new ConsentRecord(purpose, true, DateTime.UtcNow, null));
        return state with { Consents = list, GeneratedAt = DateTime.UtcNow };
    }

    public ConsentState ApplyRevocation(ConsentState state, string purpose)
    {
        var list = state.Consents.ToList();
        var existing = list.FirstOrDefault(c => c.Purpose == purpose);
        if (existing != null)
            list.Remove(existing);
        list.Add(new ConsentRecord(purpose, false, existing?.GrantedAt, DateTime.UtcNow));
        return state with { Consents = list, GeneratedAt = DateTime.UtcNow };
    }

    public bool IsGranted(ConsentState state, string purpose)
    {
        var record = state.Consents.LastOrDefault(c => c.Purpose == purpose);
        return record is { Granted: true, RevokedAt: null };
    }

    public string ExportDsar(ConsentState state)
    {
        var lines = state.Consents
            .Select(c => $"- {c.Purpose}: {(c.Granted ? "consentito" : "revocato")} " +
                         $"(da {c.GrantedAt:u}, revoca {c.RevokedAt:u})");
        return $"DSAR Worker #{state.WorkerId} @ {state.GeneratedAt:u}\n" + string.Join("\n", lines);
    }
}
