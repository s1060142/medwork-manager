using MedWork.Api.Data;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin + "," + AppRole.Employer + "," + AppRole.RSPP)]
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

    private async Task<IActionResult?> ValidateVisitTenantAsync(int medicalVisitId)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var visit = await _dbContext.MedicalVisits
            .Include(v => v.Employee)
            .FirstOrDefaultAsync(v => v.Id == medicalVisitId && v.TenantId == tenantId);

        if (visit == null) return NotFound();

        if (User.IsInRole(AppRole.Employer) || User.IsInRole(AppRole.RSPP))
        {
            var userCompanyClaim = User.FindFirst("CompanyId")?.Value ?? User.FindFirst("company_id")?.Value;
            if (int.TryParse(userCompanyClaim, out var userCompanyId) && userCompanyId > 0)
            {
                if (visit.Employee == null || visit.Employee.CompanyId != userCompanyId)
                {
                    return Forbid();
                }
            }
            else
            {
                return Forbid();
            }
        }

        return null;
    }

    private async Task<IActionResult?> ValidateEmployeeTenantAsync(int employeeId)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var employee = await _dbContext.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId && e.TenantId == tenantId);

        if (employee == null) return NotFound();

        if (User.IsInRole(AppRole.Employer) || User.IsInRole(AppRole.RSPP))
        {
            var userCompanyClaim = User.FindFirst("CompanyId")?.Value ?? User.FindFirst("company_id")?.Value;
            if (int.TryParse(userCompanyClaim, out var userCompanyId) && userCompanyId > 0)
            {
                if (employee.CompanyId != userCompanyId)
                {
                    return Forbid();
                }
            }
            else
            {
                return Forbid();
            }
        }

        return null;
    }

    private async Task<IActionResult?> ValidateCompanyTenantAsync(int companyId)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var belongsToTenant = await _dbContext.Companies
            .AnyAsync(c => c.Id == companyId && c.TenantId == tenantId);

        if (!belongsToTenant) return NotFound();

        if (User.IsInRole(AppRole.Employer) || User.IsInRole(AppRole.RSPP))
        {
            var userCompanyClaim = User.FindFirst("CompanyId")?.Value ?? User.FindFirst("company_id")?.Value;
            if (int.TryParse(userCompanyClaim, out var userCompanyId) && userCompanyId > 0)
            {
                if (userCompanyId != companyId)
                {
                    return Forbid();
                }
            }
            else
            {
                return Forbid();
            }
        }

        return null;
    }

    [HttpPost("sanitary-plan/{employeeId:int}")]
    public async Task<IActionResult> GenerateSanitaryPlan(int employeeId)
    {
        var tenantCheck = await ValidateEmployeeTenantAsync(employeeId);
        if (tenantCheck != null) return tenantCheck;

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

    /// <summary>
    /// Returns a PDF binary of the official Allegato 3A Cartella Sanitaria e di Rischio.
    /// Strictly confidential: only accessible by Doctor and Admin (GDPR health data protection).
    /// </summary>
    [HttpGet("visits/{medicalVisitId:int}/allegato-3a-pdf")]
    [HttpPost("allegato-3a/{medicalVisitId:int}")]
    [Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
    [Produces("application/pdf")]
    public async Task<IActionResult> DownloadAllegato3APdf(
        int medicalVisitId,
        CancellationToken cancellationToken)
    {
        var tenantCheck = await ValidateVisitTenantAsync(medicalVisitId);
        if (tenantCheck != null) return tenantCheck;

        try
        {
            var pdfBytes = await _documentGenerationService
                .GenerateAllegato3A(medicalVisitId, cancellationToken);

            return File(
                pdfBytes,
                "application/pdf",
                $"allegato-3a-cartella-sanitaria-{medicalVisitId}.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Visita medica {medicalVisitId} non trovata.");
        }
    }

    /// <summary>
    /// Returns a PDF binary of the Relazione Sanitaria Annuale Art. 40 D.Lgs. 81/08.
    /// </summary>
    [HttpGet("companies/{companyId:int}/annual-report-pdf")]
    [HttpPost("companies/{companyId:int}/annual-report")]
    [Produces("application/pdf")]
    public async Task<IActionResult> DownloadAnnualReportPdf(
        int companyId,
        [FromQuery] int? year,
        CancellationToken cancellationToken)
    {
        var tenantCheck = await ValidateCompanyTenantAsync(companyId);
        if (tenantCheck != null) return tenantCheck;

        var refYear = year ?? DateTime.UtcNow.Year;

        try
        {
            var pdfBytes = await _documentGenerationService
                .GenerateAnnualReport(companyId, refYear, cancellationToken);

            return File(
                pdfBytes,
                "application/pdf",
                $"relazione-sanitaria-art40-{companyId}-{refYear}.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Azienda {companyId} non trovata.");
        }
    }

    /// <summary>
    /// Generates and downloads a ZIP archive containing the latest fitness judgment PDFs for all employees of the specified company.
    /// </summary>
    [HttpGet("companies/{companyId:int}/judgments-zip")]
    [HttpGet("company/{companyId:int}/judgments-zip")]
    [Produces("application/zip")]
    public async Task<IActionResult> DownloadCompanyJudgmentsZip(
        int companyId,
        CancellationToken cancellationToken)
    {
        var tenantCheck = await ValidateCompanyTenantAsync(companyId);
        if (tenantCheck != null) return tenantCheck;

        var tenantId = GetTenantId();
        var company = await _dbContext.Companies
            .FirstOrDefaultAsync(c => c.Id == companyId && c.TenantId == tenantId, cancellationToken);

        if (company == null) return NotFound("Azienda non trovata.");

        var visits = await _dbContext.MedicalVisits
            .Include(v => v.Employee)
            .Where(v => v.TenantId == tenantId && v.Employee != null && v.Employee.CompanyId == companyId)
            .OrderByDescending(v => v.VisitDate)
            .ToListAsync(cancellationToken);

        var latestVisits = visits
            .GroupBy(v => v.EmployeeId)
            .Select(g => g.First())
            .ToList();

        if (latestVisits.Count == 0)
        {
            return BadRequest(new { message = "Nessun giudizio di idoneità presente per l'azienda specificata." });
        }

        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var visit in latestVisits)
            {
                try
                {
                    var pdfBytes = await _documentGenerationService.GenerateFitnessJudgmentPdf(visit.Id, cancellationToken);
                    var cleanLastName = (visit.Employee?.LastName ?? "Lavoratore").Replace(" ", "_");
                    var cleanFirstName = (visit.Employee?.FirstName ?? "Dipendente").Replace(" ", "_");
                    var fileName = $"Giudizio_{cleanLastName}_{cleanFirstName}_{visit.VisitDate:yyyyMMdd}.pdf";

                    var entry = archive.CreateEntry(fileName, CompressionLevel.Fastest);
                    using var entryStream = entry.Open();
                    await entryStream.WriteAsync(pdfBytes, 0, pdfBytes.Length, cancellationToken);
                }
                catch
                {
                    // Proceed with other documents in bulk export
                }
            }
        }

        memoryStream.Position = 0;
        var zipBytes = memoryStream.ToArray();
        var safeCompName = (company.Name ?? "Azienda").Replace(" ", "_").Replace("/", "_");
        return File(zipBytes, "application/zip", $"Giudizi_Idoneita_{safeCompName}_{DateTime.UtcNow:yyyyMMdd}.zip");
    }
}