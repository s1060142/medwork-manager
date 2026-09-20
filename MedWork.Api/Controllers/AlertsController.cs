using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/alerts")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class AlertsController : BaseController
{
    private readonly IAlertService _alerts;
    private readonly IPecDeliveryService _pecService;
    private readonly AppDbContext _db;

    public AlertsController(IAlertService alerts, IPecDeliveryService pecService, AppDbContext db)
    {
        _alerts = alerts;
        _pecService = pecService;
        _db = db;
    }

    public sealed record SendBulkRequest(IEnumerable<int> Recipients, int Channel, string Message);

    [HttpPost("send-bulk")]
    public async Task<IActionResult> SendBulk([FromBody] SendBulkRequest request)
    {
        if (request.Recipients is null || !request.Recipients.Any())
            return BadRequest("At least one recipient is required.");

        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest("Message is required.");

        if (!Enum.IsDefined(typeof(NotificationChannel), request.Channel))
            return BadRequest("Unknown notification channel.");

        var targets = request.Recipients.Select(id => (id, request.Message));
        var results = await _alerts.SendBulkAsync(targets, (NotificationChannel)request.Channel);
        return Ok(results.Select(r => new
        {
            employeeId = r.EmployeeId,
            channel = r.Channel.ToString(),
            isDelivered = r.IsDelivered,
            errorMessage = r.ErrorMessage,
            sentDate = r.SentDate
        }));
    }

    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] SendBulkRequest request)
    {
        var employeeId = request.Recipients?.FirstOrDefault() ?? 0;
        if (employeeId <= 0)
            return BadRequest("Exactly one recipient is required.");

        if (!Enum.IsDefined(typeof(NotificationChannel), request.Channel))
            return BadRequest("Unknown notification channel.");

        var result = await _alerts.SendAsync(employeeId, (NotificationChannel)request.Channel, request.Message);
        return Ok(new
        {
            employeeId = result.EmployeeId,
            channel = result.Channel.ToString(),
            isDelivered = result.IsDelivered,
            errorMessage = result.ErrorMessage
        });
    }

    // --- PEC DELIVERY HUB ENDPOINTS ---

    [HttpGet("pec-settings")]
    public async Task<IActionResult> GetPecSettings()
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var settings = await _pecService.GetPecSettingsAsync(tenantId);
        return Ok(settings);
    }

    [HttpPost("pec-settings")]
    public async Task<IActionResult> SavePecSettings([FromBody] PecSettingsDto dto)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        await _pecService.SavePecSettingsAsync(tenantId, dto);
        return Ok(new { success = true, message = "Impostazioni PEC salvate con successo." });
    }

    [HttpPost("test-pec-connection")]
    public async Task<IActionResult> TestPecConnection([FromBody] PecSettingsDto dto)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var (success, msg) = await _pecService.TestPecConnectionAsync(tenantId, dto);
        return Ok(new { success, message = msg });
    }

    public record SendJudgmentPecRequest(int VisitId, string? OverrideRecipientPec);

    [HttpPost("send-judgment-pec")]
    public async Task<IActionResult> SendJudgmentPec([FromBody] SendJudgmentPecRequest request)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        if (request.VisitId <= 0) return BadRequest("visitId non valido.");

        var result = await _pecService.SendJudgmentPecAsync(tenantId, request.VisitId, request.OverrideRecipientPec);
        return Ok(result);
    }

    public record SendBulkJudgmentsPecRequest(List<int> VisitIds);

    [HttpPost("send-bulk-judgments-pec")]
    public async Task<IActionResult> SendBulkJudgmentsPec([FromBody] SendBulkJudgmentsPecRequest request)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        if (request.VisitIds == null || request.VisitIds.Count == 0)
        {
            return BadRequest("Selezionare almeno un giudizio di idoneità da inviare.");
        }

        var results = await _pecService.SendBulkJudgmentsPecAsync(tenantId, request.VisitIds);
        return Ok(results);
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetNotificationLogs([FromQuery] int? channel = null, [FromQuery] int limit = 50)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var query = _db.NotificationLogs
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId);

        if (channel.HasValue)
        {
            query = query.Where(x => (int)x.Channel == channel.Value);
        }

        var data = await query
            .OrderByDescending(x => x.SentDate)
            .Take(limit)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                x.Email,
                channel = x.Channel.ToString(),
                x.MessageText,
                x.IsDelivered,
                x.DeliveredAt,
                x.ErrorMessage,
                x.SentDate
            })
            .ToListAsync();

        return Ok(data);
    }
}
