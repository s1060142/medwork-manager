using System;
using System.Collections.Generic;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

public record CalculateDeadlineRequest(
    DateTime VisitDate,
    DateTime? DateOfBirth,
    string? JobRole,
    List<string>? RiskFactors,
    string? OutcomeCode,
    string? Prescriptions,
    string? Limitations
);

[ApiController]
[Route("api/deadline-engine")]
[Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
public class DeadlineEngineController : BaseController
{
    private readonly IDeadlineRuleEngine _ruleEngine;

    public DeadlineEngineController(IDeadlineRuleEngine ruleEngine)
    {
        _ruleEngine = ruleEngine;
    }

    [HttpPost("calculate")]
    public IActionResult Calculate([FromBody] CalculateDeadlineRequest request)
    {
        var result = _ruleEngine.CalculateNextDeadline(
            request.VisitDate,
            request.DateOfBirth,
            request.JobRole,
            request.RiskFactors,
            request.OutcomeCode,
            request.Prescriptions,
            request.Limitations);

        return Ok(result);
    }
}
