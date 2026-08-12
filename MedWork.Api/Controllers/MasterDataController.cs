using MedWork.Api.Data;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/master-data")]
[Authorize]
public class MasterDataController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public MasterDataController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("companies")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetCompanies()
    {
        var data = await _dbContext.Companies
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.VATNumber,
                x.ContactEmail,
                x.ContactPhone,
                BranchesCount = x.Branches.Count,
                EmployeesCount = x.Employees.Count
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("branches")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetBranches()
    {
        var data = await _dbContext.Branches
            .AsNoTracking()
            .OrderBy(x => x.City)
            .Select(x => new
            {
                x.Id,
                x.CompanyId,
                CompanyName = x.Company.Name,
                x.Address,
                x.City,
                x.Province,
                x.PostalCode,
                EmployeesCount = x.Employees.Count
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("employees")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetEmployees()
    {
        var data = await _dbContext.Employees
            .AsNoTracking()
            .OrderBy(x => x.LastName)
            .ThenBy(x => x.FirstName)
            .Select(x => new
            {
                x.Id,
                x.CompanyId,
                CompanyName = x.Company.Name,
                x.BranchId,
                BranchAddress = x.Branch.Address,
                x.FirstName,
                x.LastName,
                x.TaxCode,
                x.JobRole,
                x.BirthDate,
                x.Gender,
                x.BirthCity,
                x.BirthCityCode,
                x.PersonalEmail,
                x.PhoneNumber,
                x.JobRoleId,
                JobRoleName = x.JobRoleNavigation != null ? x.JobRoleNavigation.Name : null,
                Risks = x.EmployeeRisks.Select(r => r.RiskFactor.Name).ToList()
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("doctors")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetDoctors()
    {
        var data = await _dbContext.Doctors
            .AsNoTracking()
            .OrderBy(x => x.LastName)
            .ThenBy(x => x.FirstName)
            .Select(x => new
            {
                x.Id,
                x.FirstName,
                x.LastName,
                x.MedicalLicenseNumber,
                x.Specialty,
                x.Email
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("company-doctors")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetCompanyDoctors([FromQuery] int companyId)
    {
        if (companyId <= 0) return BadRequest("companyId non valido.");

        var data = await _dbContext.CompanyDoctors
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId)
            .Select(x => new
            {
                x.DoctorId,
                x.IsCoordinator
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("risk-factors")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetRiskFactors()
    {
        var data = await _dbContext.RiskFactors
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                x.SeverityLevel,
                x.Allegato3BCategory,
                EmployeesCount = x.EmployeeRisks.Count
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("exam-types")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetExamTypes()
    {
        var data = await _dbContext.ExamTypes
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Category,
                UsageCount = x.VisitExams.Count
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("employee-risks")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetEmployeeRisks()
    {
        var data = await _dbContext.EmployeeRisks
            .AsNoTracking()
            .OrderBy(x => x.EmployeeId)
            .ThenBy(x => x.RiskFactorId)
            .Select(x => new
            {
                x.EmployeeId,
                EmployeeFullName = x.Employee.FirstName + " " + x.Employee.LastName,
                x.RiskFactorId,
                RiskFactorName = x.RiskFactor.Name
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("medical-records")]
    [Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
    public async Task<IActionResult> GetMedicalRecords()
    {
        var data = await _dbContext.MedicalRecords
            .AsNoTracking()
            .OrderBy(x => x.Employee.LastName)
            .ThenBy(x => x.Employee.FirstName)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                EmployeeFullName = x.Employee.FirstName + " " + x.Employee.LastName,
                x.MedicalHistory,
                x.Notes,
                x.CurrentTherapies,
                x.Status
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("medical-visits")]
    [Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
    public async Task<IActionResult> GetMedicalVisits()
    {
        var data = await _dbContext.MedicalVisits
            .AsNoTracking()
            .OrderByDescending(x => x.VisitDate)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                EmployeeFullName = x.Employee.FirstName + " " + x.Employee.LastName,
                x.DoctorId,
                DoctorFullName = x.Doctor.FirstName + " " + x.Doctor.LastName,
                x.VisitDate,
                x.NextDeadlineDate,
                x.Outcome,
                x.ClinicalNotes,
                x.VisitType,
                x.TargetOrgans,
                x.ObjectiveExam,
                ExamsCount = x.VisitExams.Count
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("visit-exams")]
    [Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
    public async Task<IActionResult> GetVisitExams()
    {
        var data = await _dbContext.VisitExams
            .AsNoTracking()
            .OrderBy(x => x.MedicalVisitId)
            .ThenBy(x => x.Id)
            .Select(x => new
            {
                x.Id,
                x.MedicalVisitId,
                x.ExamTypeId,
                ExamTypeName = x.ExamType.Name,
                x.Result,
                x.Notes,
                x.ReferenceRange
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("job-roles")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetJobRoles()
    {
        var data = await _dbContext.JobRoles
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                RiskFactorsCount = x.JobRoleRiskFactors.Count,
                ProtocolsCount = x.Protocols.Count
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("protocols")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetProtocols()
    {
        var data = await _dbContext.Protocols
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.LawReference,
                x.CadenceDays,
                x.Objective,
                x.JobRoleId,
                JobRoleName = x.JobRole != null ? x.JobRole.Name : null,
                PersonalOverrides = x.PersonalProtocols.Count
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("personal-protocols")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetPersonalProtocols()
    {
        var data = await _dbContext.PersonalProtocols
            .AsNoTracking()
            .OrderByDescending(x => x.AssignedAt)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                EmployeeFullName = x.Employee!.FirstName + " " + x.Employee.LastName,
                x.ProtocolId,
                ProtocolName = x.Protocol!.Name,
                x.AssignedAt,
                x.IsOverride,
                x.Notes
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("anamneses")]
    [Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
    public async Task<IActionResult> GetAnamneses()
    {
        var data = await _dbContext.Anamneses
            .AsNoTracking()
            .OrderByDescending(x => x.Id)
            .Select(x => new
            {
                x.Id,
                x.MedicalVisitId,
                EmployeeFullName = x.MedicalVisit!.Employee!.FirstName + " " + x.MedicalVisit.Employee.LastName,
                x.WorkHistory,
                x.PersonalHistory,
                x.FamilyHistory,
                x.RemotePathology,
                x.RecentPathology
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("scheduled-exams")]
    [Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
    public async Task<IActionResult> GetScheduledExams()
    {
        var data = await _dbContext.ScheduledExams
            .AsNoTracking()
            .OrderBy(x => x.DueDate)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                EmployeeFullName = x.Employee!.FirstName + " " + x.Employee.LastName,
                x.ExamTypeId,
                ExamTypeName = x.ExamType!.Name,
                x.DueDate,
                x.Status
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("vaccinations")]
    [Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
    public async Task<IActionResult> GetVaccinations()
    {
        var data = await _dbContext.Vaccinations
            .AsNoTracking()
            .OrderByDescending(x => x.DateAdministered)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                EmployeeFullName = x.Employee!.FirstName + " " + x.Employee.LastName,
                x.VaccineName,
                x.DateAdministered,
                x.NextDueDate
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("notification-logs")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetNotificationLogs()
    {
        var data = await _dbContext.NotificationLogs
            .AsNoTracking()
            .OrderByDescending(x => x.SentDate)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                EmployeeFullName = x.Employee!.FirstName + " " + x.Employee.LastName,
                x.Channel,
                x.SentDate,
                x.MessageText
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("doctor-availabilities")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetDoctorAvailabilities()
    {
        var data = await _dbContext.DoctorAvailabilities
            .AsNoTracking()
            .OrderBy(x => x.Doctor!.LastName)
            .ThenBy(x => x.Doctor!.FirstName)
            .ThenBy(x => x.DayOfWeek)
            .ThenBy(x => x.StartTime)
            .Select(x => new
            {
                x.Id,
                x.DoctorId,
                DoctorFullName = x.Doctor!.FirstName + " " + x.Doctor.LastName,
                x.DayOfWeek,
                x.StartTime,
                x.EndTime
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("company-groups")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetCompanyGroups()
    {
        var data = await _dbContext.CompanyGroups
            .AsNoTracking()
            .OrderBy(x => x.LegalName)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.LegalName,
                x.Address,
                x.City,
                x.PostalCode,
                x.Province,
                x.VATNumber,
                x.TaxCode,
                x.SingleArchive
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("company-contacts")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetCompanyContacts()
    {
        var data = await _dbContext.CompanyContacts
            .AsNoTracking()
            .OrderBy(x => x.CompanyId)
            .ThenBy(x => x.Role)
            .Select(x => new
            {
                x.Id,
                x.CompanyId,
                CompanyName = x.Company!.Name,
                x.Role,
                x.FullName,
                x.Email,
                x.Phone
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("departments")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetDepartments()
    {
        var data = await _dbContext.Departments
            .AsNoTracking()
            .OrderBy(x => x.CompanyId)
            .ThenBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.CompanyId,
                CompanyName = x.Company!.Name,
                x.Name,
                x.Manager,
                x.ManagerEmail,
                x.IsActive
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("work-locations")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetWorkLocations()
    {
        var data = await _dbContext.WorkLocations
            .AsNoTracking()
            .OrderBy(x => x.CompanyId)
            .ThenBy(x => x.Notes)
            .Select(x => new
            {
                x.Id,
                x.CompanyId,
                CompanyName = x.Company!.Name,
                x.Notes,
                x.City,
                x.PostalCode,
                x.Province,
                x.IsActive
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("site-visits")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetSiteVisits()
    {
        var data = await _dbContext.SiteVisits
            .AsNoTracking()
            .OrderByDescending(x => x.VisitDate)
            .Select(x => new
            {
                x.Id,
                x.CompanyId,
                CompanyName = x.Company!.Name,
                x.VisitedStructure,
                x.Location,
                x.DoctorName,
                x.VisitDate,
                x.Frequency,
                x.NextDueDate
            })
            .ToListAsync();

        return Ok(data);
    }
}
