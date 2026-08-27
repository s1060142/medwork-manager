using MedWork.Api.Data;
using MedWork.Api.Models;

namespace MedWork.Api.Services;

public class MockNotificationService : INotificationService
{
    private readonly AppDbContext _dbContext;

    public MockNotificationService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<NotificationLog> SendConvocationAsync(int tenantId, int employeeId, NotificationChannel channel, string messageText, CancellationToken cancellationToken = default)
    {
        var entry = new NotificationLog
        {
            TenantId = tenantId,
            EmployeeId = employeeId,
            Channel = channel,
            SentDate = DateTime.UtcNow,
            MessageText = messageText
        };

        _dbContext.NotificationLogs.Add(entry);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entry;
    }

    public async Task<NotificationLog> SendPasswordResetAsync(string email, string resetLink, CancellationToken cancellationToken = default)
    {
        var message = $"Password reset link: {resetLink}";
        var entry = new NotificationLog
        {
            Email = email,
            Channel = NotificationChannel.Email,
            SentDate = DateTime.UtcNow,
            MessageText = message
        };

        _dbContext.NotificationLogs.Add(entry);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entry;
    }
}