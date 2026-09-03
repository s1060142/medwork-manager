using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MedWork.Api.Converters;

/// <summary>
/// JSON converter that treats null as default (0) when reading into a non-nullable int.
/// </summary>
public class NullableIntJsonConverter : JsonConverter<int>
{
    public override int Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return 0;
        if (reader.TokenType == JsonTokenType.Number) return reader.GetInt32();
        if (reader.TokenType == JsonTokenType.String)
        {
            var s = reader.GetString();
            if (string.IsNullOrEmpty(s) || s == "null") return 0;
            if (int.TryParse(s, out var v)) return v;
        }
        throw new JsonException($"Unexpected token {reader.TokenType} when parsing int.");
    }
    public override void Write(Utf8JsonWriter writer, int value, JsonSerializerOptions options)
        => writer.WriteNumberValue(value);
}

/// <summary>
/// JSON converter that treats null as default(DateTime) when reading into a non-nullable DateTime.
/// </summary>
public class NullableDateTimeJsonConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return default;
        if (reader.TokenType == JsonTokenType.String)
        {
            var s = reader.GetString();
            if (string.IsNullOrEmpty(s) || s == "null") return default;
            if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var v)) return v;
        }
        throw new JsonException($"Unexpected token {reader.TokenType} when parsing DateTime.");
    }
    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        => writer.WriteStringValue(value.ToString("o", CultureInfo.InvariantCulture));
}

/// <summary>
/// JSON converter that treats null as default(bool) when reading into a non-nullable bool.
/// </summary>
public class NullableBoolJsonConverter : JsonConverter<bool>
{
    public override bool Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return false;
        if (reader.TokenType == JsonTokenType.True) return true;
        if (reader.TokenType == JsonTokenType.False) return false;
        if (reader.TokenType == JsonTokenType.String)
        {
            var s = reader.GetString();
            if (string.IsNullOrEmpty(s) || s == "null") return false;
            if (bool.TryParse(s, out var v)) return v;
        }
        throw new JsonException($"Unexpected token {reader.TokenType} when parsing bool.");
    }
    public override void Write(Utf8JsonWriter writer, bool value, JsonSerializerOptions options)
        => writer.WriteBooleanValue(value);
}
