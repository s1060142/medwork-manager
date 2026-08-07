using MedWork.Api.Data;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/medical-records")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class MedicalRecordsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public MedicalRecordsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("employee/{employeeId:int}")]
    public async Task<IActionResult> GetByEmployee(int employeeId)
    {
        var record = await _dbContext.MedicalRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.EmployeeId == employeeId);

        if (record is null)
        {
            return NotFound();
        }

        return Ok(record);
    }
}
