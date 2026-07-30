using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace MedWork.Api.Services;

/// <summary>
/// Servizio per la gestione dei dispositivi diagnostici (CRUD + operazioni specifiche)
/// </summary>
public class DiagnosticDeviceService : IDiagnosticDeviceService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<DiagnosticDeviceService> _logger;
    private readonly IAuditService _auditService;

    public DiagnosticDeviceService(
        AppDbContext dbContext,
        ILogger<DiagnosticDeviceService> logger,
        IAuditService auditService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _auditService = auditService;
    }

    // ============================================================
    // DISPOSITIVI DIAGNOSTICI
    // ============================================================

    public async Task<DiagnosticDevice> CreateDeviceAsync(DiagnosticDevice device, CancellationToken ct = default)
    {
        device.CreatedAt = DateTime.UtcNow;
        _dbContext.DiagnosticDevices.Add(device);
        await _dbContext.SaveChangesAsync(ct);
        
        await _auditService.LogAsync(
            "DiagnosticDevice", 
            "Create", 
            device.Id, 
            $"Dispositivo diagnostico creato: {device.Name} ({device.Type})", 
            ct);
        
        return device;
    }

    public async Task<DiagnosticDevice?> GetDeviceAsync(int id, CancellationToken ct = default)
    {
        return await _dbContext.DiagnosticDevices
            .Include(d => d.Company)
            .FirstOrDefaultAsync(d => d.Id == id, ct);
    }

    public async Task<List<DiagnosticDevice>> GetDevicesByCompanyAsync(int companyId, CancellationToken ct = default)
    {
        return await _dbContext.DiagnosticDevices
            .Where(d => d.CompanyId == companyId && d.IsActive)
            .OrderBy(d => d.Name)
            .ToListAsync(ct);
    }

    public async Task<DiagnosticDevice> UpdateDeviceAsync(DiagnosticDevice device, CancellationToken ct = default)
    {
        var existing = await _dbContext.DiagnosticDevices.FindAsync(new object[] { device.Id }, ct);
        if (existing == null)
            throw new KeyNotFoundException($"Dispositivo {device.Id} non trovato");

        existing.Name = device.Name;
        existing.Type = device.Type;
        existing.Model = device.Model;
        existing.Manufacturer = device.Manufacturer;
        existing.SerialNumber = device.SerialNumber;
        existing.FirmwareVersion = device.FirmwareVersion;
        existing.ConnectionType = device.ConnectionType;
        existing.ConnectionAddress = device.ConnectionAddress;
        existing.ConfigurationJson = device.ConfigurationJson;
        existing.ParserType = device.ParserType;
        existing.IsActive = device.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);
        
        await _auditService.LogAsync(
            "DiagnosticDevice", 
            "Update", 
            existing.Id, 
            $"Dispositivo diagnostico aggiornato: {existing.Name}", 
            ct);
        
        return existing;
    }

    public async Task<bool> DeleteDeviceAsync(int id, CancellationToken ct = default)
    {
        var device = await _dbContext.DiagnosticDevices.FindAsync(new object[] { id }, ct);
        if (device == null)
            return false;

        // Soft delete: marca come inattivo invece di eliminare fisicamente
        device.IsActive = false;
        device.UpdatedAt = DateTime.UtcNow;
        
        await _dbContext.SaveChangesAsync(ct);
        
        await _auditService.LogAsync(
            "DiagnosticDevice", 
            "Delete", 
            device.Id, 
            $"Dispositivo diagnostico disattivato: {device.Name}", 
            ct);
        
        return true;
    }

    // ============================================================
    // LOG DEGLI ESAMI
    // ============================================================

    public async Task<DeviceExamLog> CreateExamLogAsync(DeviceExamLog examLog, CancellationToken ct = default)
    {
        examLog.ExamDateTime = DateTime.UtcNow;
        _dbContext.DeviceExamLogs.Add(examLog);
        await _dbContext.SaveChangesAsync(ct);
        
        string deviceName = examLog.Device?.Name ?? "Sconosciuto";
        await _auditService.LogAsync(
            "DeviceExamLog", 
            "Create", 
            examLog.Id, 
            $"Esame dispositivo registrato: {deviceName} per dipendente {examLog.EmployeeId}", 
            ct);
        
        return examLog;
    }

    public async Task<DeviceExamLog?> GetExamLogAsync(int id, CancellationToken ct = default)
    {
        return await _dbContext.DeviceExamLogs
            .Include(el => el.Device)
            .Include(el => el.Employee)
            .Include(el => el.MedicalVisit)
            .Include(el => el.ExamType)
            .FirstOrDefaultAsync(el => el.Id == id, ct);
    }

    public async Task<List<DeviceExamLog>> GetExamLogsByDeviceAsync(int deviceId, CancellationToken ct = default)
    {
        return await _dbContext.DeviceExamLogs
            .Include(el => el.Employee)
            .Include(el => el.MedicalVisit)
            .Include(el => el.ExamType)
            .Where(el => el.DeviceId == deviceId)
            .OrderByDescending(el => el.ExamDateTime)
            .ToListAsync(ct);
    }

    public async Task<List<DeviceExamLog>> GetExamLogsByEmployeeAsync(int employeeId, CancellationToken ct = default)
    {
        return await _dbContext.DeviceExamLogs
            .Include(el => el.Device)
            .Include(el => el.MedicalVisit)
            .Include(el => el.ExamType)
            .Where(el => el.EmployeeId == employeeId)
            .OrderByDescending(el => el.ExamDateTime)
            .ToListAsync(ct);
    }

    public async Task<List<DeviceExamLog>> GetExamLogsByVisitAsync(int visitId, CancellationToken ct = default)
    {
        return await _dbContext.DeviceExamLogs
            .Include(el => el.Device)
            .Include(el => el.Employee)
            .Include(el => el.ExamType)
            .Where(el => el.MedicalVisitId == visitId)
            .OrderByDescending(el => el.ExamDateTime)
            .ToListAsync(ct);
    }

    public async Task<DeviceExamLog> UpdateExamLogAsync(DeviceExamLog examLog, CancellationToken ct = default)
    {
        var existing = await _dbContext.DeviceExamLogs.FindAsync(new object[] { examLog.Id }, ct);
        if (existing == null)
            throw new KeyNotFoundException($"Log esame {examLog.Id} non trovato");

        existing.RawData = examLog.RawData;
        existing.ParsedDataJson = examLog.ParsedDataJson;
        existing.Status = examLog.Status;
        existing.ErrorMessage = examLog.ErrorMessage;
        existing.ExamTypeId = examLog.ExamTypeId;
        // ExamDateTime normalmente non si modifica dopo la creazione

        await _dbContext.SaveChangesAsync(ct);
        
        string deviceName = existing.Device?.Name ?? "Sconosciuto";
        await _auditService.LogAsync(
            "DeviceExamLog", 
            "Update", 
            existing.Id, 
            $"Log esame dispositivo aggiornato: {deviceName}", 
            ct);
        
        return existing;
    }

    public async Task<bool> DeleteExamLogAsync(int id, CancellationToken ct = default)
    {
        var examLog = await _dbContext.DeviceExamLogs.FindAsync(new object[] { id }, ct);
        if (examLog == null)
            return false;

        _dbContext.DeviceExamLogs.Remove(examLog);
        await _dbContext.SaveChangesAsync(ct);
        
        string deviceName = examLog.Device?.Name ?? "Sconosciuto";
        await _auditService.LogAsync(
            "DeviceExamLog", 
            "Delete", 
            examLog.Id, 
            $"Log esame dispositivo eliminato: {deviceName}", 
            ct);
        
        return true;
    }

    // ============================================================
    // CONFIGURAZIONI PARSER
    // ============================================================

    public async Task<DeviceParserConfig> CreateParserConfigAsync(DeviceParserConfig config, CancellationToken ct = default)
    {
        _dbContext.DeviceParserConfigs.Add(config);
        await _dbContext.SaveChangesAsync(ct);
        
        await _auditService.LogAsync(
            "DeviceParserConfig", 
            "Create", 
            config.Id, 
            $"Configurazione parser creata: {config.Name} ({config.DeviceType})", 
            ct);
        
        return config;
    }

    public async Task<DeviceParserConfig?> GetParserConfigAsync(int id, CancellationToken ct = default)
    {
        return await _dbContext.DeviceParserConfigs
            .FirstOrDefaultAsync(pc => pc.Id == id, ct);
    }

    public async Task<List<DeviceParserConfig>> GetParserConfigsByDeviceTypeAsync(DeviceType deviceType, CancellationToken ct = default)
    {
        return await _dbContext.DeviceParserConfigs
            .Where(pc => pc.DeviceType == deviceType && pc.IsActive)
            .OrderByDescending(pc => pc.IsDefault) // Default prima
            .ThenBy(pc => pc.Name)
            .ToListAsync(ct);
    }

    public async Task<DeviceParserConfig> UpdateParserConfigAsync(DeviceParserConfig config, CancellationToken ct = default)
    {
        var existing = await _dbContext.DeviceParserConfigs.FindAsync(new object[] { config.Id }, ct);
        if (existing == null)
            throw new KeyNotFoundException($"Configurazione parser {config.Id} non trovata");

        existing.Name = config.Name;
        existing.DeviceType = config.DeviceType;
        existing.Manufacturer = config.Manufacturer;
        existing.Model = config.Model;
        existing.ParserType = config.ParserType;
        existing.ConfigurationJson = config.ConfigurationJson;
        existing.IsDefault = config.IsDefault;
        existing.IsActive = config.IsActive;

        await _dbContext.SaveChangesAsync(ct);
        
        await _auditService.LogAsync(
            "DeviceParserConfig", 
            "Update", 
            existing.Id, 
            $"Configurazione parser aggiornata: {existing.Name}", 
            ct);
        
        return existing;
    }

    public async Task<bool> DeleteParserConfigAsync(int id, CancellationToken ct = default)
    {
        var config = await _dbContext.DeviceParserConfigs.FindAsync(new object[] { id }, ct);
        if (config == null)
            return false;

        // Soft delete
        config.IsActive = false;
        
        await _dbContext.SaveChangesAsync(ct);
        
        await _auditService.LogAsync(
            "DeviceParserConfig", 
            "Delete", 
            config.Id, 
            $"Configurazione parser disattivata: {config.Name}", 
            ct);
        
        return true;
    }

    // ============================================================
    // OPERAZIONI SPECIFICHE DISPOSITIVO
    // ============================================================

    public async Task SaveRawDataAsync(int examLogId, string rawData, CancellationToken ct = default)
    {
        var examLog = await _dbContext.DeviceExamLogs.FindAsync(new object[] { examLogId }, ct);
        if (examLog == null)
            throw new KeyNotFoundException($"Log esame {examLogId} non trovato");

        examLog.RawData = rawData;
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<string> GetRawDataAsync(int examLogId, CancellationToken ct = default)
    {
        var examLog = await _dbContext.DeviceExamLogs.FindAsync(new object[] { examLogId }, ct);
        if (examLog == null)
            throw new KeyNotFoundException($"Log esame {examLogId} non trovato");

        return examLog.RawData ?? string.Empty;
    }
}