using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/scadenzario")]
[Authorize]
public class ScadenzarioController : ControllerBase
{
    private readonly IDeadlineService _deadlineService;

    public ScadenzarioController(IDeadlineService deadlineService)
    {
        _deadlineService = deadlineService;
    }

    /// <summary>Scadenze visite/accertamenti entro l'orizzonte (default 90 giorni). Include scadute.</summary>
    [HttpGet]
    public async Task<IActionResult> GetUpcoming([FromQuery] int horizonDays = 90, CancellationToken ct = default)
    {
        if (horizonDays is < 1 or > 365) horizonDays = 90;
        var alerts = await _deadlineService.GetUpcomingDeadlinesAsync(horizonDays, ct);
        return Ok(alerts);
    }

    /// <summary>Genera manualmente i promemoria (stessa logica del job notturno).</summary>
    [HttpPost("genera-promemoria")]
    [Authorize(Roles = "Admin,Doctor,Secretary")]
    public async Task<IActionResult> GenerateReminders([FromQuery] int horizonDays = 30, CancellationToken ct = default)
    {
        if (horizonDays is < 1 or > 365) horizonDays = 30;
        var count = await _deadlineService.GenerateRemindersAsync(horizonDays, ct);
        return Ok(new { promemoriaGenerati = count });
    }
}
