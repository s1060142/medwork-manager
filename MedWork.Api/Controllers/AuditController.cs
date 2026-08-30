using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize]
public class AuditController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AuditController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private int GetTenantId()
    {
        var claim = User.FindFirst("TenantId")?.Value;
        if (int.TryParse(claim, out var id) && id > 0)
            return id;
        throw new UnauthorizedAccessException("Tenant non specificato");
    }

    public record AuditEventRequest(string Module, string Action, string? Detail, string? UserName);
    public record AuditEventResponse(int Id, int TenantId, string? UserName, string Module, string Action, string? Detail, DateTime Timestamp, string? IpAddress);

    [HttpPost("events")]
    public async Task<IActionResult> PostEvent([FromBody] AuditEventRequest request)
    {
        var tenantId = GetTenantId();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var userName = request.UserName
            ?? User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst("name")?.Value;

        var auditEvent = new AuditEvent
        {
            TenantId = tenantId,
            UserName = userName,
            Module = request.Module,
            Action = request.Action,
            Detail = request.Detail,
            Timestamp = DateTime.UtcNow,
            IpAddress = ipAddress
        };

        _dbContext.AuditEvents.Add(auditEvent);
        await _dbContext.SaveChangesAsync();

        var response = new AuditEventResponse(
            auditEvent.Id,
            auditEvent.TenantId,
            auditEvent.UserName,
            auditEvent.Module,
            auditEvent.Action,
            auditEvent.Detail,
            auditEvent.Timestamp,
            auditEvent.IpAddress);

        return Ok(response);
    }

    [HttpGet("events")]
    public async Task<IActionResult> GetEvents()
    {
        var tenantId = GetTenantId();

        var events = await _dbContext.AuditEvents
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderByDescending(x => x.Timestamp)
            .Take(500)
            .Select(x => new AuditEventResponse(
                x.Id,
                x.TenantId,
                x.UserName,
                x.Module,
                x.Action,
                x.Detail,
                x.Timestamp,
                x.IpAddress))
            .ToListAsync();

        return Ok(events);
    }
}
