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
        var tenantId = GetTenantId();
        var data = await _dbContext.Companies
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.TenantId,
                x.Name,
                x.LegalName,
                x.VATNumber,
                x.TaxCode,
                x.ATECOCode,
                x.ContactEmail,
                x.ContactPhone,
                x.PEC,
                x.Fax,
                x.LegalAddress,
                x.OperationalAddress,
                x.LegalRepresentative,
                x.RSPP,
                x.RLS,
                x.RiskClass,
                x.INAILPosition,
                x.INAILPolicyNumber,
                x.IsActive,
                x.Activity,
                x.OperationalUnitName,
                x.Type,
                x.Reference,
                x.Status,
                x.REANumber,
                x.CreatedAt,
                x.UpdatedAt,
                x.OperationalCity,
                x.OperationalPostalCode,
                x.OperationalProvince,
                x.LegalCity,
                x.LegalPostalCode,
                x.LegalProvince,
                x.Country,
                x.DocumentStorageLocation,
                x.UsualVisitLocation,
                x.Clinic,
                x.CommunicationsEmail,
                x.BillingEmail,
                x.InternalContactName,
                x.InternalContactEmail,
                x.ExternalCode,
                x.Notes,
                x.RecipientCode,
                x.ContractIdentifier,
                x.OrderCode,
                x.CUPCode,
                x.CIGCode,
                x.PaymentTerms,
                x.PaymentMethod,
                x.AccountHolder,
                x.BankName,
                x.IBAN,
                x.BICSwift,
                x.ABI,
                x.CAB,
                x.IntentLetterNumber,
                x.IntentLetterDate,
                x.IntentLetterExpiry,
                x.BankChargesDebit,
                x.BankChargesAmount,
                x.SplitPayment,
                BranchesCount = x.Branches.Count,
                EmployeesCount = x.Employees.Count,
                CoordinatorDoctorId = x.CompanyDoctors
                    .Where(cd => cd.IsActive && cd.IsCoordinator)
                    .Select(cd => (int?)cd.DoctorId)
                    .FirstOrDefault() ?? x.CompanyDoctors
                    .Where(cd => cd.IsActive)
                    .Select(cd => (int?)cd.DoctorId)
                    .FirstOrDefault(),
                CoordinatorDoctorName = x.CompanyDoctors
                    .Where(cd => cd.IsActive && cd.IsCoordinator && cd.Doctor != null)
                    .Select(cd => "Dott. " + cd.Doctor.FirstName + " " + cd.Doctor.LastName)
                    .FirstOrDefault() ?? x.CompanyDoctors
                    .Where(cd => cd.IsActive && cd.Doctor != null)
                    .Select(cd => "Dott. " + cd.Doctor.FirstName + " " + cd.Doctor.LastName)
                    .FirstOrDefault(),
                DoctorName = x.CompanyDoctors
                    .Where(cd => cd.IsActive && cd.IsCoordinator && cd.Doctor != null)
                    .Select(cd => "Dott. " + cd.Doctor.FirstName + " " + cd.Doctor.LastName)
                    .FirstOrDefault() ?? x.CompanyDoctors
                    .Where(cd => cd.IsActive && cd.Doctor != null)
                    .Select(cd => "Dott. " + cd.Doctor.FirstName + " " + cd.Doctor.LastName)
                    .FirstOrDefault(),
                IsCoordinator = x.CompanyDoctors.Any(cd => cd.IsActive && cd.IsCoordinator)
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("branches")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetBranches()
    {
        var tenantId = GetTenantId();
        var data = await _dbContext.Branches
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.City)
            .ThenBy(x => x.Address)
            .Select(x => new
            {
                x.Id,
                x.TenantId,
                x.CompanyId,
                CompanyName = x.Company.Name,
                x.Address,
                x.City,
                x.Province,
                x.PostalCode,
                x.Name,
                x.IsActive,
                EmployeesCount = x.Employees.Count
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("employees")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] bool includeArchived = false,
        [FromQuery] int? companyId = null,
        [FromQuery] int? doctorId = null,
        [FromQuery] string? search = null)
    {
        var tenantId = GetTenantId();
        var query = _dbContext.Employees
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId);

        if (!includeArchived)
            query = query.Where(x => !x.IsArchived);

        if (companyId.HasValue && companyId.Value > 0)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (doctorId.HasValue && doctorId.Value > 0)
        {
            query = query.Where(x => x.Company != null && x.Company.CompanyDoctors.Any(cd => cd.DoctorId == doctorId.Value && cd.IsActive));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(x => x.FirstName.ToLower().Contains(s) || x.LastName.ToLower().Contains(s) || x.TaxCode.ToLower().Contains(s));
        }

        var data = await query
            .OrderBy(x => x.LastName)
            .ThenBy(x => x.FirstName)
            .Select(x => new
            {
                x.Id,
                x.TenantId,
                x.CompanyId,
                CompanyName = x.Company != null ? x.Company.Name : null,
                CompanyDoctorId = x.Company != null ? x.Company.CompanyDoctors
                    .Where(cd => cd.IsActive && cd.IsCoordinator)
                    .Select(cd => (int?)cd.DoctorId)
                    .FirstOrDefault() ?? x.Company.CompanyDoctors
                    .Where(cd => cd.IsActive)
                    .Select(cd => (int?)cd.DoctorId)
                    .FirstOrDefault() : null,
                CompanyDoctorName = x.Company != null ? x.Company.CompanyDoctors
                    .Where(cd => cd.IsActive && cd.IsCoordinator && cd.Doctor != null)
                    .Select(cd => "Dott. " + cd.Doctor.FirstName + " " + cd.Doctor.LastName)
                    .FirstOrDefault() ?? x.Company.CompanyDoctors
                    .Where(cd => cd.IsActive && cd.Doctor != null)
                    .Select(cd => "Dott. " + cd.Doctor.FirstName + " " + cd.Doctor.LastName)
                    .FirstOrDefault() : null,
                x.BranchId,
                BranchAddress = x.Branch != null ? x.Branch.Address : null,
                x.DepartmentId,
                x.WorkLocationId,
                x.Reparto,
                x.LuogoDiLavoro,
                x.Periodicita,
                x.ExternalId,
                x.FirstName,
                x.LastName,
                x.TaxCode,
                x.JobRole,
                x.BirthDate,
                x.Gender,
                x.BirthCity,
                x.BirthCityCode,
                x.BirthProvince,
                x.BirthCountryCode,
                x.PersonalEmail,
                x.PhoneNumber,
                x.Address,
                x.City,
                x.Province,
                x.PostalCode,
                x.Nationality,
                x.EducationLevel,
                x.HireDate,
                x.TerminationDate,
                x.ContractType,
                x.Qualification,
                x.JobRoleId,
                JobRoleName = x.JobRoleNavigation != null ? x.JobRoleNavigation.Name : null,
                x.RiskLevelId,
                x.IsActive,
                x.IsArchived,
                x.ConsentGDPR,
                x.ConsentGDPRDate,
                x.ConsentHealthData,
                x.ConsentHealthDataDate,
                // Extended fields (2026-09)
                x.Matricola,
                x.Domicilio,
                x.IndirizzoDomicilio,
                x.MedicoCurante,
                x.IndirizzoMedico,
                x.TelefonoMedico,
                x.GruppoSanguigno,
                x.DataUltimaVisita,
                x.DataProssimaVisita,
                x.TipoProssimaVisita,
                x.DataUltimaVisitaRI,
                x.PeriodicitaVisitaRI,
                x.DataProssimaVisitaRI,
                x.DataAssunzione,
                x.DataAttualeMansione,
                x.ReferenteAziendale,
                x.IdentificativoMPI,
                x.StatoRisorsa,
                x.Motivazione,
                x.DataCessazione,
                x.DataRiattivazione,
                x.CategoriaProtetta,
                x.DocumentiPrivacy,
                x.NoteRiservate,
                x.NotePerAzienda,
                x.CreatedAt,
                x.UpdatedAt,
                Risks = x.EmployeeRisks.Select(r => r.RiskFactor.Name).ToList()
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("doctors")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetDoctors()
    {
        var tenantId = GetTenantId();
        var data = await _dbContext.Doctors
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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

        var tenantId = GetTenantId();
        var data = await _dbContext.CompanyDoctors
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId && x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.RiskFactors
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.ExamTypes
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.EmployeeRisks
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.MedicalRecords
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Include(x => x.Employee).ThenInclude(e => e!.Company)
            .Include(x => x.Doctor)
            .Where(x => x.TenantId == tenantId)
            .OrderByDescending(x => x.VisitDate)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                EmployeeFirstName = x.Employee != null ? x.Employee.FirstName : null,
                EmployeeLastName = x.Employee != null ? x.Employee.LastName : null,
                EmployeeFullName = x.Employee != null ? x.Employee.FirstName + " " + x.Employee.LastName : null,
                CompanyId = x.Employee != null ? x.Employee.CompanyId : (int?)null,
                CompanyName = x.Employee != null && x.Employee.Company != null ? x.Employee.Company.Name : null,
                x.DoctorId,
                DoctorFullName = x.Doctor != null ? x.Doctor.FirstName + " " + x.Doctor.LastName : null,
                x.VisitDate,
                x.NextDeadlineDate,
                x.Outcome,
                x.OutcomeCode,
                x.Prescriptions,
                x.Limitations,
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
        var tenantId = GetTenantId();
        var data = await _dbContext.VisitExams
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.JobRoles
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.Protocols
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.PersonalProtocols
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.Anamneses
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.ScheduledExams
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.Vaccinations
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.NotificationLogs
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.DoctorAvailabilities
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.CompanyGroups
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
    public async Task<IActionResult> GetCompanyContacts([FromQuery] int? companyId = null)
    {
        var tenantId = GetTenantId();
        var query = _dbContext.CompanyContacts
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId);

        if (companyId.HasValue && companyId.Value > 0)
        {
            query = query.Where(x => x.CompanyId == companyId.Value);
        }

        var data = await query
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
        var tenantId = GetTenantId();
        var data = await _dbContext.Departments
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
        var tenantId = GetTenantId();
        var data = await _dbContext.WorkLocations
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.CompanyId)
            .ThenBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.CompanyId,
                CompanyName = x.Company!.Name,
                x.Name,
                x.Address,
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
        var tenantId = GetTenantId();
        var data = await _dbContext.SiteVisits
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
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
                x.NextDueDate,
                x.Notes,
                x.Outcome
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("employees/search")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> SearchEmployees([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        {
            return Ok(new List<EmployeeSearchDto>());
        }

        var tenantId = GetTenantId();
        var query = q.ToLower();

        var data = await _dbContext.Employees
            .Include(e => e.Company)
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId && 
                        (e.FirstName.ToLower().Contains(query) || 
                         e.LastName.ToLower().Contains(query) || 
                         e.TaxCode.ToLower().Contains(query)))
            .Take(10)
            .Select(e => new EmployeeSearchDto(
                e.Id,
                e.FirstName,
                e.LastName,
                e.TaxCode,
                e.Company != null ? e.Company.Name : "N/D"
            ))
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("phrase-templates")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> GetPhraseTemplates()
    {
        var tenantId = GetTenantId();
        var data = await _dbContext.PhraseTemplates
            .AsNoTracking()
            .Where(p => p.TenantId == tenantId)
            .Select(p => new PhraseTemplateDto(
                p.Id,
                p.Category,
                p.Text,
                p.Tags
            ))
            .ToListAsync();

        return Ok(data);
    }

    private int GetTenantId()
    {
        var claim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value;
        if (int.TryParse(claim, out var id) && id > 0)
            return id;
        throw new UnauthorizedAccessException("Tenant non specificato");
    }
}

public record EmployeeSearchDto(int Id, string FirstName, string LastName, string TaxCode, string CompanyName);
public record PhraseTemplateDto(int Id, string Category, string Text, string? Tags);
