using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/admin-data")]
[Authorize(Roles = AppRole.Admin)]
public class AdminCrudController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IPersonalProtocolAssignmentService _personalProtocolAssignmentService;

    public AdminCrudController(AppDbContext dbContext, IPersonalProtocolAssignmentService personalProtocolAssignmentService)
    {
        _dbContext = dbContext;
        _personalProtocolAssignmentService = personalProtocolAssignmentService;
    }

    [HttpGet("companies")]
    public async Task<IActionResult> GetCompanies()
    {
        var tenantId = GetTenantId();
        var data = await _dbContext.Companies
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.VATNumber,
                x.ContactEmail,
                x.ContactPhone
            })
            .ToListAsync();
        return Ok(data);
    }

    [HttpPost("companies")]
    public async Task<IActionResult> CreateCompany([FromBody] Company request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.VATNumber))
            {
                request.VATNumber = null;
            }

            _dbContext.Companies.Add(request);
            await _dbContext.SaveChangesAsync();
            return Ok(request);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return Conflict("Esiste gia un'azienda con la stessa Partita IVA.");
        }
    }

    [HttpPut("companies/{id:int}")]
    public async Task<IActionResult> UpdateCompany(int id, [FromBody] Company request)
    {
        try
        {
            var tenantId = GetTenantId();
        var entity = await _dbContext.Companies.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
            if (entity is null) return NotFound();

            entity.Name = request.Name;

            var incomingVat = string.IsNullOrWhiteSpace(request.VATNumber) ? null : request.VATNumber;
            if (incomingVat != entity.VATNumber)
            {
                // Only reassign when the value actually changed. Setting the same
                // value would issue an UPDATE that trips the unique index against
                // the very same row.
                entity.VATNumber = incomingVat;
            }

            entity.ContactEmail = request.ContactEmail;
            entity.ContactPhone = request.ContactPhone;
            await _dbContext.SaveChangesAsync();
            return Ok(entity);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return Conflict("Esiste gia un'azienda con la stessa Partita IVA.");
        }
    }

    public class CompanyDoctorAssignmentRequest
    {
        public int CompanyId { get; set; }
        public List<int> DoctorIds { get; set; } = new();
        public int? CoordinatorDoctorId { get; set; }
    }

    [HttpPut("company-doctors")]
    public async Task<IActionResult> UpdateCompanyDoctors([FromBody] CompanyDoctorAssignmentRequest request)
    {
        if (request.CompanyId <= 0) return BadRequest("CompanyId non valido.");

        var tenantId = GetTenantId();
        var companyExists = await _dbContext.Companies.AnyAsync(x => x.Id == request.CompanyId && x.TenantId == tenantId);
        if (!companyExists) return NotFound("Azienda non trovata.");

        var doctorIds = request.DoctorIds.Distinct().ToList();
        var coordinatorId = request.CoordinatorDoctorId;

        if (coordinatorId.HasValue && !doctorIds.Contains(coordinatorId.Value))
        {
            doctorIds.Add(coordinatorId.Value);
        }

        var validDoctorIds = await _dbContext.Doctors
            .Where(x => doctorIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync();

        var existing = _dbContext.CompanyDoctors.Where(x => x.CompanyId == request.CompanyId);
        _dbContext.CompanyDoctors.RemoveRange(existing);

        foreach (var doctorId in validDoctorIds)
        {
            _dbContext.CompanyDoctors.Add(new CompanyDoctor
            {
                CompanyId = request.CompanyId,
                DoctorId = doctorId,
                IsCoordinator = coordinatorId.HasValue && coordinatorId.Value == doctorId,
                TenantId = tenantId
            });
        }

        await _dbContext.SaveChangesAsync();
        return Ok(new { companyId = request.CompanyId, assigned = validDoctorIds.Count });
    }

    [HttpDelete("companies/{id:int}")]
    public async Task<IActionResult> DeleteCompany(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Companies.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.Companies.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("branches")]
    public async Task<IActionResult> CreateBranch([FromBody] Branch request)
    {
        _dbContext.Branches.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("branches/{id:int}")]
    public async Task<IActionResult> UpdateBranch(int id, [FromBody] Branch request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Branches.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.CompanyId = request.CompanyId;
        entity.Address = request.Address;
        entity.City = request.City;
        entity.Province = request.Province;
        entity.PostalCode = request.PostalCode;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("branches/{id:int}")]
    public async Task<IActionResult> DeleteBranch(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Branches.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.Branches.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees()
    {
        var tenantId = GetTenantId();
        var data = await _dbContext.Employees
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.LastName)
            .Select(x => new
            {
                x.Id,
                x.FirstName,
                x.LastName,
                x.TaxCode,
                x.JobRole,
                x.CompanyId,
                x.BranchId
            })
            .ToListAsync();
        return Ok(data);
    }

    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee([FromBody] Employee request)
    {
        try
        {
            _dbContext.Employees.Add(request);
            await _dbContext.SaveChangesAsync();

            await _personalProtocolAssignmentService.AssignDefaultsForEmployeeAsync(request.Id);

            return Ok(request);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return Conflict("Esiste gia un lavoratore con lo stesso codice fiscale.");
        }
    }

    [HttpPut("employees/{id:int}")]
    public async Task<IActionResult> UpdateEmployee(int id, [FromBody] Employee request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Employees.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.CompanyId = request.CompanyId;
        entity.BranchId = request.BranchId;
        entity.FirstName = request.FirstName;
        entity.LastName = request.LastName;
        entity.TaxCode = request.TaxCode;
        entity.JobRole = request.JobRole;
        entity.BirthDate = request.BirthDate;
        entity.Gender = request.Gender;
        entity.BirthCity = request.BirthCity;
        entity.BirthCityCode = request.BirthCityCode;
        entity.PersonalEmail = request.PersonalEmail;
        entity.PhoneNumber = request.PhoneNumber;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("employees/{id:int}")]
    public async Task<IActionResult> DeleteEmployee(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Employees.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.Employees.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("employees/{id:int}/archive")]
    public async Task<IActionResult> ToggleEmployeeArchive(int id, [FromBody] ToggleArchiveRequest request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Employees.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.IsArchived = request.IsArchived;
        await _dbContext.SaveChangesAsync();
        return Ok(new { entity.Id, entity.IsArchived });
    }

    public class ToggleArchiveRequest
    {
        public bool IsArchived { get; set; }
    }

    [HttpPost("risk-factors")]
    public async Task<IActionResult> CreateRiskFactor([FromBody] RiskFactor request)
    {
        _dbContext.RiskFactors.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("risk-factors/{id:int}")]
    public async Task<IActionResult> UpdateRiskFactor(int id, [FromBody] RiskFactor request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.RiskFactors.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.Name = request.Name;
        entity.Description = request.Description;
        entity.SeverityLevel = request.SeverityLevel;
        entity.Allegato3BCategory = request.Allegato3BCategory;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("risk-factors/{id:int}")]
    public async Task<IActionResult> DeleteRiskFactor(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.RiskFactors.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.RiskFactors.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("exam-types")]
    public async Task<IActionResult> CreateExamType([FromBody] ExamType request)
    {
        _dbContext.ExamTypes.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("exam-types/{id:int}")]
    public async Task<IActionResult> UpdateExamType(int id, [FromBody] ExamType request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.ExamTypes.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.Name = request.Name;
        entity.Category = request.Category;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("exam-types/{id:int}")]
    public async Task<IActionResult> DeleteExamType(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.ExamTypes.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.ExamTypes.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("employee-risks")]
    public async Task<IActionResult> CreateEmployeeRisk([FromBody] EmployeeRisk request)
    {
        var tenantId = GetTenantId();
        var exists = await _dbContext.EmployeeRisks
            .AnyAsync(x => x.EmployeeId == request.EmployeeId && x.RiskFactorId == request.RiskFactorId && x.TenantId == tenantId);

        if (exists)
        {
            return Conflict("EmployeeRisk already exists.");
        }

        request.TenantId = tenantId;
        _dbContext.EmployeeRisks.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("employee-risks")]
    public async Task<IActionResult> UpdateEmployeeRisk(
        [FromQuery] int employeeId,
        [FromQuery] int riskFactorId,
        [FromBody] EmployeeRisk request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.EmployeeRisks
            .FirstOrDefaultAsync(x => x.EmployeeId == employeeId && x.RiskFactorId == riskFactorId && x.TenantId == tenantId);

        if (entity is null) return NotFound();

        var targetExists = await _dbContext.EmployeeRisks
            .AnyAsync(x => x.EmployeeId == request.EmployeeId && x.RiskFactorId == request.RiskFactorId && x.TenantId == tenantId);

        if (targetExists && (request.EmployeeId != employeeId || request.RiskFactorId != riskFactorId))
        {
            return Conflict("Target EmployeeRisk already exists.");
        }

        _dbContext.EmployeeRisks.Remove(entity);
        _dbContext.EmployeeRisks.Add(new EmployeeRisk
        {
            EmployeeId = request.EmployeeId,
            RiskFactorId = request.RiskFactorId,
            TenantId = tenantId
        });

        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpDelete("employee-risks")]
    public async Task<IActionResult> DeleteEmployeeRisk([FromQuery] int employeeId, [FromQuery] int riskFactorId)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.EmployeeRisks
            .FirstOrDefaultAsync(x => x.EmployeeId == employeeId && x.RiskFactorId == riskFactorId && x.TenantId == tenantId);

        if (entity is null) return NotFound();

        _dbContext.EmployeeRisks.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("job-roles")]
    public async Task<IActionResult> CreateJobRole([FromBody] JobRole request)
    {
        try
        {
            _dbContext.JobRoles.Add(request);
            await _dbContext.SaveChangesAsync();
            return Ok(request);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return Conflict("Esiste gia una mansione con lo stesso nome.");
        }
    }

    [HttpPut("job-roles/{id:int}")]
    public async Task<IActionResult> UpdateJobRole(int id, [FromBody] JobRole request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.JobRoles.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.Name = request.Name;
        entity.Description = request.Description;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("job-roles/{id:int}")]
    public async Task<IActionResult> DeleteJobRole(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.JobRoles.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.JobRoles.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("protocols")]
    public async Task<IActionResult> CreateProtocol([FromBody] Protocol request)
    {
        _dbContext.Protocols.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("protocols/{id:int}")]
    public async Task<IActionResult> UpdateProtocol(int id, [FromBody] Protocol request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Protocols.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.Name = request.Name;
        entity.LawReference = request.LawReference;
        entity.CadenceDays = request.CadenceDays;
        entity.Objective = request.Objective;
        entity.JobRoleId = request.JobRoleId;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("protocols/{id:int}")]
    public async Task<IActionResult> DeleteProtocol(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Protocols.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.Protocols.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("personal-protocols")]
    public async Task<IActionResult> CreatePersonalProtocol([FromBody] PersonalProtocol request)
    {
        var exists = await _dbContext.PersonalProtocols
            .AnyAsync(x => x.EmployeeId == request.EmployeeId && x.ProtocolId == request.ProtocolId);

        if (exists)
        {
            return Conflict("PersonalProtocol already exists for employee and protocol.");
        }

        _dbContext.PersonalProtocols.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("personal-protocols/{id:int}")]
    public async Task<IActionResult> UpdatePersonalProtocol(int id, [FromBody] PersonalProtocol request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.PersonalProtocols.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.EmployeeId = request.EmployeeId;
        entity.ProtocolId = request.ProtocolId;
        entity.AssignedAt = request.AssignedAt;
        entity.IsOverride = request.IsOverride;
        entity.Notes = request.Notes;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("personal-protocols/{id:int}")]
    public async Task<IActionResult> DeletePersonalProtocol(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.PersonalProtocols.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.PersonalProtocols.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("company-groups")]
    public async Task<IActionResult> CreateCompanyGroup([FromBody] CompanyGroup request)
    {
        _dbContext.CompanyGroups.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("company-groups/{id:int}")]
    public async Task<IActionResult> UpdateCompanyGroup(int id, [FromBody] CompanyGroup request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.CompanyGroups.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.LegalName = request.LegalName;
        entity.Address = request.Address;
        entity.City = request.City;
        entity.PostalCode = request.PostalCode;
        entity.Province = request.Province;
        entity.VATNumber = request.VATNumber;
        entity.TaxCode = request.TaxCode;
        entity.SingleArchive = request.SingleArchive;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("company-groups/{id:int}")]
    public async Task<IActionResult> DeleteCompanyGroup(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.CompanyGroups.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.CompanyGroups.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("company-contacts")]
    public async Task<IActionResult> CreateCompanyContact([FromBody] CompanyContact request)
    {
        _dbContext.CompanyContacts.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("company-contacts/{id:int}")]
    public async Task<IActionResult> UpdateCompanyContact(int id, [FromBody] CompanyContact request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.CompanyContacts.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.CompanyId = request.CompanyId;
        entity.Role = request.Role;
        entity.FullName = request.FullName;
        entity.Email = request.Email;
        entity.Phone = request.Phone;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("company-contacts/{id:int}")]
    public async Task<IActionResult> DeleteCompanyContact(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.CompanyContacts.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.CompanyContacts.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("departments")]
    public async Task<IActionResult> CreateDepartment([FromBody] Department request)
    {
        _dbContext.Departments.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("departments/{id:int}")]
    public async Task<IActionResult> UpdateDepartment(int id, [FromBody] Department request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Departments.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.CompanyId = request.CompanyId;
        entity.Name = request.Name;
        entity.Manager = request.Manager;
        entity.ManagerEmail = request.ManagerEmail;
        entity.IsActive = request.IsActive;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("departments/{id:int}")]
    public async Task<IActionResult> DeleteDepartment(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Departments.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.Departments.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("work-locations")]
    public async Task<IActionResult> CreateWorkLocation([FromBody] WorkLocation request)
    {
        _dbContext.WorkLocations.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("work-locations/{id:int}")]
    public async Task<IActionResult> UpdateWorkLocation(int id, [FromBody] WorkLocation request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.WorkLocations.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.CompanyId = request.CompanyId;
        entity.Notes = request.Notes;
        entity.City = request.City;
        entity.PostalCode = request.PostalCode;
        entity.Province = request.Province;
        entity.IsActive = request.IsActive;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("work-locations/{id:int}")]
    public async Task<IActionResult> DeleteWorkLocation(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.WorkLocations.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.WorkLocations.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("site-visits")]
    public async Task<IActionResult> CreateSiteVisit([FromBody] SiteVisit request)
    {
        _dbContext.SiteVisits.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("site-visits/{id:int}")]
    public async Task<IActionResult> UpdateSiteVisit(int id, [FromBody] SiteVisit request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.SiteVisits.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.CompanyId = request.CompanyId;
        entity.VisitedStructure = request.VisitedStructure;
        entity.Location = request.Location;
        entity.DoctorName = request.DoctorName;
        entity.VisitDate = request.VisitDate;
        entity.Frequency = request.Frequency;
        entity.NextDueDate = request.NextDueDate;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("site-visits/{id:int}")]
    public async Task<IActionResult> DeleteSiteVisit(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.SiteVisits.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.SiteVisits.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException exception)
    {
        return exception.InnerException is SqlException { Number: 2601 or 2627 };
    }

    private int GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value;
        if (int.TryParse(tenantClaim, out var tenantId) && tenantId > 0)
            return tenantId;
        throw new UnauthorizedAccessException("Tenant non specificato");
    }
}