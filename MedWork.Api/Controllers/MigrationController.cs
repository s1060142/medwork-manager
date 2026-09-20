using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/migration")]
[Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
public class MigrationController : BaseController
{
    private readonly ILegacyMigrationService _migrationService;

    public MigrationController(ILegacyMigrationService migrationService)
    {
        _migrationService = migrationService;
    }

    [HttpPost("import-package")]
    public async Task<IActionResult> ImportPackage([FromBody] LegacyImportPayload payload)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var report = await _migrationService.ImportLegacyPackageAsync(tenantId, payload);
        return Ok(report);
    }

    [HttpPost("dry-run")]
    public async Task<IActionResult> DryRun([FromBody] LegacyImportPayload payload)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var result = await _migrationService.DryRunPackageAsync(tenantId, payload);
        return Ok(result);
    }

    [HttpPost("execute")]
    public async Task<IActionResult> Execute([FromBody] LegacyImportPayload payload)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var report = await _migrationService.ImportLegacyPackageAsync(tenantId, payload);
        return Ok(report);
    }

    public record ParseCsvRequest(string CsvContent, string SourceFormat);

    [HttpPost("parse-csv")]
    public async Task<IActionResult> ParseCsv([FromBody] ParseCsvRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CsvContent))
        {
            return BadRequest("Il contenuto CSV non può essere vuoto.");
        }

        var parsed = await _migrationService.ParseCsvContentAsync(request.CsvContent, request.SourceFormat ?? "UniversalCsv");
        return Ok(parsed);
    }
}
