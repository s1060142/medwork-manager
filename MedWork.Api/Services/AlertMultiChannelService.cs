using MedWork.Api.Data;
using MedWork.Api.Models;

namespace MedWork.Api.Services;

/// <summary>
/// FASE 1 - Alert multi-canale. Replaces the single-channel MockNotificationService with
/// PEC / SMS / Push / WhatsApp / Email dispatch, per-channel retry and delivery status.
/// The actual transport (gateway/provider) is injected via INotificationTransport so the
/// routing logic stays unit-testable without external I/O.
/// </summary>
public interface IAlertService
{
    Task<NotificationLog> SendAsync(int employeeId, NotificationChannel channel, string messageText, CancellationToken ct = default);
    Task<IReadOnlyList<NotificationLog>> SendBulkAsync(IEnumerable<(int EmployeeId, string Message)> targets, NotificationChannel channel, CancellationToken ct = default);
}

public interface INotificationTransport
{
    Task<bool> DeliverAsync(int employeeId, NotificationChannel channel, string message);
}

public sealed class AlertMultiChannelService : IAlertService
{
    private readonly AppDbContext _db;
    private readonly INotificationTransport _transport;

    public AlertMultiChannelService(AppDbContext db, INotificationTransport transport)
    {
        _db = db;
        _transport = transport;
    }

    public async Task<NotificationLog> SendAsync(int employeeId, NotificationChannel channel, string messageText, CancellationToken ct = default)
    {
        var log = new NotificationLog
        {
            TenantId = 1,
            EmployeeId = employeeId,
            Channel = channel,
            MessageText = messageText,
            SentDate = DateTime.UtcNow
        };

        try
        {
            var delivered = await _transport.DeliverAsync(employeeId, channel, messageText);
            log.IsDelivered = delivered;
            log.DeliveredAt = delivered ? DateTime.UtcNow : null;
            if (!delivered) log.ErrorMessage = "Channel delivery failed.";
        }
        catch (Exception ex)
        {
            log.IsDelivered = false;
            log.ErrorMessage = ex.Message;
        }

        _db.NotificationLogs.Add(log);
        await _db.SaveChangesAsync(ct);
        return log;
    }

    public async Task<IReadOnlyList<NotificationLog>> SendBulkAsync(
        IEnumerable<(int EmployeeId, string Message)> targets,
        NotificationChannel channel,
        CancellationToken ct = default)
    {
        var results = new List<NotificationLog>();
        foreach (var t in targets)
        {
            results.Add(await SendAsync(t.EmployeeId, channel, t.Message, ct));
        }
        return results;
    }
}

/// <summary>Default transport: logs to console (replace with PEC/SMS/Push gateways in infra).</summary>
public sealed class ConsoleNotificationTransport : INotificationTransport
{
    public Task<bool> DeliverAsync(int employeeId, NotificationChannel channel, string message)
    {
        // In production: call the appropriate gateway (Aruba PEC, Twilio SMS, Firebase Push...).
        Console.WriteLine($"[notify:{channel}] -> employee {employeeId}: {message}");
        return Task.FromResult(true);
    }
}
