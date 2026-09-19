using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MedWork.Api.Security;

/// <summary>
/// Injected tenant isolation: every inbound entity that exposes an int TenantId
/// property is forced to the value carried by the authenticated principal's
/// "TenantId" claim. This guarantees a tenant can never create/modify data on
/// behalf of another tenant, and keeps controller code free of manual mapping.
/// Runs with the highest precedence so the value is set before the automatic
/// [ApiController] ModelState validation (which would otherwise reject TenantId = 0).
/// </summary>
public sealed class TenantContextFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (context == null) return;

        var user = context.HttpContext.User;
        if (user?.Identity == null || !user.Identity.IsAuthenticated)
        {
            // Skip tenant validation for anonymous endpoints like Login
            return;
        }

        var tenantClaim = user.FindFirst("tenant_id")?.Value;
        if (!int.TryParse(tenantClaim, out var tenantId) || tenantId < 1)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        foreach (var arg in context.ActionArguments.Values)
        {
            if (arg is null) continue;

            var prop = arg.GetType().GetProperty("TenantId", BindingFlags.Public | BindingFlags.Instance);
            if (prop is null || prop.PropertyType != typeof(int) || !prop.CanWrite) continue;

            prop.SetValue(arg, tenantId);
        }

        // [ApiController] evaluates ModelState during model binding, i.e. before this
        // filter runs, so the bound TenantId = 0 already produced a validation error.
        // Clearing those entries lets the subsequent ModelStateInvalidFilter see a valid model.
        // Only remove TenantId errors that were caused by the binder receiving 0 before our filter set the value.
        var tenantIdKeys = context.ModelState.Keys
            .Where(k => k.EndsWith("TenantId", StringComparison.OrdinalIgnoreCase))
            .ToList();

        foreach (var key in tenantIdKeys)
        {
            var entry = context.ModelState[key];
            if (entry != null && entry.Errors.Count > 0)
            {
                // Only clear errors if they appear to be "required" or "null" errors from a 0 value
                var shouldClear = entry.Errors.Any(e => 
                    e.ErrorMessage.Contains("required", StringComparison.OrdinalIgnoreCase) ||
                    e.ErrorMessage.Contains("null", StringComparison.OrdinalIgnoreCase) ||
                    e.ErrorMessage.Contains("0", StringComparison.OrdinalIgnoreCase));
                
                if (shouldClear)
                {
                    context.ModelState.Remove(key);
                }
            }
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // No post-processing required.
    }
}
