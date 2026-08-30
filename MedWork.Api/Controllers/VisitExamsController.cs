using MedWork.Api.Data;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/visit-exams")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class VisitExamsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public VisitExamsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("visit/{medicalVisitId:int}")]
    public async Task<IActionResult> GetByVisit(int medicalVisitId)
    {
        var exams = await _dbContext.VisitExams
            .AsNoTracking()
            .Include(x => x.ExamType)
            .Where(x => x.MedicalVisitId == medicalVisitId && x.TenantId == GetTenantId())
            .ToListAsync();

        return Ok(exams);
    }

    private int GetTenantId()
    {
        var claim = User.FindFirst("TenantId")?.Value;
        if (int.TryParse(claim, out var id) && id > 0)
            return id;
        throw new UnauthorizedAccessException("Tenant non specificato");
    }
}
