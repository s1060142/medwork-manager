using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

/// <summary>
/// FASE 1 - Alert multi-canale. Dispatches PEC / SMS / Push / WhatsApp / Email notifications
/// to one or many employees via the IAlertService (which records delivery status + retries).
/// </summary>
[ApiController]
[Route("api/alerts")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _alerts;

    public AlertsController(IAlertService alerts) => _alerts = alerts;

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
}
