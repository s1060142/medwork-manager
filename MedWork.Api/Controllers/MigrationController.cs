using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
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
}
