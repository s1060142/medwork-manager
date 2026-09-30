using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/intake")]
public class IntakeController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    // Fast in-memory cache for pending intakes submitted via QR code / waiting room kiosk
    private static readonly ConcurrentDictionary<string, IntakeSubmissionDto> _pendingIntakes = new(StringComparer.OrdinalIgnoreCase);

    public IntakeController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("worker-info")]
    [AllowAnonymous]
    public async Task<IActionResult> GetWorkerInfo([FromQuery] string? cf)
    {
        if (string.IsNullOrWhiteSpace(cf)) return BadRequest("CF required.");

        var cleanCf = cf.Trim().ToUpperInvariant();
        var employee = await _dbContext.Employees
            .Include(e => e.Company)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.TaxCode != null && e.TaxCode.ToUpper() == cleanCf);

        if (employee == null)
        {
            return Ok(new { found = false });
        }

        return Ok(new
        {
            found = true,
            id = employee.Id,
            name = $"{employee.FirstName} {employee.LastName}".Trim(),
            jobRole = employee.JobRole ?? "",
            companyName = employee.Company?.Name ?? ""
        });
    }

    [HttpPost("submit")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitIntake([FromBody] IntakeSubmissionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.TaxCode))
        {
            return BadRequest("Codice Fiscale obbligatorio.");
        }

        var cleanCf = dto.TaxCode.Trim().ToUpperInvariant();
        _pendingIntakes[cleanCf] = dto;

        // Try to link with upcoming unsigned visit in database if employee exists
        var employee = await _dbContext.Employees
            .FirstOrDefaultAsync(e => e.TaxCode != null && e.TaxCode.ToUpper() == cleanCf);

        if (employee != null)
        {
            var upcomingVisit = await _dbContext.MedicalVisits
                .Include(v => v.Anamnesis)
                .Where(v => v.EmployeeId == employee.Id && !v.IsSigned)
                .OrderByDescending(v => v.VisitDate)
                .FirstOrDefaultAsync();

            if (upcomingVisit != null)
            {
                if (upcomingVisit.Anamnesis == null)
                {
                    upcomingVisit.Anamnesis = new Anamnesis
                    {
                        TenantId = upcomingVisit.TenantId,
                        MedicalVisitId = upcomingVisit.Id
                    };
                    _dbContext.Anamneses.Add(upcomingVisit.Anamnesis);
                }

                if (!string.IsNullOrWhiteSpace(dto.LifestyleHabits))
                    upcomingVisit.Anamnesis.LifestyleHabits = dto.LifestyleHabits;
                if (!string.IsNullOrWhiteSpace(dto.RemotePathology))
                    upcomingVisit.Anamnesis.RemotePathology = dto.RemotePathology;
                if (!string.IsNullOrWhiteSpace(dto.RecentPathology))
                    upcomingVisit.Anamnesis.RecentPathology = dto.RecentPathology;
                if (!string.IsNullOrWhiteSpace(dto.OccupationalExposures))
                    upcomingVisit.Anamnesis.OccupationalExposures = dto.OccupationalExposures;

                upcomingVisit.Anamnesis.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
            }
        }

        return Ok(new { success = true, taxCode = cleanCf, timestamp = DateTime.UtcNow });
    }

    [HttpGet("latest")]
    [Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
    public async Task<IActionResult> GetLatestIntake([FromQuery] string? cf, [FromQuery] int? employeeId)
    {
        string? searchCf = cf?.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(searchCf) && employeeId.HasValue)
        {
            var emp = await _dbContext.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == employeeId.Value);
            if (emp != null && !string.IsNullOrWhiteSpace(emp.TaxCode))
            {
                searchCf = emp.TaxCode.Trim().ToUpperInvariant();
            }
        }

        if (string.IsNullOrWhiteSpace(searchCf))
        {
            return BadRequest("Specificare codice fiscale o ID lavoratore.");
        }

        if (_pendingIntakes.TryGetValue(searchCf, out var cachedDto))
        {
            return Ok(new { found = true, data = cachedDto, source = "mobile_intake" });
        }

        return Ok(new { found = false });
    }
}

public class IntakeSubmissionDto
{
    public string TaxCode { get; set; } = string.Empty;
    public string? JobRole { get; set; }
    public string? WorkerName { get; set; }
    public string? CompanyName { get; set; }
    public string? LifestyleHabits { get; set; }
    public string? RemotePathology { get; set; }
    public string? RecentPathology { get; set; }
    public string? OccupationalExposures { get; set; }
    public string? WorkHistory { get; set; }
    public string? SubmittedAt { get; set; }
    public object? RawAnswers { get; set; }
}
