using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/ppe")]
[Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
public class PpeController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public PpeController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // PPE CRUD
    [HttpGet("")]
    public async Task<IActionResult> GetPpes([FromQuery] bool activeOnly = true)
    {
        var query = _dbContext.Ppes.AsNoTracking();
        
        if (activeOnly)
            query = query.Where(x => x.IsActive);

        query = query.OrderBy(x => x.Category).ThenBy(x => x.Name);

        var data = await query
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Category,
                x.Standard,
                x.ProtectionLevel,
                x.Description,
                x.Manufacturer,
                x.Model,
                x.IsActive,
                x.CreatedAt,
                x.UpdatedAt
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPpe(int id)
    {
        var ppe = await _dbContext.Ppes
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (ppe is null) return NotFound();

        return Ok(ppe);
    }

    [HttpPost("")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> CreatePpe([FromBody] Ppe request)
    {
        request.CreatedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;
        
        _dbContext.Ppes.Add(request);
        await _dbContext.SaveChangesAsync();
        
        return Ok(request);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> UpdatePpe(int id, [FromBody] Ppe request)
    {
        var entity = await _dbContext.Ppes.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        entity.Name = request.Name;
        entity.Category = request.Category;
        entity.Standard = request.Standard;
        entity.ProtectionLevel = request.ProtectionLevel;
        entity.Description = request.Description;
        entity.Manufacturer = request.Manufacturer;
        entity.Model = request.Model;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> DeletePpe(int id)
    {
        var entity = await _dbContext.Ppes.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        // Check if PPE is assigned to any employee or job role
        var hasAssignments = await _dbContext.EmployeePpes.AnyAsync(x => x.PpeId == id) ||
                             await _dbContext.JobRolePpes.AnyAsync(x => x.PpeId == id);
        
        if (hasAssignments)
        {
            return Conflict("Impossibile eliminare: il DPI è associato a lavoratori o mansioni.");
        }

        _dbContext.Ppes.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    // Employee PPE assignments
    [HttpGet("employee/{employeeId:int}")]
    public async Task<IActionResult> GetEmployeePpes(int employeeId)
    {
        var data = await _dbContext.EmployeePpes
            .AsNoTracking()
            .Where(x => x.EmployeeId == employeeId)
            .Include(x => x.Ppe)
            .OrderBy(x => x.AssignedDate)
            .Select(x => new
            {
                x.EmployeeId,
                x.PpeId,
                PpeName = x.Ppe!.Name,
                PpeCategory = x.Ppe.Category,
                PpeStandard = x.Ppe.Standard,
                PpeProtectionLevel = x.Ppe.ProtectionLevel,
                x.AssignedDate,
                x.ExpiryDate,
                x.Size,
                x.SerialNumber,
                x.Notes,
                x.IsReturned,
                x.ReturnedDate
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpPost("employee")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> AssignPpeToEmployee([FromBody] EmployeePpe request)
    {
        // Validate employee and PPE exist
        var employee = await _dbContext.Employees.FindAsync(request.EmployeeId);
        if (employee is null) return NotFound("Lavoratore non trovato");

        var ppe = await _dbContext.Ppes.FindAsync(request.PpeId);
        if (ppe is null) return NotFound("DPI non trovato");

        // Check if already assigned
        var exists = await _dbContext.EmployeePpes
            .AnyAsync(x => x.EmployeeId == request.EmployeeId && x.PpeId == request.PpeId && !x.IsReturned);
        
        if (exists)
            return Conflict("Il DPI è già assegnato a questo lavoratore e non è stato restituito.");

        request.AssignedDate = DateTime.UtcNow;
        
        _dbContext.EmployeePpes.Add(request);
        await _dbContext.SaveChangesAsync();
        
        return Ok(request);
    }

    [HttpPut("employee/{employeeId:int}/{ppeId:int}/return")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> ReturnPpe(int employeeId, int ppeId, [FromBody] ReturnPpeRequest request)
    {
        var entity = await _dbContext.EmployeePpes
            .FirstOrDefaultAsync(x => x.EmployeeId == employeeId && x.PpeId == ppeId && !x.IsReturned);
        
        if (entity is null) return NotFound("Assegnazione DPI non trovata o già restituito");

        entity.IsReturned = true;
        entity.ReturnedDate = request.ReturnedDate ?? DateTime.UtcNow;
        entity.Notes = request.Notes ?? entity.Notes;

        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("employee/{employeeId:int}/{ppeId:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> DeleteEmployeePpe(int employeeId, int ppeId)
    {
        var entity = await _dbContext.EmployeePpes
            .FirstOrDefaultAsync(x => x.EmployeeId == employeeId && x.PpeId == ppeId);
        
        if (entity is null) return NotFound();

        _dbContext.EmployeePpes.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    // JobRole PPE requirements
    [HttpGet("job-role/{jobRoleId:int}")]
    public async Task<IActionResult> GetJobRolePpes(int jobRoleId)
    {
        var data = await _dbContext.JobRolePpes
            .AsNoTracking()
            .Where(x => x.JobRoleId == jobRoleId)
            .Include(x => x.Ppe)
            .OrderBy(x => x.Ppe!.Category)
            .ThenBy(x => x.Ppe!.Name)
            .Select(x => new
            {
                x.JobRoleId,
                x.PpeId,
                PpeName = x.Ppe!.Name,
                PpeCategory = x.Ppe.Category,
                PpeStandard = x.Ppe.Standard,
                PpeProtectionLevel = x.Ppe.ProtectionLevel,
                x.IsMandatory,
                x.Notes
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpPost("job-role")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> AddPpeToJobRole([FromBody] JobRolePpe request)
    {
        var jobRole = await _dbContext.JobRoles.FindAsync(request.JobRoleId);
        if (jobRole is null) return NotFound("Mansione non trovata");

        var ppe = await _dbContext.Ppes.FindAsync(request.PpeId);
        if (ppe is null) return NotFound("DPI non trovato");

        var exists = await _dbContext.JobRolePpes
            .AnyAsync(x => x.JobRoleId == request.JobRoleId && x.PpeId == request.PpeId);
        
        if (exists)
            return Conflict("Il DPI è già associato a questa mansione.");

        _dbContext.JobRolePpes.Add(request);
        await _dbContext.SaveChangesAsync();
        
        return Ok(request);
    }

    [HttpPut("job-role/{jobRoleId:int}/{ppeId:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> UpdateJobRolePpe(int jobRoleId, int ppeId, [FromBody] JobRolePpe request)
    {
        var entity = await _dbContext.JobRolePpes
            .FirstOrDefaultAsync(x => x.JobRoleId == jobRoleId && x.PpeId == ppeId);
        
        if (entity is null) return NotFound();

        entity.IsMandatory = request.IsMandatory;
        entity.Notes = request.Notes;

        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("job-role/{jobRoleId:int}/{ppeId:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> RemovePpeFromJobRole(int jobRoleId, int ppeId)
    {
        var entity = await _dbContext.JobRolePpes
            .FirstOrDefaultAsync(x => x.JobRoleId == jobRoleId && x.PpeId == ppeId);
        
        if (entity is null) return NotFound();

        _dbContext.JobRolePpes.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}

public class ReturnPpeRequest
{
    public DateTime? ReturnedDate { get; set; }
    public string? Notes { get; set; }
}