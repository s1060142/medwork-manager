using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/doctor-data/appointments")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AppointmentsController(AppDbContext dbContext)
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
        var items = await _dbContext.Appointments
            .AsNoTracking()
            .Include(x => x.Company)
            .Where(x => x.TenantId == GetTenantId())
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Appointment model)
    {
        model.TenantId = GetTenantId();
        model.CreatedAt = DateTime.UtcNow;
        _dbContext.Appointments.Add(model);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = model.Id }, model);
    }
}
