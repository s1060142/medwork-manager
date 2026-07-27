using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/convocazioni")]
[Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
public class ConvocazioniController : ControllerBase
{
    private readonly IConvocationService _convocationService;

    public ConvocazioniController(IConvocationService convocationService)
    {
        _convocationService = convocationService;
    }

    [HttpPost("invia")]
    public async Task<IActionResult> Invia([FromBody] ConvocazioneRequest request)
    {
        if (request.EmployeeId <= 0)
            return BadRequest("EmployeeId richiesto.");

        try
        {
            var log = await _convocationService.SendConvocationAsync(
                request.EmployeeId,
                request.VisitDate,
                request.VisitType,
                request.Location);
            return Ok(new { id = log.Id, sentDate = log.SentDate, message = log.MessageText });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("invia-massa")]
    public async Task<IActionResult> InviaMassa([FromBody] ConvocazioneMassaRequest request)
    {
        if (request.EmployeeIds == null || request.EmployeeIds.Count == 0)
            return BadRequest("Almeno un EmployeeId richiesto.");

        try
        {
            var logs = await _convocationService.SendMassConvocationAsync(
                request.EmployeeIds,
                request.VisitDate,
                request.VisitType,
                request.Location);
            return Ok(new { inviati = logs.Count, dettagli = logs.Select(l => new { id = l.Id, messaggio = l.MessageText }) });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("pdf/{employeeId:int}")]
    public async Task<IActionResult> Pdf(int employeeId, [FromQuery] DateTime visitDate, [FromQuery] string visitType = "Periodic", [FromQuery] string? location = null)
    {
        try
        {
            var pdf = await _convocationService.GenerateConvocationPdfAsync(employeeId, visitDate, visitType, location);
            return File(pdf, "application/pdf", $"convocazione-{employeeId}.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}

public class ConvocazioneRequest
{
    public int EmployeeId { get; set; }
    public DateTime VisitDate { get; set; }
    public string VisitType { get; set; } = "Periodic";
    public string? Location { get; set; }
}

public class ConvocazioneMassaRequest
{
    public List<int> EmployeeIds { get; set; } = new();
    public DateTime VisitDate { get; set; }
    public string VisitType { get; set; } = "Periodic";
    public string? Location { get; set; }
}
