using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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

        var visit = await _db.MedicalVisits.FirstOrDefaultAsync(x => x.Id == medicalVisitId && x.TenantId == GetTenantId());
        if (visit is null) return NotFound();

        visit.OutcomeCode = request.OutcomeCode;
        visit.Outcome = request.Outcome;
        visit.Prescriptions = request.Prescriptions;
        visit.Limitations = request.Limitations;
        visit.NextDeadlineDate = request.NextReviewDate ?? visit.NextDeadlineDate;
        visit.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(visit);
    }

    [HttpGet("{medicalVisitId:int}")]
    public async Task<IActionResult> Get(int medicalVisitId)
    {
        var visit = await _db.MedicalVisits.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == medicalVisitId && x.TenantId == GetTenantId());
        if (visit is null) return NotFound();

        return Ok(new
        {
            visit.Id,
            visit.OutcomeCode,
            visit.Outcome,
            visit.Prescriptions,
            visit.Limitations,
            visit.ClinicalNotes,
            visit.ObjectiveExam,
            visit.NextDeadlineDate
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? companyId = null,
        [FromQuery] int? employeeId = null,
        [FromQuery] string? outcomeCode = null,
        [FromQuery] string? search = null)
    {
        var tenantId = GetTenantId();
        var query = _db.MedicalVisits
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId);

        if (companyId.HasValue && companyId.Value > 0)
            query = query.Where(x => x.Employee != null && x.Employee.CompanyId == companyId.Value);

        if (employeeId.HasValue && employeeId.Value > 0)
            query = query.Where(x => x.EmployeeId == employeeId.Value);

        if (!string.IsNullOrWhiteSpace(outcomeCode))
            query = query.Where(x => x.OutcomeCode == outcomeCode);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(x =>
                (x.Employee != null && (
                    x.Employee.FirstName.ToLower().Contains(s) ||
                    x.Employee.LastName.ToLower().Contains(s) ||
                    x.Employee.TaxCode.ToLower().Contains(s) ||
                    (x.Employee.Company != null && x.Employee.Company.Name.ToLower().Contains(s))
                )) ||
                (x.Doctor != null && (x.Doctor.FirstName.ToLower().Contains(s) || x.Doctor.LastName.ToLower().Contains(s))) ||
                x.Outcome.ToLower().Contains(s)
            );
        }

        var data = await query
            .OrderByDescending(x => x.VisitDate)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                EmployeeFullName = x.Employee != null ? x.Employee.FirstName + " " + x.Employee.LastName : "—",
                EmployeeTaxCode = x.Employee != null ? x.Employee.TaxCode : null,
                EmployeeJobRole = x.Employee != null ? x.Employee.JobRole : null,
                CompanyId = x.Employee != null ? x.Employee.CompanyId : 0,
                CompanyName = x.Employee != null && x.Employee.Company != null ? x.Employee.Company.Name : "—",
                x.DoctorId,
                DoctorFullName = x.Doctor != null ? "Dott. " + x.Doctor.FirstName + " " + x.Doctor.LastName : "—",
                x.VisitDate,
                VisitType = x.VisitType.ToString(),
                x.OutcomeCode,
                x.Outcome,
                x.Prescriptions,
                x.Limitations,
                x.ClinicalNotes,
                x.NextDeadlineDate,
                x.IsSigned
            })
            .ToListAsync();

        return Ok(data);
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
