using System.Security.Claims;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MedWork.Api.Security;

/// <summary>
/// Filtro che registra automaticamente L'ACCESSO IN LETTURA ai dati clinici sensibili
/// (art. 9 GDPR / art. 30 Reg. UE 2016/679 - registro delle attivitá di trattamento).
/// Si applica agli endpoint GET di cartelle sanitarie, visite ed esami.
/// Il log avviene in background (fire-and-forget) sul AuditDbContext separato,
/// cosi da non impattare la latenza ne' interrompere il flusso.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public sealed class ClinicalAccessAuditAttribute : ActionFilterAttribute
{
    // Endpoint -> (NomeEntitáPerAudit, sorgenteIdDallaRoute)
    private static readonly Dictionary<string, string> ClinicalRoutes = new(StringComparer.OrdinalIgnoreCase)
    {
        { "medical-records", "CartellaSanitaria" },
        { "medical-visits", "VisitaMedica" },
        { "anamnesis", "Anamnesi" },
        { "visit-exams", "EsameVisita" },
        { "employee-risks", "RischioLavoratore" },
    };

    public override async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        // Esegue la action, poi (se successo) registra l'accesso in lettura.
        var executed = await next();

        if (executed.Result is not OkObjectResult && executed.Result is not ObjectResult)
        {
            return;
        }

        var routePrefix = context.HttpContext.Request.Path.ToString();
        var matched = ClinicalRoutes.FirstOrDefault(r =>
            routePrefix.Contains(r.Key, StringComparison.OrdinalIgnoreCase));

        if (matched.Value is null)
        {
            return;
        }

        var user = context.HttpContext.User;
        var username = user.FindFirstValue(ClaimTypes.Name)
                     ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? "anonymous";
        var role = user.FindFirstValue(ClaimTypes.Role) ?? "none";

        // Id dell'entitá dalla route o query (es. /api/medical-records/5)
        var entityIdStr = context.RouteData.Values["id"]?.ToString()
                         ?? context.HttpContext.Request.Query["employeeId"].FirstOrDefault()
                         ?? context.HttpContext.Request.Query["id"].FirstOrDefault();
        int? entityId = int.TryParse(entityIdStr, out var id) ? id : null;

        var description = $"Lettura dati clinici {matched.Value} " +
                        (entityId.HasValue ? $"(id={entityId})" : "(lista)");

        // Recupera l'IAuditService dalla DI senza bloccante
        var audit = context.HttpContext.RequestServices.GetService<IAuditService>();
        if (audit is not null)
        {
            await audit.LogAsync("ACCESSO_CLINICO", matched.Value, entityId, description);
        }
    }
}
