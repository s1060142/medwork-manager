namespace MedWork.Api.Enterprise;

/// <summary>
/// FASE 4 - White-label / OEM configuration. Per-studio branding, logo, color theme,
/// feature toggles. Pure DTO + resolver; persistence handled by FASE 0 (DbSet).
/// </summary>

public sealed record WhiteLabelConfig(
    string StudioId,
    string BrandName,
    string PrimaryColorHex,
    string LogoUrl,
    bool ShowMedWorkPoweredBy,
    IReadOnlyList<string> EnabledModules);

public interface IWhiteLabelResolver
{
    WhiteLabelConfig Resolve(string studioId, WhiteLabelConfig? stored);
}

public sealed class WhiteLabelResolver : IWhiteLabelResolver
    {
        private readonly IConfiguration _configuration;

        public WhiteLabelResolver(IConfiguration configuration)
        {
        _configuration = configuration;
    }

    private static readonly WhiteLabelConfig Default = new(
        "default", "MedWork Manager", "#1976d2", "/logo.svg", true,
        new[] { "visits", "records", "scadenziario", "questionari", "frasi" });

    public WhiteLabelConfig Resolve(string studioId, WhiteLabelConfig? stored)
    {
        if (stored is null)
            return Default with { StudioId = studioId };

        // Merge: only non-empty branding overrides default.
        return new WhiteLabelConfig(
            studioId,
            string.IsNullOrWhiteSpace(stored.BrandName) ? Default.BrandName : stored.BrandName,
            string.IsNullOrWhiteSpace(stored.PrimaryColorHex) ? Default.PrimaryColorHex : stored.PrimaryColorHex,
            string.IsNullOrWhiteSpace(stored.LogoUrl) ? Default.LogoUrl : stored.LogoUrl,
            stored.ShowMedWorkPoweredBy,
            stored.EnabledModules.Count == 0 ? Default.EnabledModules : stored.EnabledModules);
    }
}
