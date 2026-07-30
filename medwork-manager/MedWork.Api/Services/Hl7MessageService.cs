using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Services;

/// <summary>
/// Implementazione del servizio HL7 per la gestione dei messaggi HL7
/// </summary>
public class Hl7MessageService : IHl7MessageService
{
    private readonly AppDbContext _dbContext;

    public Hl7MessageService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Hl7Message> CreateAsync(Hl7Message hl7Message)
    {
        _dbContext.Hl7Messages.Add(hl7Message);
        await _dbContext.SaveChangesAsync();
        return hl7Message;
    }

    public async Task<Hl7Message?> GetByIdAsync(int id)
    {
        return await _dbContext.Hl7Messages
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<IEnumerable<Hl7Message>> GetAllAsync(int skip = 0, int take = 100)
    {
        return await _dbContext.Hl7Messages
            .AsNoTracking()
            .OrderByDescending(m => m.Timestamp)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<IEnumerable<Hl7Message>> GetAllByCompanyIdAsync(int companyId)
    {
        return await _dbContext.Hl7Messages
            .AsNoTracking()
            .Where(m => m.CompanyId == companyId)
            .OrderByDescending(m => m.Timestamp)
            .ToListAsync();
    }

    public async Task<IEnumerable<Hl7Message>> GetUnprocessedByCompanyIdAsync(int companyId)
    {
        return await _dbContext.Hl7Messages
            .AsNoTracking()
            .Where(m => m.CompanyId == companyId && m.ProcessingStatus != "Processed")
            .OrderByDescending(m => m.Timestamp)
            .ToListAsync();
    }

    public async Task<IEnumerable<Hl7Message>> GetByMedicalVisitIdAsync(int medicalVisitId)
    {
        return await _dbContext.Hl7Messages
            .AsNoTracking()
            .Where(m => m.MedicalVisitId == medicalVisitId)
            .OrderByDescending(m => m.Timestamp)
            .ToListAsync();
    }

    public async Task<IEnumerable<Hl7Message>> GetByVisitExamIdAsync(int visitExamId)
    {
        return await _dbContext.Hl7Messages
            .AsNoTracking()
            .Where(m => m.VisitExamId == visitExamId)
            .OrderByDescending(m => m.Timestamp)
            .ToListAsync();
    }

    public async Task<Hl7Message?> UpdateAsync(int id, Hl7Message hl7Message)
    {
        if (hl7Message.Id != id)
        {
            hl7Message.Id = id;
        }
        return await UpdateAsync(hl7Message);
    }

    public async Task<Hl7Message?> UpdateAsync(Hl7Message hl7Message)
    {
        var existing = await _dbContext.Hl7Messages.FindAsync(hl7Message.Id);
        if (existing == null)
            return null;

        existing.MessageType = hl7Message.MessageType;
        existing.MessageControlId = hl7Message.MessageControlId;
        existing.SendingApplication = hl7Message.SendingApplication;
        existing.ReceivingApplication = hl7Message.ReceivingApplication;
        existing.RawContent = hl7Message.RawContent;
        existing.ParsedContent = hl7Message.ParsedContent;
        existing.ProcessingStatus = hl7Message.ProcessingStatus;
        existing.ErrorMessage = hl7Message.ErrorMessage;
        existing.IsProcessedSuccessfully = hl7Message.IsProcessedSuccessfully;
        existing.Timestamp = hl7Message.Timestamp;
        // Note: Patient fields, OrderId, ObservationId, etc. would need to be mapped if present in hl7Message
        // For now, we're focusing on the core HL7 message properties
        existing.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _dbContext.Hl7Messages.FindAsync(id);
        if (entity == null)
            return false;

        _dbContext.Hl7Messages.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkAsProcessedAsync(int id, string? processedData = null)
    {
        var message = await GetByIdAsync(id);
        if (message == null)
            return false;

        message.ProcessingStatus = "Processed";
        // If we had processed data to store, we would put it somewhere
        // For now, we just update the status and timestamp
        message.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<Dictionary<string, int>> GetProcessingStatusCountsAsync(int companyId)
    {
        var counts = await _dbContext.Hl7Messages
            .AsNoTracking()
            .Where(m => m.CompanyId == companyId)
            .GroupBy(m => m.ProcessingStatus)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Status, g => g.Count);

        return counts;
    }

    public async Task<Hl7Message?> ProcessMessageAsync(string hl7MessageContent, int companyId)
    {
        // In a real implementation, this would parse the HL7 message
        // For now, we'll create a basic HL7 message record

        var message = new Hl7Message
        {
            CompanyId = companyId,
            RawContent = hl7MessageContent,
            Timestamp = DateTime.UtcNow,
            ProcessingStatus = "Received"
        };

        // Try to extract basic HL7 fields (simplified)
        try
        {
            var lines = hl7MessageContent.Split('\n');
            foreach (var line in lines)
            {
                if (line.StartsWith("MSH|"))
                {
                    var fields = line.Split('|');
                    if (fields.Length > 9)
                    {
                        message.SendingApplication = fields[2];
                        message.ReceivingApplication = fields[4];
                        message.MessageControlId = fields[9];
                        message.MessageType = fields[8];
                    }
                }
            }
        }
        catch
        {
            // If parsing fails, we still store the raw message
        }

        _dbContext.Hl7Messages.Add(message);
        await _dbContext.SaveChangesAsync();

        return message;
    }
}