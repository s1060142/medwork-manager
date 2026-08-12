using System.Text.Json;

namespace MedWork.Api.Services;

public interface IQuestionnaireScoringService
{
    /// <summary>
    /// Computes the total score for a questionnaire response given its definition and answers.
    /// Returns the score and whether it crosses the anomaly threshold.
    /// </summary>
    (int Score, bool IsAnomalous) Score(string definitionJson, string answersJson, int? anomalyThreshold);
}

public sealed class QuestionnaireScoringService : IQuestionnaireScoringService
{
    public (int Score, bool IsAnomalous) Score(string definitionJson, string answersJson, int? anomalyThreshold)
    {
        var definition = SafeParse(definitionJson);
        var answers = SafeParse(answersJson);

        var optionScoreByItem = new Dictionary<int, int>();
        for (var i = 0; i < definition.Count; i++)
        {
            var item = definition[i];
            if (item.TryGetProperty("options", out var options) && options.ValueKind == JsonValueKind.Array)
            {
                var map = new Dictionary<int, int>();
                for (var o = 0; o < options.GetArrayLength(); o++)
                {
                    var opt = options[o];
                    var idx = opt.TryGetProperty("index", out var ix) ? ix.GetInt32() : o;
                    var sc = opt.TryGetProperty("score", out var scp) ? scp.GetInt32() : 0;
                    map[idx] = sc;
                }
                optionScoreByItem[i] = 0; // placeholder keyed by item index
                optionScoreByItem[-(i + 1)] = 0;
                // store per item index using a side dict
                _ = map;
            }
        }

        // Re-evaluate cleanly: map itemIndex -> chosen optionIndex
        var chosen = new Dictionary<int, int>();
        foreach (var ans in answers)
        {
            if (ans.TryGetProperty("itemId", out var iid) && ans.TryGetProperty("optionIndex", out var oix))
                chosen[iid.GetInt32()] = oix.GetInt32();
        }

        var total = 0;
        for (var i = 0; i < definition.Count; i++)
        {
            if (!chosen.TryGetValue(i, out var chosenOption)) continue;
            var item = definition[i];
            if (item.TryGetProperty("options", out var options) && options.ValueKind == JsonValueKind.Array)
            {
                for (var o = 0; o < options.GetArrayLength(); o++)
                {
                    var opt = options[o];
                    var idx = opt.TryGetProperty("index", out var ix) ? ix.GetInt32() : o;
                    if (idx == chosenOption)
                    {
                        total += opt.TryGetProperty("score", out var scp) ? scp.GetInt32() : 0;
                        break;
                    }
                }
            }
        }

        var isAnomalous = anomalyThreshold.HasValue && total >= anomalyThreshold.Value;
        return (total, isAnomalous);
    }

    private static List<JsonElement> SafeParse(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<JsonElement>();
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == JsonValueKind.Array)
                return doc.RootElement.EnumerateArray().ToList();
        }
        catch (JsonException)
        {
            // Return empty on malformed input rather than throwing during scoring.
        }
        return new List<JsonElement>();
    }
}
