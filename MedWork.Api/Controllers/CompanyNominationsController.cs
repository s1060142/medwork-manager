using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/doctor-data/company-nominations")]
[Authorize]
public class CompanyNominationsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CompanyNominationsController(AppDbContext dbContext)
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
        var items = await _dbContext.CompanyNominations
            .AsNoTracking()
            .Include(x => x.Company)
            .Include(x => x.Employee)
            .Where(x => x.TenantId == GetTenantId())
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CompanyNomination model)
    {
        model.TenantId = GetTenantId();
        model.CreatedAt = DateTime.UtcNow;
        _dbContext.CompanyNominations.Add(model);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = model.Id }, model);
    }
    
    [HttpPost("request-update")]
    public IActionResult RequestUpdate()
    {
        return Ok(new { success = true, message = "Richiesta aggiornamento inviata." });
    }
}
