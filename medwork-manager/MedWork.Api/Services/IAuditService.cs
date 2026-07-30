namespace MedWork.Api.Services;

/// <summary>
/// Servizio di audit trail per la tracciabilità delle modifiche ai dati sensibili.
/// </summary>
public interface IAuditService
{
    void Log(string entityName, string action, int? entityId = null, string? description = null);
    Task LogAsync(string entityName, string action, int? entityId = null, string? description = null, CancellationToken cancellationToken = default);
}
