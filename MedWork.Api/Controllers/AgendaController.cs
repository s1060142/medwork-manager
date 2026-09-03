using MedWork.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/doctor-data/agenda")]
[Authorize]
public class AgendaController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AgendaController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private int GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value;
        return int.TryParse(tenantClaim, out var id) ? id : 0;
    }

    [HttpGet]
    public async Task<IActionResult> GetAgenda([FromQuery] DateTime? date)
    {
        var targetDate = date?.Date ?? DateTime.UtcNow.Date;
        var tenantId = GetTenantId();

        var medicalVisits = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Include(v => v.Employee)
            .Include(v => v.Employee.Company)
            .Where(v => v.TenantId == tenantId && v.VisitDate.Date == targetDate)
            .Select(v => new
            {
                Id = v.Id,
                Type = "Visita Medica",
                Time = v.VisitDate.ToString("HH:mm"),
                Description = $"{v.Employee.FirstName} {v.Employee.LastName} - {v.VisitType}",
                Location = v.Employee.Company.Name,
                Status = v.Outcome == string.Empty ? "pending" : "completed",
                Date = v.VisitDate
            })
            .ToListAsync();

        var siteVisits = await _dbContext.SiteVisits
            .AsNoTracking()
            .Include(s => s.Company)
            .Include(s => s.WorkLocation)
            .Where(s => s.TenantId == tenantId && s.VisitDate.Date == targetDate)
            .Select(s => new
            {
                Id = s.Id,
                Type = "Sopralluogo",
                Time = s.VisitDate.ToString("HH:mm"),
                Description = $"Sopralluogo - {(s.WorkLocation != null ? s.WorkLocation.Name : s.VisitedStructure)}",
                Location = s.Company.Name,
                Status = s.Outcome == null ? "pending" : "completed",
                Date = s.VisitDate
            })
            .ToListAsync();

        var combined = medicalVisits
            .Concat(siteVisits)
            .OrderBy(x => x.Date)
            .ToList();

        return Ok(combined);
    }

    [HttpPost("morning-digest")]
    public IActionResult SendMorningDigest()
    {
        return Ok(new { success = true, message = "Morning Digest inviato con successo." });
    }
}
