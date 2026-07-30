using MedWork.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace MedWork.Api.Services;

/// <summary>
/// Interfaccia per il servizio di gestione dispositivi diagnostici
/// </summary>
public interface IDiagnosticDeviceService
{
    // Dispositivi diagnostici
    Task<DiagnosticDevice> CreateDeviceAsync(DiagnosticDevice device, CancellationToken ct = default);
    Task<DiagnosticDevice?> GetDeviceAsync(int id, CancellationToken ct = default);
    Task<List<DiagnosticDevice>> GetDevicesByCompanyAsync(int companyId, CancellationToken ct = default);
    Task<DiagnosticDevice> UpdateDeviceAsync(DiagnosticDevice device, CancellationToken ct = default);
    Task<bool> DeleteDeviceAsync(int id, CancellationToken ct = default);

    // Log degli esami
    Task<DeviceExamLog> CreateExamLogAsync(DeviceExamLog examLog, CancellationToken ct = default);
    Task<DeviceExamLog?> GetExamLogAsync(int id, CancellationToken ct = default);
    Task<List<DeviceExamLog>> GetExamLogsByDeviceAsync(int deviceId, CancellationToken ct = default);
    Task<List<DeviceExamLog>> GetExamLogsByEmployeeAsync(int employeeId, CancellationToken ct = default);
    Task<List<DeviceExamLog>> GetExamLogsByVisitAsync(int visitId, CancellationToken ct = default);
    Task<DeviceExamLog> UpdateExamLogAsync(DeviceExamLog examLog, CancellationToken ct = default);
    Task<bool> DeleteExamLogAsync(int id, CancellationToken ct = default);

    // Configurazioni parser
    Task<DeviceParserConfig> CreateParserConfigAsync(DeviceParserConfig config, CancellationToken ct = default);
    Task<DeviceParserConfig?> GetParserConfigAsync(int id, CancellationToken ct = default);
    Task<List<DeviceParserConfig>> GetParserConfigsByDeviceTypeAsync(DeviceType deviceType, CancellationToken ct = default);
    Task<DeviceParserConfig> UpdateParserConfigAsync(DeviceParserConfig config, CancellationToken ct = default);
    Task<bool> DeleteParserConfigAsync(int id, CancellationToken ct = default);

    // Operazioni specifiche dispositivo
    Task SaveRawDataAsync(int examLogId, string rawData, CancellationToken ct = default);
    Task<string> GetRawDataAsync(int examLogId, CancellationToken ct = default);
}