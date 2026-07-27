using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedWork.Api.Data;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize(Policy = Policies.CanViewRiskData)]
public class AuditController : ControllerBase
{
    private readonly AuditDbContext _auditContext;

    public AuditController(AuditDbContext auditContext)
    {
        _auditContext = auditContext;
    }

    /// <summary>
    /// Restituisce il registro di audit, filtrabile per entità/azione/utente.
    /// Accessibile a ruoli con visibilità di rischio o superiore (RSPP, Segreteria, Doctor, Admin).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAudit(
        [FromQuery] string? entityName,
        [FromQuery] string? action,
        [FromQuery] string? username,
        [FromQuery] int? top = 200)
    {
        var query = _auditContext.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(entityName))
            query = query.Where(x => x.EntityName == entityName);
        if (!string.IsNullOrWhiteSpace(action))
            query = query.Where(x => x.Action == action);
        if (!string.IsNullOrWhiteSpace(username))
            query = query.Where(x => x.Username == username);

        var data = await query
            .OrderByDescending(x => x.TimestampUtc)
            .Take(top ?? 200)
            .Select(x => new
            {
                x.Id,
                x.Username,
                x.Role,
                x.Action,
                x.EntityName,
                x.EntityId,
                x.Description,
                x.Source,
                x.TimestampUtc
            })
            .ToListAsync();

        return Ok(data);
    }
}
