using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MedWork.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
[Route("api/[controller]")]
public class MedicalVisitAIController : ControllerBase
{
    private readonly IAIChartingService _aiChartingService;
    private readonly AppDbContext _dbContext;

    public MedicalVisitAIController(IAIChartingService aiChartingService, AppDbContext dbContext)
    {
        _aiChartingService = aiChartingService;
        _dbContext = dbContext;
    }

    public class VoiceNoteRequest
    {
        public string VoiceNoteUrl { get; set; } = default!;
    }

    public class OcrRequest
    {
        public string ImageUrl { get; set; } = default!;
    }

    [HttpPost("{visitId:int}/voice-transcribe")]
    public async Task<ActionResult<string>> TranscribeVoice(int visitId, [FromBody] VoiceNoteRequest request)
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value;
        if (!int.TryParse(tenantClaim, out var tenantId) || tenantId < 1)
        {
            return Unauthorized();
        }

        var visit = await _dbContext.MedicalVisits.FirstOrDefaultAsync(v => v.Id == visitId && v.TenantId == tenantId);
        if (visit == null)
        {
            return NotFound();
        }

        var transcription = await _aiChartingService.TranscribeVoiceAsync(request.VoiceNoteUrl);
        if (string.IsNullOrWhiteSpace(transcription))
        {
            return BadRequest("Transcription failed or returned empty.");
        }

        visit.ClinicalNotes = transcription;
        await _dbContext.SaveChangesAsync();

        return Ok(transcription);
    }

    [HttpPost("{visitId:int}/ocr-extract")]
    public async Task<ActionResult<string>> ExtractOcr(int visitId, [FromBody] OcrRequest request)
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value;
        if (!int.TryParse(tenantClaim, out var tenantId) || tenantId < 1)
        {
            return Unauthorized();
        }

        var visit = await _dbContext.MedicalVisits.FirstOrDefaultAsync(v => v.Id == visitId && v.TenantId == tenantId);
        if (visit == null)
        {
            return NotFound();
        }

        var ocrResult = await _aiChartingService.ExtractOcrDataAsync(request.ImageUrl);
        if (string.IsNullOrWhiteSpace(ocrResult))
        {
            return BadRequest("OCR failed or returned empty.");
        }

        visit.OcrData = ocrResult;
        await _dbContext.SaveChangesAsync();

        return Ok(ocrResult);
    }
}