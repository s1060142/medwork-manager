using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

/// <summary>
/// Controller per la gestione dei dispositivi diagnostici USB/Serial/Bluetooth
/// </summary>
[ApiController]
[Route("api/diagnostic-devices")]
[Authorize]
public class DiagnosticDeviceController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IDiagnosticDeviceService _deviceService;
    private readonly ILogger<DiagnosticDeviceController> _logger;

    public DiagnosticDeviceController(
        AppDbContext db,
        IDiagnosticDeviceService deviceService,
        ILogger<DiagnosticDeviceController> logger)
    {
        _db = db;
        _deviceService = deviceService;
        _logger = logger;
    }

    private int GetCompanyIdFromClaims()
    {
        var claim = User.FindFirst("companyId")?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    // ============================================================
    // DISPOSITIVI DIAGNOSTICI
    // ============================================================

    [HttpGet]
    public async Task<IActionResult> GetDevices(CancellationToken ct = default)
    {
        var companyId = GetCompanyIdFromClaims();
        if (companyId <= 0) return BadRequest("CompanyId richiesto");

        var devices = await _deviceService.GetDevicesByCompanyAsync(companyId, ct);
        return Ok(devices);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDevice(int id, CancellationToken ct = default)
    {
        var device = await _deviceService.GetDeviceAsync(id, ct);
        if (device == null) return NotFound();
        
        // Verifica che il dispositivo appartenga alla compagnia corrente
        if (device.CompanyId != GetCompanyIdFromClaims())
            return Forbid();
            
        return Ok(device);
    }

    [HttpPost]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Secretary)]
    public async Task<IActionResult> CreateDevice([FromBody] DiagnosticDevice device, CancellationToken ct = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        device.CompanyId = GetCompanyIdFromClaims();
        if (device.CompanyId <= 0) return BadRequest("CompanyId richiesto");

        var created = await _deviceService.CreateDeviceAsync(device, ct);
        return CreatedAtAction(nameof(GetDevice), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Secretary)]
    public async Task<IActionResult> UpdateDevice(int id, [FromBody] DiagnosticDevice device, CancellationToken ct = default)
    {
        if (id != device.Id) return BadRequest("Id mismatch");
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // Verifica che il dispositivo appartenga alla compagnia corrente
        var existing = await _deviceService.GetDeviceAsync(id, ct);
        if (existing == null) return NotFound();
        if (existing.CompanyId != GetCompanyIdFromClaims())
            return Forbid();

        var updated = await _deviceService.UpdateDeviceAsync(device, ct);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> DeleteDevice(int id, CancellationToken ct = default)
    {
        // Verifica che il dispositivo appartenga alla compagnia corrente
        var existing = await _deviceService.GetDeviceAsync(id, ct);
        if (existing == null) return NotFound();
        if (existing.CompanyId != GetCompanyIdFromClaims())
            return Forbid();

        var result = await _deviceService.DeleteDeviceAsync(id, ct);
        if (!result) return NotFound();
        
        return NoContent();
    }

    // ============================================================
    // LOG DEGLI ESAMI
    // ============================================================

    [HttpGet("exams")]
    public async Task<IActionResult> GetExamLogs(
        [FromQuery] int? deviceId,
        [FromQuery] int? employeeId,
        [FromQuery] int? visitId,
        CancellationToken ct = default)
    {
        var companyId = GetCompanyIdFromClaims();
        if (companyId <= 0) return BadRequest("CompanyId richiesto");

        List<DeviceExamLog> exams;
        
        if (deviceId.HasValue)
        {
            // Verifica che il dispositivo appartenga alla compagnia
            var device = await _deviceService.GetDeviceAsync(deviceId.Value, ct);
            if (device == null || device.CompanyId != companyId)
                return Forbid();
                
            exams = await _deviceService.GetExamLogsByDeviceAsync(deviceId.Value, ct);
        }
        else if (employeeId.HasValue)
        {
            exams = await _deviceService.GetExamLogsByEmployeeAsync(employeeId.Value, ct);
        }
        else if (visitId.HasValue)
        {
            exams = await _deviceService.GetExamLogsByVisitAsync(visitId.Value, ct);
        }
        else
        {
            // Se non specificato filtro, restituisci tutti gli esami della compagnia
            // (potrebbe essere pesante, quindi limitiamo)
            var devices = await _deviceService.GetDevicesByCompanyAsync(companyId, ct);
            var deviceIds = devices.Select(d => d.Id).ToList();
            exams = new List<DeviceExamLog>();
            
            foreach (var did in deviceIds)
            {
                var deviceExams = await _deviceService.GetExamLogsByDeviceAsync(did, ct);
                exams.AddRange(deviceExams);
            }
            
            exams = exams.OrderByDescending(e => e.ExamDateTime).ToList();
        }

        return Ok(exams);
    }

    [HttpGet("exams/{id}")]
    public async Task<IActionResult> GetExamLog(int id, CancellationToken ct = default)
    {
        var examLog = await _deviceService.GetExamLogAsync(id, ct);
        if (examLog == null) return NotFound();
        
        // Verifica che l'esame appartenga alla compagnia corrente tramite il dispositivo
        if (examLog.Device?.CompanyId != GetCompanyIdFromClaims())
            return Forbid();
            
        return Ok(examLog);
    }

    [HttpPost("exams")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> CreateExamLog([FromBody] DeviceExamLog examLog, CancellationToken ct = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // Verifica che il dispositivo appartenga alla compagnia corrente
        var device = await _deviceService.GetDeviceAsync(examLog.DeviceId, ct);
        if (device == null) return NotFound("Dispositivo non trovato");
        if (device.CompanyId != GetCompanyIdFromClaims())
            return Forbid();

        // Imposta l'ID dell'esame tipo se non fornito (opzionale)
        // L'esame tipo potrebbe essere derivato dal tipo di dispositivo
        
        var created = await _deviceService.CreateExamLogAsync(examLog, ct);
        return CreatedAtAction(nameof(GetExamLog), new { id = created.Id }, created);
    }

    [HttpPut("exams/{id}")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> UpdateExamLog(int id, [FromBody] DeviceExamLog examLog, CancellationToken ct = default)
    {
        if (id != examLog.Id) return BadRequest("Id mismatch");
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // Verifica che l'esame appartenga alla compagnia corrente
        var existing = await _deviceService.GetExamLogAsync(id, ct);
        if (existing == null) return NotFound();
        if (existing.Device?.CompanyId != GetCompanyIdFromClaims())
            return Forbid();

        var updated = await _deviceService.UpdateExamLogAsync(examLog, ct);
        return Ok(updated);
    }

    [HttpDelete("exams/{id}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> DeleteExamLog(int id, CancellationToken ct = default)
    {
        // Verifica che l'esame appartenga alla compagnia corrente
        var existing = await _deviceService.GetExamLogAsync(id, ct);
        if (existing == null) return NotFound();
        if (existing.Device?.CompanyId != GetCompanyIdFromClaims())
            return Forbid();

        var result = await _deviceService.DeleteExamLogAsync(id, ct);
        if (!result) return NotFound();
        
        return NoContent();
    }

    // ============================================================
    // DATI GREZZI DELL'ESAME
    // ============================================================

    [HttpGet("exams/{id}/raw-data")]
    public async Task<IActionResult> GetRawData(int id, CancellationToken ct = default)
    {
        // Verifica che l'esame appartenga alla compagnia corrente
        var examLog = await _deviceService.GetExamLogAsync(id, ct);
        if (examLog == null) return NotFound();
        if (examLog.Device?.CompanyId != GetCompanyIdFromClaims())
            return Forbid();

        var rawData = await _deviceService.GetRawDataAsync(id, ct);
        return Ok(new { rawData });
    }

    [HttpPost("exams/{id}/raw-data")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> SaveRawData(int id, [FromBody] RawDataRequest request, CancellationToken ct = default)
    {
        // Verifica che l'esame appartenga alla compagnia corrente
        var examLog = await _deviceService.GetExamLogAsync(id, ct);
        if (examLog == null) return NotFound();
        if (examLog.Device?.CompanyId != GetCompanyIdFromClaims())
            return Forbid();

        await _deviceService.SaveRawDataAsync(id, request.RawData, ct);
        return Ok(new { success = true });
    }

    // ============================================================
    // CONFIGURAZIONI PARSER
    // ============================================================

    [HttpGet("parser-configs")]
    public async Task<IActionResult> GetParserConfigs(
        [FromQuery] int? deviceType,
        CancellationToken ct = default)
    {
        var companyId = GetCompanyIdFromClaims();
        if (companyId <= 0) return BadRequest("CompanyId richiesto");

        List<DeviceParserConfig> configs;
        
        if (deviceType.HasValue)
        {
            configs = await _deviceService.GetParserConfigsByDeviceTypeAsync(
                (DeviceType)deviceType.Value, ct);
        }
        else
        {
            // Restituisci tutte le configurazioni (potrebbe essere filtrato lato client)
            // Per ora restituiamo quelle attive
            configs = await _deviceService.GetParserConfigsByDeviceTypeAsync(DeviceType.Spirometer, ct); // Placeholder
            // In una implementazione reale, avremmo un metodo per prendere tutte le configurazioni
        }

        return Ok(configs);
    }

    [HttpGet("parser-configs/{id}")]
    public async Task<IActionResult> GetParserConfig(int id, CancellationToken ct = default)
    {
        var config = await _deviceService.GetParserConfigAsync(id, ct);
        if (config == null) return NotFound();
        return Ok(config);
    }

    [HttpPost("parser-configs")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> CreateParserConfig([FromBody] DeviceParserConfig config, CancellationToken ct = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var created = await _deviceService.CreateParserConfigAsync(config, ct);
        return CreatedAtAction(nameof(GetParserConfig), new { id = created.Id }, created);
    }

    [HttpPut("parser-configs/{id}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> UpdateParserConfig(int id, [FromBody] DeviceParserConfig config, CancellationToken ct = default)
    {
        if (id != config.Id) return BadRequest("Id mismatch");
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _deviceService.UpdateParserConfigAsync(config, ct);
        return Ok(updated);
    }

    [HttpDelete("parser-configs/{id}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> DeleteParserConfig(int id, CancellationToken ct = default)
    {
        var result = await _deviceService.DeleteParserConfigAsync(id, ct);
        if (!result) return NotFound();
        
        return NoContent();
    }
}

/// <summary>
/// Richiesta per i dati grezzi del dispositivo
/// </summary>
public class RawDataRequest
{
    public string RawData { get; set; } = string.Empty;
}