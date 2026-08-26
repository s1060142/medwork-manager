using MedWork.Api.Models;

namespace MedWork.Api.Services;

public interface INotificationService
{
    Task<NotificationLog> SendConvocationAsync(int tenantId, int employeeId, NotificationChannel channel, string messageText, CancellationToken cancellationToken = default);
}
