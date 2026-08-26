using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/questionnaires")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class QuestionnairesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IQuestionnaireScoringService _scoring;

    public QuestionnairesController(AppDbContext dbContext, IQuestionnaireScoringService scoring)
    {
        _dbContext = dbContext;
        _scoring = scoring;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? type, [FromQuery] string? riskFactor)
    {
        var query = _dbContext.Questionnaires.AsNoTracking().Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(x => x.Type == type);
        if (!string.IsNullOrWhiteSpace(riskFactor))
            query = query.Where(x => x.RiskFactor == riskFactor);

        return Ok(await query.OrderBy(x => x.Title).ToListAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var entity = await _dbContext.Questionnaires.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.TenantId == GetTenantId());
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPost("responses")]
    public async Task<IActionResult> SubmitResponse([FromBody] QuestionnaireResponse request)
    {
        var questionnaire = await _dbContext.Questionnaires
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.QuestionnaireId && x.TenantId == GetTenantId());
        if (questionnaire is null) return BadRequest("Questionnaire not found.");

        var (score, anomalous) = _scoring.Score(questionnaire.DefinitionJson, request.AnswersJson, questionnaire.AnomalyThreshold);
        request.Score = score;
        request.IsAnomalous = anomalous;

        _dbContext.QuestionnaireResponses.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpGet("responses/employee/{employeeId:int}")]
    public async Task<IActionResult> ResponsesByEmployee(int employeeId)
    {
        var list = await _dbContext.QuestionnaireResponses
            .AsNoTracking()
            .Where(x => x.EmployeeId == employeeId)
            .OrderByDescending(x => x.CompletedAt)
            .ToListAsync();
        return Ok(list);
    }

    private int GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value;
        if (int.TryParse(tenantClaim, out var tenantId))
        {
            return tenantId;
        }
        throw new UnauthorizedAccessException("Tenant ID non valido nel token.");
    }
}
