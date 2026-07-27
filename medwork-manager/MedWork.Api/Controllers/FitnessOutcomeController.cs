using MedWork.Api.Data;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

/// <summary>
/// Espone SOLO l'esito di idoneità dei lavoratori, SENZA alcun dettaglio clinico.
/// Accessibile a tutti i ruoli autenticati (incluso il Datore di lavoro), in conformità
/// al D.Lgs 81/08: il datore di lavoro può conoscere l'idoneità alla mansione ma non
/// i dati sanitari (categoria particolare, GDPR art. 9).
/// </summary>
[ApiController]
[Route("api/fitness-outcomes")]
[Authorize(Policy = Policies.CanViewFitnessOutcomeOnly)]
public class FitnessOutcomeController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public FitnessOutcomeController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetOutcomes([FromQuery] int? companyId)
    {
        var query = _dbContext.Employees.AsNoTracking().AsQueryable();
        if (companyId.HasValue)
            query = query.Where(x => x.CompanyId == companyId.Value);

        var data = await query
            .OrderBy(x => x.LastName).ThenBy(x => x.FirstName)
            .Select(x => new
            {
                EmployeeId = x.Id,
                FullName = x.FirstName + " " + x.LastName,
                TaxCode = x.TaxCode,
                JobRole = x.JobRole,
                CompanyName = x.Company != null ? x.Company.Name : null,
                // Ultimo esito di idoneità (solo esito, nessun dato clinico)
                LastOutcome = x.MedicalVisits
                    .OrderByDescending(v => v.VisitDate)
                    .Select(v => v.Outcome)
                    .FirstOrDefault(),
                NextDeadline = x.MedicalVisits
                    .OrderByDescending(v => v.VisitDate)
                    .Select(v => v.NextDeadlineDate)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(data);
    }
}
