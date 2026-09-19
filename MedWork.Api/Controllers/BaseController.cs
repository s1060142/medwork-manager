using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

public abstract class BaseController : ControllerBase
{
    protected int GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value;
        return int.TryParse(tenantClaim, out var id) && id > 0 ? id : 0;
    }
    
    protected int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var id) ? id : 0;
    }
}