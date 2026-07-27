using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace MedWork.Api.Services;

/// <summary>
/// Fornisce il contesto operativo corrente (azienda/sede) letto dai claim JWT.
/// Usato dai global query filters di AppDbContext per lo scoping automatico dei dati.
/// </summary>
public interface ICurrentContextService
{
    /// <summary>Id azienda dal claim companyId, null se assente (nessun filtro).</summary>
    int? CompanyId { get; }

    /// <summary>Id sede dal claim siteId, null se assente (nessun filtro).</summary>
    int? SiteId { get; }
}

public class CurrentContextService : ICurrentContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentContextService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public int? CompanyId
    {
        get
        {
            var raw = User?.FindFirstValue("companyId");
            return int.TryParse(raw, out var id) && id > 0 ? id : null;
        }
    }

    public int? SiteId
    {
        get
        {
            var raw = User?.FindFirstValue("siteId");
            return int.TryParse(raw, out var id) && id > 0 ? id : null;
        }
    }
}
