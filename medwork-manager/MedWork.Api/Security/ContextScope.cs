using System.Security.Claims;

namespace MedWork.Api.Security;

/// <summary>
/// Helper per lo scoping dei dati sul contesto operativo (azienda/sede)
/// contenuto nei claim del JWT rigenerato da /api/auth/select-context.
/// Ritorna null quando il claim è assente: in quel caso nessun filtro viene applicato.
/// </summary>
public static class ContextScope
{
    public static int? GetCompanyId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue("companyId");
        return int.TryParse(raw, out var id) ? id : null;
    }

    public static int? GetSiteId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue("siteId");
        return int.TryParse(raw, out var id) ? id : null;
    }
}
