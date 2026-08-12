using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

/// <summary>
/// FASE 1 - Giudizio di idoneità strutturato. Records a fitness judgment on a MedicalVisit:
/// outcome (Idoneo / Parziale / Non idoneo / In attesa), prescriptions/limitations and next
/// review deadline. Distinct route to avoid clashing with FASE 0's visit endpoints.
/// </summary>
[ApiController]
[Route("api/visit-judgments")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class VisitJudgmentController : ControllerBase
{
    private readonly AppDbContext _db;

    public VisitJudgmentController(AppDbContext db) => _db = db;

    public sealed record JudgmentRequest(
        string OutcomeCode,
        string Outcome,
        string? Prescriptions,
        string? Limitations,
        DateTime? NextReviewDate);

    [HttpPut("{medicalVisitId:int}")]
    public async Task<IActionResult> SetJudgment(int medicalVisitId, [FromBody] JudgmentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.OutcomeCode) || string.IsNullOrWhiteSpace(request.Outcome))
            return BadRequest("OutcomeCode and Outcome are required.");

        var visit = await _db.MedicalVisits.FirstOrDefaultAsync(x => x.Id == medicalVisitId);
        if (visit is null) return NotFound();

        visit.OutcomeCode = request.OutcomeCode;
        visit.Outcome = request.Outcome;
        visit.ClinicalNotes = request.Prescriptions ?? visit.ClinicalNotes;
        visit.ObjectiveExam = request.Limitations ?? visit.ObjectiveExam;
        visit.NextDeadlineDate = request.NextReviewDate ?? visit.NextDeadlineDate;
        visit.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(visit);
    }

    [HttpGet("{medicalVisitId:int}")]
    public async Task<IActionResult> Get(int medicalVisitId)
    {
        var visit = await _db.MedicalVisits.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == medicalVisitId);
        if (visit is null) return NotFound();

        return Ok(new
        {
            visit.Id,
            visit.OutcomeCode,
            visit.Outcome,
            visit.ClinicalNotes,
            visit.ObjectiveExam,
            visit.NextDeadlineDate
        });
    }
}
