using System.Security.Claims;
using MedWork.Api.Data;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin + "," + AppRole.Employer + "," + AppRole.Rspp)]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentGenerationService _documentGenerationService;
    private readonly AppDbContext _dbContext;

    public DocumentsController(IDocumentGenerationService documentGenerationService, AppDbContext dbContext)
    {
        _documentGenerationService = documentGenerationService;
        _dbContext = dbContext;
    }

    private int? GetCompanyIdClaim()
    {
        var raw = User.FindFirst("companyId")?.Value;
        if (int.TryParse(raw, out var id))
            return id;
        return null;
    }

    [HttpGet("fitness-judgment/{medicalVisitId:int}")]
    public async Task<IActionResult> GenerateFitnessJudgment(int medicalVisitId)
    {
        try
        {
            var pdf = await _documentGenerationService.GenerateFitnessJudgment(medicalVisitId);
            return File(pdf, "application/pdf", $"giudizio-idoneita-{medicalVisitId}.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("sanitary-plan/{employeeId:int}")]
    public async Task<IActionResult> GenerateSanitaryPlan(int employeeId)
    {
        try
        {
            var pdf = await _documentGenerationService.GenerateSanitaryPlan(employeeId);
            return File(pdf, "application/pdf", $"piano-sanitario-{employeeId}.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("allegato-3b")]
    [HttpGet("allegato-3b/{companyId:int}")]
    public async Task<IActionResult> GenerateAllegato3B(int? companyId)
    {
        var resolved = companyId ?? GetCompanyIdClaim();
        if (resolved is null)
        {
            // Fallback: prima azienda disponibile (utile per Admin/Doctor).
            resolved = await _dbContext.Companies.AsNoTracking().OrderBy(c => c.Id).Select(c => c.Id).FirstOrDefaultAsync();
        }

        if (resolved is null || resolved.Value == 0)
            return BadRequest("Nessuna azienda associata.");

        try
        {
            var pdf = await _documentGenerationService.GenerateAllegato3B(resolved.Value);
            return File(pdf, "application/pdf", $"allegato-3b-{resolved.Value}.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
