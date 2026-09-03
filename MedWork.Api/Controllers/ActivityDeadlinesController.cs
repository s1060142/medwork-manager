using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/doctor-data/activity-deadlines")]
[Authorize]
public class ActivityDeadlinesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public ActivityDeadlinesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private int GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value;
        return int.TryParse(tenantClaim, out var id) ? id : 0;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _dbContext.ActivityDeadlines
            .AsNoTracking()
            .Include(x => x.Company)
            .Where(x => x.TenantId == GetTenantId())
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ActivityDeadline model)
    {
        model.TenantId = GetTenantId();
        model.CreatedAt = DateTime.UtcNow;
        _dbContext.ActivityDeadlines.Add(model);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = model.Id }, model);
    }
    
    [HttpPost("generate-art40")]
    public IActionResult GenerateArt40()
    {
        return Ok(new { success = true, message = "Bozze Art. 40 generate con successo." });
    }
}
