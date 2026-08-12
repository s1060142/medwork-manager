using MedWork.Api.Compliance;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

/// <summary>
/// FASE 3 - Compliance Engine + Regulatory Changelog + DPIA + Consent.
/// Exposes pure domain services. No AppDbContext dependency.
/// </summary>
[ApiController]
[Route("api/compliance")]
[Authorize(Roles = "Admin,Doctor")]
public sealed class ComplianceController : ControllerBase
{
    private readonly IComplianceRuleEngine _rules;
    private readonly IRegulatoryChangelogParser _changelog;
    private readonly IDpiaAssistant _dpia;
    private readonly IConsentManager _consent;

    public ComplianceController(
        IComplianceRuleEngine rules,
        IRegulatoryChangelogParser changelog,
        IDpiaAssistant dpia,
        IConsentManager consent)
    {
        _rules = rules;
        _changelog = changelog;
        _dpia = dpia;
        _consent = consent;
    }

    [HttpPost("evaluate-protocol")]
    public IActionResult EvaluateProtocol([FromBody] ProtocolEvaluationContext context)
    {
        if (context is null) return BadRequest("Context required.");
        var results = _rules.Evaluate(context);
        return Ok(new { compliant = _rules.IsCompliant(context), results });
    }

    [HttpPost("regulatory-changelog")]
    public IActionResult ParseChangelog([FromBody] IReadOnlyList<string> rawTexts)
    {
        var changes = _changelog.ParseBatch(rawTexts ?? Array.Empty<string>());
        return Ok(changes);
    }

    [HttpPost("dpia")]
    public IActionResult BuildDpia([FromBody] ProcessingProfile profile)
    {
        if (profile is null) return BadRequest("Profile required.");
        return Ok(_dpia.Build(profile));
    }

    [HttpPost("consent/grant")]
    public IActionResult GrantConsent([FromBody] ConsentState state, [FromQuery] string purpose)
    {
        if (state is null || string.IsNullOrWhiteSpace(purpose)) return BadRequest("state + purpose required.");
        return Ok(_consent.ApplyGrant(state, purpose));
    }

    [HttpPost("consent/revoke")]
    public IActionResult RevokeConsent([FromBody] ConsentState state, [FromQuery] string purpose)
    {
        if (state is null || string.IsNullOrWhiteSpace(purpose)) return BadRequest("state + purpose required.");
        return Ok(_consent.ApplyRevocation(state, purpose));
    }

    [HttpGet("consent/dsar")]
    public IActionResult ExportDsar([FromBody] ConsentState state)
    {
        if (state is null) return BadRequest("state required.");
        return Content(_consent.ExportDsar(state), "text/plain");
    }
}
