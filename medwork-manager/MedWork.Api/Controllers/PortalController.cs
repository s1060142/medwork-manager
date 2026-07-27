using System.Security.Claims;
using MedWork.Api.Data;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

/// <summary>
/// Espone i dati della Sorveglianza Sanitaria in modalità "portale",
/// ispirandosi ai portali di Cartsan (Portale Lavoratori e Portale Aziende).
/// Ogni lavoratore vede solo la propria cartella; ogni azienda vede i propri lavoratori.
/// </summary>
[ApiController]
[Route("api/portal")]
[Authorize]
public class PortalController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public PortalController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private int? GetEmployeeIdClaim()
    {
        var raw = User.FindFirst("employeeId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(raw, out var id))
            return id;
        return null;
    }

    private int? GetCompanyIdClaim()
    {
        var raw = User.FindFirst("companyId")?.Value;
        if (int.TryParse(raw, out var id))
            return id;
        return null;
    }

    // ---- PORTALE LAVORATORI ----
    [HttpGet("worker/dashboard")]
    [Authorize(Roles = AppRole.Worker)]
    public async Task<IActionResult> GetWorkerDashboard()
    {
        var employeeId = GetEmployeeIdClaim();
        if (employeeId is null)
            return Forbid();

        return Ok(await BuildWorkerDashboardAsync(employeeId.Value));
    }

    // ---- PORTALE AZIENDE ----
    [HttpGet("company/dashboard")]
    [Authorize(Roles = AppRole.Employer + "," + AppRole.Rspp)]
    public async Task<IActionResult> GetCompanyDashboard()
    {
        var companyId = GetCompanyIdClaim();
        if (companyId is null)
            return Forbid();

        return Ok(await BuildCompanyDashboardAsync(companyId.Value));
    }

    [HttpGet("company/workers")]
    [Authorize(Roles = AppRole.Employer + "," + AppRole.Rspp)]
    public async Task<IActionResult> GetCompanyWorkers()
    {
        var companyId = GetCompanyIdClaim();
        if (companyId is null)
            return Forbid();

        var workers = await _dbContext.Employees
            .AsNoTracking()
            .Where(e => e.CompanyId == companyId.Value)
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .Select(e => new
            {
                e.Id,
                e.FirstName,
                e.LastName,
                e.TaxCode,
                e.JobRole,
                LastVisit = e.MedicalVisits.OrderByDescending(v => v.VisitDate).Select(v => v.VisitDate).FirstOrDefault(),
                NextDeadline = e.MedicalVisits.OrderByDescending(v => v.NextDeadlineDate).Select(v => v.NextDeadlineDate).FirstOrDefault(),
                LastOutcome = e.MedicalVisits.OrderByDescending(v => v.VisitDate).Select(v => v.Outcome).FirstOrDefault()
            })
            .ToListAsync();

        return Ok(workers);
    }

    // ---- ALLEGATO 3B (dati aggregati sanitari e di rischio) ----
    [HttpGet("company/allegato-3b")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Employer + "," + AppRole.Rspp)]
    public async Task<IActionResult> GetAllegato3B([FromQuery] int? companyId, [FromQuery] int? year)
    {
        var targetCompanyId = companyId ?? GetCompanyIdClaim();
        if (targetCompanyId is null)
            return BadRequest("CompanyId richiesto.");

        var refYear = year ?? DateTime.UtcNow.Year;

        var employees = _dbContext.Employees.AsNoTracking().Where(e => e.CompanyId == targetCompanyId.Value);

        var totalWorkers = await employees.CountAsync();

        // Esiti idoneità (ultima visita per lavoratore)
        var lastVisits = await employees
            .Select(e => e.MedicalVisits.OrderByDescending(v => v.VisitDate).FirstOrDefault())
            .Where(v => v != null)
            .ToListAsync();

        var fitness = new Dictionary<string, int>
        {
            ["Idoneo"] = 0,
            ["Idoneo con prescrizioni"] = 0,
            ["Non idoneo"] = 0,
            ["Da classificare"] = 0
        };

        foreach (var v in lastVisits)
        {
            var outcome = (v!.Outcome ?? "").ToLowerInvariant();
            if (outcome.Contains("non idone")) fitness["Non idoneo"]++;
            else if (outcome.Contains("prescr") || outcome.Contains("limit") || outcome.Contains("parzial")) fitness["Idoneo con prescrizioni"]++;
            else if (outcome.Contains("idone")) fitness["Idoneo"]++;
            else fitness["Da classificare"]++;
        }

        // Visite per tipo
        var visitsByType = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Where(v => v.Employee != null && v.Employee.CompanyId == targetCompanyId.Value && v.VisitDate.Year == refYear)
            .GroupBy(v => v.VisitType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync();

        // Esposizione a fattori di rischio (categorie Allegato 3B)
        var riskCategories = await _dbContext.EmployeeRisks
            .AsNoTracking()
            .Where(r => r.Employee != null && r.Employee.CompanyId == targetCompanyId.Value && r.RiskFactor != null)
            .GroupBy(r => r.RiskFactor!.Allegato3BCategory ?? "Non classificato")
            .Select(g => new { Category = g.Key, ExposedWorkers = g.Select(r => r.EmployeeId).Distinct().Count() })
            .OrderByDescending(g => g.ExposedWorkers)
            .ToListAsync();

        var expiringVisits = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Where(v => v.Employee != null && v.Employee.CompanyId == targetCompanyId.Value && v.NextDeadlineDate < DateTime.UtcNow.AddMonths(3))
            .Select(v => new
            {
                Employee = v.Employee!.LastName + " " + v.Employee.FirstName,
                v.NextDeadlineDate,
                v.VisitType
            })
            .OrderBy(v => v.NextDeadlineDate)
            .Take(20)
            .ToListAsync();

        var company = await _dbContext.Companies.AsNoTracking()
            .Where(c => c.Id == targetCompanyId.Value)
            .Select(c => new { c.Name, c.VATNumber })
            .FirstOrDefaultAsync();

        return Ok(new
        {
            Company = company,
            ReferenceYear = refYear,
            GeneratedAt = DateTime.UtcNow,
            TotalWorkers = totalWorkers,
            FitnessDistribution = fitness,
            VisitsByType = visitsByType,
            RiskExposureCategories = riskCategories,
            ExpiringVisits = expiringVisits,
            Legend = "Allegato 3B - Informazioni relative ai dati aggregati sanitari e di rischio dei lavoratori (D.Lgs. 81/08, DM 12 luglio 2016)."
        });
    }

    private async Task<object> BuildWorkerDashboardAsync(int employeeId)
    {
        var employee = await _dbContext.Employees.AsNoTracking()
            .Include(e => e.Company)
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee is null)
            return new { error = "Lavoratore non trovato" };

        var visits = await _dbContext.MedicalVisits.AsNoTracking()
            .Where(v => v.EmployeeId == employeeId)
            .OrderByDescending(v => v.VisitDate)
            .Select(v => new
            {
                v.Id,
                v.VisitDate,
                v.NextDeadlineDate,
                v.VisitType,
                v.Outcome,
                v.TargetOrgans,
                v.ClinicalNotes
            })
            .ToListAsync();

        var exams = await _dbContext.VisitExams.AsNoTracking()
            .Where(x => x.MedicalVisit != null && x.MedicalVisit.EmployeeId == employeeId)
            .OrderByDescending(x => x.Id)
            .Select(x => new { x.Id, x.Result, x.Notes, VisitId = x.MedicalVisitId })
            .Take(30)
            .ToListAsync();

        var vaccinations = await _dbContext.Vaccinations.AsNoTracking()
            .Where(v => v.EmployeeId == employeeId)
            .OrderByDescending(v => v.DateAdministered)
            .Select(v => new { v.Id, v.VaccineName, v.DateAdministered, v.NextDueDate })
            .ToListAsync();

        var record = await _dbContext.MedicalRecords.AsNoTracking()
            .Where(r => r.EmployeeId == employeeId)
            .Select(r => new { r.MedicalHistory, r.CurrentTherapies, r.Notes })
            .FirstOrDefaultAsync();

        return new
        {
            Worker = new
            {
                employee.Id,
                employee.FirstName,
                employee.LastName,
                employee.TaxCode,
                employee.JobRole,
                employee.BirthDate,
                CompanyName = employee.Company?.Name
            },
            MedicalRecord = record,
            Visits = visits,
            LastVisit = visits.FirstOrDefault(),
            Exams = exams,
            Vaccinations = vaccinations
        };
    }

    private async Task<object> BuildCompanyDashboardAsync(int companyId)
    {
        var company = await _dbContext.Companies.AsNoTracking()
            .Where(c => c.Id == companyId)
            .Select(c => new { c.Id, c.Name, c.VATNumber })
            .FirstOrDefaultAsync();

        var totalWorkers = await _dbContext.Employees.AsNoTracking()
            .CountAsync(e => e.CompanyId == companyId);

        var expiringSoon = await _dbContext.MedicalVisits.AsNoTracking()
            .Where(v => v.Employee != null && v.Employee.CompanyId == companyId && v.NextDeadlineDate < DateTime.UtcNow.AddMonths(3))
            .OrderBy(v => v.NextDeadlineDate)
            .Select(v => new
            {
                Employee = v.Employee!.LastName + " " + v.Employee.FirstName,
                v.NextDeadlineDate,
                v.VisitType
            })
            .Take(15)
            .ToListAsync();

        var overdue = await _dbContext.MedicalVisits.AsNoTracking()
            .Where(v => v.Employee != null && v.Employee.CompanyId == companyId && v.NextDeadlineDate < DateTime.UtcNow)
            .CountAsync();

        return new
        {
            Company = company,
            TotalWorkers = totalWorkers,
            OverdueVisits = overdue,
            ExpiringSoon = expiringSoon
        };
    }
}
