using MedWork.Api.Contracts.MedicalVisits;
using MedWork.Api.Data;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/medical-visits")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class MedicalVisitsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public MedicalVisitsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("expiring")]
    [ProducesResponseType<List<ExpiringMedicalVisitDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ExpiringMedicalVisitDto>>> GetExpiringVisits([FromQuery] int days = 30)
    {
        if (days <= 0)
        {
            return BadRequest("Days must be greater than zero.");
        }

        var tenantId = GetTenantId();
        var today = DateTime.UtcNow.Date;
        var maxDate = today.AddDays(days);

        var visits = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Include(x => x.Employee)
                .ThenInclude(x => x.Company)
            .Include(x => x.VisitExams)
                .ThenInclude(x => x.ExamType)
            .Where(x => x.TenantId == tenantId && x.NextDeadlineDate.Date >= today && x.NextDeadlineDate.Date <= maxDate)
            .OrderBy(x => x.NextDeadlineDate)
            .Select(x => new ExpiringMedicalVisitDto
            {
                MedicalVisitId = x.Id,
                EmployeeFullName = x.Employee.FirstName + " " + x.Employee.LastName,
                CompanyName = x.Employee.Company.Name,
                NextDeadlineDate = x.NextDeadlineDate,
                Outcome = x.Outcome,
                Exams = x.VisitExams
                    .OrderBy(e => e.Id)
                    .Select(e => new VisitExamSummaryDto
                    {
                        ExamTypeName = e.ExamType.Name,
                        Result = e.Result
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(visits);
    }

    private int GetTenantId()
    {
        var claim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value;
        return int.TryParse(claim, out var id) && id > 0 ? id : 0;
    }
}
