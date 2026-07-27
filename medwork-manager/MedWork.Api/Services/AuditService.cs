using System.Security.Claims;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Services;

/// <summary>
/// Implementazione di <see cref="IAuditService"/>. Accoda i log su un DbContext secondario
/// (<see cref="AuditDbContext"/>) per non interferire con la transazione del chiamante.
/// L'identità dell'utente viene ricavata dal token JWT corrente.
/// </summary>
public class AuditService : IAuditService
{
    private readonly AuditDbContext _auditContext;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(AuditDbContext auditContext, IHttpContextAccessor httpContextAccessor)
    {
        _auditContext = auditContext;
        _httpContextAccessor = httpContextAccessor;
    }

    public void Log(string action, string entityName, int? entityId = null, string? description = null)
    {
        _ = LogAsync(action, entityName, entityId, description);
    }

    public async Task LogAsync(string action, string entityName, int? entityId = null, string? description = null, CancellationToken cancellationToken = default)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var username = user?.FindFirstValue(ClaimTypes.Name)
                       ?? user?.FindFirstValue(ClaimTypes.NameIdentifier)
                       ?? "anonymous";
        var role = user?.FindFirstValue(ClaimTypes.Role) ?? "none";
        var source = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();

        _auditContext.AuditLogs.Add(new AuditLog
        {
            Username = username,
            Role = role,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Description = description,
            Source = source
        });

        try
        {
            await _auditContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // L'audit non deve mai interrompere il flusso principale,
            // ma logghiamo per diagnostica (evita silenzi su errori di schema/DB).
            Console.Error.WriteLine($"[AUDIT] Errore salvataggio: {ex.Message}");
        }
    }
}
