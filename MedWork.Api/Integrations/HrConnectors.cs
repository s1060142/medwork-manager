namespace MedWork.Api.Integrations;

/// <summary>
/// FASE 3 - Integration Hub. HR/PEC/SDI/PagoPA/SPID connectors.
/// Each connector is a pure mapping/transform service: it converts between the
/// external system's payload and MedWork's internal DTOs. Network I/O is injected
/// via IExternalTransport so the mapping logic stays unit-testable without FASE 0.
/// </summary>

public interface IExternalTransport
{
    Task<string> PostAsync(string endpoint, string payload, CancellationToken ct = default);
    Task<string> GetAsync(string endpoint, CancellationToken ct = default);
}

public sealed record HrWorkerImport(
    string ExternalId,
    string FirstName,
    string LastName,
    string TaxCode,
    string JobRole,
    DateTime HireDate,
    IReadOnlyList<string> RiskFactors);

public interface IHrConnector
{
    string SystemName { get; }
    IReadOnlyList<HrWorkerImport> MapCsv(string csv);
    IReadOnlyList<HrWorkerImport> MapJson(string json);
}

/// <summary>Zucchetti / generic CSV export from HR systems.</summary>
public sealed class ZucchettiConnector : IHrConnector
{
    public string SystemName => "Zucchetti";

    public IReadOnlyList<HrWorkerImport> MapCsv(string csv)
    {
        if (string.IsNullOrWhiteSpace(csv)) return Array.Empty<HrWorkerImport>();
        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length < 2) return Array.Empty<HrWorkerImport>();

        var header = lines[0].Split(';').Select(h => h.Trim().ToLowerInvariant()).ToArray();
        var result = new List<HrWorkerImport>();

        for (var i = 1; i < lines.Length; i++)
        {
            var cols = lines[i].Split(';');
            var get = (string name) =>
            {
                var idx = Array.IndexOf(header, name);
                return idx >= 0 && idx < cols.Length ? cols[idx].Trim() : string.Empty;
            };
            if (string.IsNullOrWhiteSpace(get("cf")) && string.IsNullOrWhiteSpace(get("taxcode"))) continue;

            result.Add(new HrWorkerImport(
                get("id") ?? get("matricola"),
                get("nome") ?? get("firstname"),
                get("cognome") ?? get("lastname"),
                get("cf") ?? get("taxcode"),
                get("mansione") ?? get("jobrole"),
                DateTime.TryParse(get("assunzione") ?? get("hiredate"), out var d) ? d : DateTime.MinValue,
                get("rischi") is { Length: > 0 } r ? r.Split(',', StringSplitOptions.TrimEntries) : Array.Empty<string>()));
        }
        return result;
    }

    public IReadOnlyList<HrWorkerImport> MapJson(string json)
    {
        // Placeholder: HR JSON shape varies; hook for structured deserialization.
        return Array.Empty<HrWorkerImport>();
    }
}

/// <summary>TeamSystem SOAP/REST + scheduled CSV export.</summary>
public sealed class TeamSystemConnector : IHrConnector
{
    public string SystemName => "TeamSystem";

    public IReadOnlyList<HrWorkerImport> MapCsv(string csv) => new ZucchettiConnector().MapCsv(csv);

    public IReadOnlyList<HrWorkerImport> MapJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return Array.Empty<HrWorkerImport>();
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != System.Text.Json.JsonValueKind.Array) return Array.Empty<HrWorkerImport>();
            var list = new List<HrWorkerImport>();
            foreach (var el in doc.RootElement.EnumerateArray())
            {
                var get = (string n) => el.TryGetProperty(n, out var v) ? v.GetString() ?? string.Empty : string.Empty;
                list.Add(new HrWorkerImport(
                    get("id"), get("firstName"), get("lastName"), get("taxCode"),
                    get("jobRole"),
                    DateTime.TryParse(get("hireDate"), out var d) ? d : DateTime.MinValue,
                    get("riskFactors") is { Length: > 0 } r ? r.Split(',') : Array.Empty<string>()));
            }
            return list;
        }
        catch (System.Text.Json.JsonException)
        {
            return Array.Empty<HrWorkerImport>();
        }
    }
}
