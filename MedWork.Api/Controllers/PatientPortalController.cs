using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/patient-portal")]
[Authorize(Roles = "Patient")]
public class PatientPortalController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public PatientPortalController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private int GetEmployeeId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(idClaim, out int employeeId))
        {
            return employeeId;
        }
        throw new UnauthorizedAccessException("Employee ID non valido nel token.");
    }

    private int GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value;
        if (int.TryParse(tenantClaim, out int tenantId))
        {
            return tenantId;
        }
        throw new UnauthorizedAccessException("Tenant ID non valido nel token.");
    }

    [HttpGet("anamnesis")]
    public async Task<IActionResult> GetAnamnesis()
    {
        var employeeId = GetEmployeeId();
        var tenantId = GetTenantId();

        // Trova la prossima visita in programma
        var upcomingVisit = await _dbContext.MedicalVisits
            .Include(v => v.Anamnesis)
            .Where(v => v.TenantId == tenantId && v.EmployeeId == employeeId && !v.IsSigned)
            .OrderBy(v => v.VisitDate)
            .FirstOrDefaultAsync();

        if (upcomingVisit == null)
        {
            return NotFound(new { message = "Nessuna visita programmata trovata." });
        }

        if (upcomingVisit.Anamnesis == null)
        {
            return Ok(new AnamnesisDto(upcomingVisit.Id, "", "", "", "", "", "", ""));
        }

        var a = upcomingVisit.Anamnesis;
        return Ok(new AnamnesisDto(
            upcomingVisit.Id,
            a.WorkHistory ?? "",
            a.PersonalHistory ?? "",
            a.FamilyHistory ?? "",
            a.RemotePathology ?? "",
            a.RecentPathology ?? "",
            a.LifestyleHabits ?? "",
            a.OccupationalExposures ?? ""
        ));
    }

    [HttpPost("anamnesis")]
    public async Task<IActionResult> SaveAnamnesis([FromBody] AnamnesisDto dto)
    {
        var employeeId = GetEmployeeId();
        var tenantId = GetTenantId();

        // Verifica che la visita appartenga al lavoratore
        var visit = await _dbContext.MedicalVisits
            .Include(v => v.Anamnesis)
            .FirstOrDefaultAsync(v => v.Id == dto.VisitId && v.EmployeeId == employeeId && v.TenantId == tenantId);

        if (visit == null) return NotFound("Visita non trovata o non autorizzata.");

        if (visit.Anamnesis == null)
        {
            visit.Anamnesis = new Anamnesis { TenantId = tenantId, MedicalVisitId = visit.Id };
            _dbContext.Anamneses.Add(visit.Anamnesis);
        }

        visit.Anamnesis.WorkHistory = dto.WorkHistory;
        visit.Anamnesis.PersonalHistory = dto.PersonalHistory;
        visit.Anamnesis.FamilyHistory = dto.FamilyHistory;
        visit.Anamnesis.RemotePathology = dto.RemotePathology;
        visit.Anamnesis.RecentPathology = dto.RecentPathology;
        visit.Anamnesis.LifestyleHabits = dto.LifestyleHabits;
        visit.Anamnesis.OccupationalExposures = dto.OccupationalExposures;
        visit.Anamnesis.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return Ok(new { success = true });
    }
}

public record AnamnesisDto(
    int VisitId,
    string WorkHistory,
    string PersonalHistory,
    string FamilyHistory,
    string RemotePathology,
    string RecentPathology,
    string LifestyleHabits,
    string OccupationalExposures
);
