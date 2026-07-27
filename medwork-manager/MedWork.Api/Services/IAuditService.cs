namespace MedWork.Api.Services;

/// <summary>
/// Servizio di audit trail per la tracciabilità delle modifiche ai dati sensibili.
/// </summary>
public interface IAuditService
{
    void Log(string action, string entityName, int? entityId = null, string? description = null);
    Task LogAsync(string action, string entityName, int? entityId = null, string? description = null, CancellationToken cancellationToken = default);
}
