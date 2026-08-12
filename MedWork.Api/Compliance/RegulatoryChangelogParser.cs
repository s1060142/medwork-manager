namespace MedWork.Api.Compliance;

/// <summary>
/// FASE 3 - Regulatory Changelog Engine. Parses official sources (Gazzetta Ufficiale,
/// circolari MinLavoro, INAIL) into structured changelog entries that can be matched
/// against active protocols. Pure text parsing: no I/O, testable.
/// </summary>

public sealed record RegulatoryChange(
    string Source,
    DateTime PublishedAt,
    string Reference,
    string Title,
    string Summary,
    IReadOnlyList<string> AffectedRegulations);

public interface IRegulatoryChangelogParser
{
    RegulatoryChange? Parse(string rawText);
    IReadOnlyList<RegulatoryChange> ParseBatch(IEnumerable<string> rawTexts);
}

public sealed class RegulatoryChangelogParser : IRegulatoryChangelogParser
{
    public RegulatoryChange? Parse(string rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText)) return null;

        var text = rawText.Trim();
        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (lines.Length == 0) return null;

        // Expected shape (one per line, key:value):
        //   source: GURI
        //   date: 2026-01-15
        //   ref: DM 9 Luglio 2012
        //   title: ...
        //   summary: ...
        //   affects: D.Lgs.81/08, Allegato 3B
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var line in lines)
        {
            var idx = line.IndexOf(':');
            if (idx <= 0) continue;
            map[line[..idx].Trim()] = line[(idx + 1)..].Trim();
        }

        if (!map.TryGetValue("title", out var title) && lines.Length > 0)
            title = lines[0];

        DateTime published = DateTime.UtcNow.Date;
        if (map.TryGetValue("date", out var dateStr) && DateTime.TryParse(dateStr, out var parsed))
            published = parsed;

        var affects = Array.Empty<string>();
        if (map.TryGetValue("affects", out var aff))
            affects = aff.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return new RegulatoryChange(
            map.TryGetValue("source", out var s) ? s : "Sconosciuta",
            published,
            map.TryGetValue("ref", out var r) ? r : string.Empty,
            title,
            map.TryGetValue("summary", out var sum) ? sum : string.Empty,
            affects);
    }

    public IReadOnlyList<RegulatoryChange> ParseBatch(IEnumerable<string> rawTexts)
    {
        return rawTexts
            .Select(Parse)
            .Where(c => c is not null)
            .Cast<RegulatoryChange>()
            .OrderByDescending(c => c.PublishedAt)
            .ToList();
    }
}
