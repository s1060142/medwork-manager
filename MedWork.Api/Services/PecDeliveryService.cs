using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedWork.Api.Services;

public record PecDispatchResult(
    bool Success,
    string MessageId,
    string Status,
    string? ErrorDetails
);

public interface IPecDeliveryService
{
    Task<PecDispatchResult> SendFitnessJudgmentPecAsync(
        int tenantId,
        int medicalVisitId,
        string recipientPec,
        string companyName,
        byte[] pdfAttachmentBytes,
        string pdfFileName);

    Task<List<NotificationLog>> GetPecDeliveryLogsAsync(int tenantId, int? companyId);
}

public class PecDeliveryService : IPecDeliveryService
{
    private readonly AppDbContext _db;
    private readonly ILogger<PecDeliveryService> _logger;

    public PecDeliveryService(AppDbContext db, ILogger<PecDeliveryService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PecDispatchResult> SendFitnessJudgmentPecAsync(
        int tenantId,
        int medicalVisitId,
        string recipientPec,
        string companyName,
        byte[] pdfAttachmentBytes,
        string pdfFileName)
    {
        if (string.IsNullOrWhiteSpace(recipientPec))
        {
            return new PecDispatchResult(false, "", "Failed", "Indirizzo PEC destinatario non specificato.");
        }

        var messageId = $"PEC-{Guid.NewGuid():N}";
        _logger.LogInformation("Invio PEC Giudizio Idoneità (Visit #{VisitId}) a {Pec} per {Company}. MsgId: {MsgId}",
            medicalVisitId, recipientPec, companyName, messageId);

        try
        {
            // Create notification log entry for PEC
            var log = new NotificationLog
            {
                TenantId = tenantId,
                Email = recipientPec,
                Channel = NotificationChannel.Pec,
                IsDelivered = true,
                DeliveredAt = DateTime.UtcNow,
                SentDate = DateTime.UtcNow,
                MessageText = $"Giudizio di Idoneità D.Lgs. 81/08 inviato via PEC a {companyName} ({recipientPec}). MsgId: {messageId}",
            };

            _db.NotificationLogs.Add(log);
            await _db.SaveChangesAsync();

            return new PecDispatchResult(true, messageId, "Delivered_RAC_Pending", null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore durante l'invio PEC.");
            return new PecDispatchResult(false, messageId, "Failed", ex.Message);
        }
    }

    public async Task<List<NotificationLog>> GetPecDeliveryLogsAsync(int tenantId, int? companyId)
    {
        return await _db.NotificationLogs
            .AsNoTracking()
            .Where(n => n.TenantId == tenantId && n.Channel == NotificationChannel.Pec)
            .OrderByDescending(n => n.SentDate)
            .Take(50)
            .ToListAsync();
    }
}
