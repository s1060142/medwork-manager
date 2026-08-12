using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentGenerationService _documentGenerationService;

    public DocumentsController(IDocumentGenerationService documentGenerationService)
    {
        _documentGenerationService = documentGenerationService;
    }

    [HttpPost("sanitary-plan/{employeeId:int}")]
    public async Task<IActionResult> GenerateSanitaryPlan(int employeeId)
    {
        var result = await _documentGenerationService.GenerateSanitaryPlan(employeeId);
        return Ok(new { message = result });
    }

    [HttpPost("allegato-3b/{companyId:int}")]
    public async Task<IActionResult> GenerateAllegato3B(int companyId)
    {
        var result = await _documentGenerationService.GenerateAllegato3B(companyId);
        return Ok(new { message = result });
    }

    [HttpPost("fitness-judgment/{medicalVisitId:int}")]
    public async Task<IActionResult> GenerateFitnessJudgment(int medicalVisitId)
    {
        var result = await _documentGenerationService.GenerateFitnessJudgment(medicalVisitId);
        return Ok(new { message = result });
    }

    [HttpPost("allegato-3b/{companyId:int}/validate")]
    public async Task<IActionResult> ValidateAllegato3B(int companyId)
    {
        var result = await _documentGenerationService.ValidateAllegato3BXsd(companyId);
        return Ok(result);
    }

    [HttpPost("allegato-3b/{companyId:int}/submit")]
    public async Task<IActionResult> SubmitAllegato3B(int companyId)
    {
        var result = await _documentGenerationService.SubmitAllegato3B(companyId);
        return Ok(result);
    }
}