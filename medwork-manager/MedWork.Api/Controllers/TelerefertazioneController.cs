using System;
using System.Linq;
using System.Threading.Tasks;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

/// <summary>
/// Telerefertazione ECG: piattaforma cardiologi. Espone la coda degli esami ECG
/// da refertare, la creazione/aggiornamento/firma dei referti e lo storico.
/// </summary>
[ApiController]
[Route("api/telerefertazione")]
[Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
public class TelerefertazioneController : ControllerBase
{
    private readonly ICardiologistReportService _reportService;

    public TelerefertazioneController(ICardiologistReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>Coda degli esami ECG ancora senza referto (telerefertazione).</summary>
    [HttpGet("coda")]
    public async Task<IActionResult> GetCoda()
    {
        var queue = await _reportService.GetEcgQueueAsync();
        return Ok(queue);
    }

    /// <summary>Elenco referti cardiologici (stato opzionale: Pending, Completed).</summary>
    [HttpGet("referti")]
    public async Task<IActionResult> GetReferti([FromQuery] string? status = null)
    {
        var reports = await _reportService.GetAllReportsAsync(status);
        return Ok(reports);
    }

    /// <summary>Dettaglio di un referto.</summary>
    [HttpGet("referti/{id:int}")]
    public async Task<IActionResult> GetReferto(int id)
    {
        var report = await _reportService.GetByIdAsync(id);
        if (report == null) return NotFound();
        return Ok(report);
    }

    /// <summary>Crea (o aggiorna) il referto per un esame ECG.</summary>
    [HttpPost("referti")]
    public async Task<IActionResult> CreateReferto([FromBody] TelerefertazioneRequest request)
    {
        if (request.VisitExamId <= 0)
            return BadRequest("VisitExamId richiesto.");
        if (string.IsNullOrWhiteSpace(request.ReportContent))
            return BadRequest("Il contenuto del referto è obbligatorio.");

        var report = new Models.CardiologistReport
        {
            VisitExamId = request.VisitExamId,
            CardiologistId = request.CardiologistId,
            ReportContent = request.ReportContent,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Pending" : request.Status,
            CompanyId = request.CompanyId,
            CreatedAt = DateTime.UtcNow,
        };

        var created = await _reportService.CreateAsync(report);
        return CreatedAtAction(nameof(GetReferto), new { id = created.Id }, created);
    }

    /// <summary>Aggiorna contenuto e stato di un referto esistente.</summary>
    [HttpPut("referti/{id:int}")]
    public async Task<IActionResult> UpdateReferto(int id, [FromBody] TelerefertazioneRequest request)
    {
        var existing = await _reportService.GetByIdAsync(id);
        if (existing == null) return NotFound();

        existing.ReportContent = request.ReportContent ?? existing.ReportContent;
        if (!string.IsNullOrWhiteSpace(request.Status)) existing.Status = request.Status;

        var updated = await _reportService.UpdateAsync(id, existing);
        return Ok(updated);
    }

    /// <summary>Firma il referto (SLA 24/48h): marca come completato e firmato.</summary>
    [HttpPost("referti/{id:int}/firma")]
    public async Task<IActionResult> Firma(int id, [FromBody] FirmaRequest request)
    {
        var ok = await _reportService.SignOffAsync(id, request?.CardiologistId.ToString() ?? string.Empty);
        if (!ok) return NotFound();
        return Ok(new { id, signedOff = true });
    }

    /// <summary>Elimina un referto (solo amministratori).</summary>
    [HttpDelete("referti/{id:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> DeleteReferto(int id)
    {
        var ok = await _reportService.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}

public class TelerefertazioneRequest
{
    public int VisitExamId { get; set; }
    public int CardiologistId { get; set; }
    public int CompanyId { get; set; }
    public string ReportContent { get; set; } = string.Empty;
    public string? Status { get; set; }
}

public class FirmaRequest
{
    public int CardiologistId { get; set; }
}
