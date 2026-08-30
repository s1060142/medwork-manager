using MedWork.Api.Data;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentGenerationService _documentGenerationService;
    private readonly AppDbContext _dbContext;

    public DocumentsController(IDocumentGenerationService documentGenerationService, AppDbContext dbContext)
    {
        _documentGenerationService = documentGenerationService;
        _dbContext = dbContext;
    }

    private int GetTenantId()
    {
        var claim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value;
        if (int.TryParse(claim, out var id) && id > 0)
            return id;
        throw new UnauthorizedAccessException("Tenant non specificato");
    }

    private async Task<IActionResult> ValidateVisitTenantAsync(int medicalVisitId)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var belongsToTenant = await _dbContext.MedicalVisits
            .AnyAsync(v => v.Id == medicalVisitId && v.TenantId == tenantId);

        if (!belongsToTenant) return NotFound();
        return null;
    }

    private async Task<IActionResult> ValidateCompanyTenantAsync(int companyId)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var belongsToTenant = await _dbContext.Companies
            .AnyAsync(c => c.Id == companyId && c.TenantId == tenantId);

        if (!belongsToTenant) return NotFound();
        return null;
    }

    [HttpPost("sanitary-plan/{employeeId:int}")]
    public async Task<IActionResult> GenerateSanitaryPlan(int employeeId)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var belongsToTenant = await _dbContext.Employees
            .AnyAsync(e => e.Id == employeeId && e.TenantId == tenantId);

        if (!belongsToTenant) return NotFound();

        try
        {
            var pdfBytes = await _documentGenerationService.GenerateSanitaryPlan(employeeId);
            return File(pdfBytes, "application/pdf", $"piano-sanitario-{employeeId}.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Dipendente {employeeId} non trovato.");
        }
    }

    [HttpPost("allegato-3b/{companyId:int}")]
    public async Task<IActionResult> GenerateAllegato3B(int companyId)
    {
        var tenantCheck = await ValidateCompanyTenantAsync(companyId);
        if (tenantCheck != null) return tenantCheck;

        try
        {
            var xmlBytes = await _documentGenerationService.GenerateAllegato3B(companyId);
            return File(xmlBytes, "application/xml", "Allegato3B.xml");
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Azienda {companyId} non trovata.");
        }
    }

    [HttpPost("fitness-judgment/{medicalVisitId:int}")]
    public async Task<IActionResult> GenerateFitnessJudgment(int medicalVisitId)
    {
        var tenantCheck = await ValidateVisitTenantAsync(medicalVisitId);
        if (tenantCheck != null) return tenantCheck;

        try
        {
            var pdfBytes = await _documentGenerationService.GenerateFitnessJudgment(medicalVisitId);
            return File(pdfBytes, "application/pdf", "GiudizioIdoneita.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Visita medica {medicalVisitId} non trovata.");
        }
    }

    [HttpPost("allegato-3b/{companyId:int}/validate")]
    public async Task<IActionResult> ValidateAllegato3B(int companyId)
    {
        var tenantCheck = await ValidateCompanyTenantAsync(companyId);
        if (tenantCheck != null) return tenantCheck;

        var result = await _documentGenerationService.ValidateAllegato3BXsd(companyId);
        return Ok(result);
    }

    [HttpPost("allegato-3b/{companyId:int}/submit")]
    public async Task<IActionResult> SubmitAllegato3B(int companyId)
    {
        var tenantCheck = await ValidateCompanyTenantAsync(companyId);
        if (tenantCheck != null) return tenantCheck;

        var result = await _documentGenerationService.SubmitAllegato3B(companyId);
        return Ok(result);
    }

    /// <summary>
    /// Returns a PDF binary of the fitness judgment for the given medical visit.
    /// </summary>
    [HttpGet("visits/{medicalVisitId:int}/fitness-judgment-pdf")]
    [Produces("application/pdf")]
    public async Task<IActionResult> DownloadFitnessJudgmentPdf(
        int medicalVisitId,
        CancellationToken cancellationToken)
    {
        var tenantCheck = await ValidateVisitTenantAsync(medicalVisitId);
        if (tenantCheck != null) return tenantCheck;

        try
        {
            var pdfBytes = await _documentGenerationService
                .GenerateFitnessJudgmentPdf(medicalVisitId, cancellationToken);

            return File(
                pdfBytes,
                "application/pdf",
                $"giudizio-idoneita-{medicalVisitId}.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Visita medica {medicalVisitId} non trovata.");
        }
    }
}