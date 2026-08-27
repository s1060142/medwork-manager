using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/doctor-data")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class DoctorCrudController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly INotificationService _notificationService;
    private readonly IDeadlineCalculationService _deadlineCalculationService;
    private readonly IJwtTokenService _jwtTokenService;

    public DoctorCrudController(
        AppDbContext dbContext, 
        INotificationService notificationService,
        IDeadlineCalculationService deadlineCalculationService,
        IJwtTokenService jwtTokenService)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
        _deadlineCalculationService = deadlineCalculationService;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("medical-records")]
    public async Task<IActionResult> CreateMedicalRecord([FromBody] MedicalRecord request)
    {
        var tenantId = GetTenantId();
        var exists = await _dbContext.MedicalRecords.AnyAsync(x => x.EmployeeId == request.EmployeeId && x.TenantId == tenantId);
        if (exists)
        {
            return Conflict("A medical record already exists for this employee.");
        }

        request.TenantId = tenantId;
        _dbContext.MedicalRecords.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("medical-records/{id:int}")]
    public async Task<IActionResult> UpdateMedicalRecord(int id, [FromBody] MedicalRecord request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.MedicalRecords.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.EmployeeId = request.EmployeeId;
        entity.MedicalHistory = request.MedicalHistory;
        entity.Notes = request.Notes;
        entity.CurrentTherapies = request.CurrentTherapies;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("medical-records/{id:int}")]
    public async Task<IActionResult> DeleteMedicalRecord(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.MedicalRecords.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.MedicalRecords.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("medical-visits")]
    public async Task<IActionResult> CreateMedicalVisit([FromBody] MedicalVisit request)
    {
        var validationResults = new List<ValidationResult>();
        if (!Validator.TryValidateObject(request, new ValidationContext(request), validationResults, true))
        {
            return BadRequest(validationResults);
        }

        if (request.DoctorId <= 0)
        {
            request.DoctorId = await _dbContext.Doctors
                .AsNoTracking()
                .OrderBy(x => x.Id)
                .Select(x => x.Id)
                .FirstOrDefaultAsync();

            if (request.DoctorId <= 0)
            {
                return BadRequest("Nessun medico disponibile per registrare la visita.");
            }
        }

        // ── NEW: Auto-calculate NextDeadlineDate from protocol ──────────────────
        // If the client sends the sentinel date (a date exactly equal to VisitDate),
        // attempt auto-calculation.
        bool needsAutoDeadline = request.NextDeadlineDate.Date == request.VisitDate.Date;

        if (needsAutoDeadline)
        {
            var computed = await _deadlineCalculationService.CalculateAsync(
                request.EmployeeId, request.VisitDate);

            if (computed.HasValue)
            {
                request.NextDeadlineDate = computed.Value;
            }
            else
            {
                // No protocol assigned — client must supply the date manually
                return BadRequest(new
                {
                    error = "DeadlineMissing",
                    message = "Nessun protocollo assegnato al lavoratore. Inserire la data di prossima scadenza manualmente."
                });
            }
        }
        // ── END NEW ─────────────────────────────────────────────────────────────

        _dbContext.MedicalVisits.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("medical-visits/{id:int}")]
    public async Task<IActionResult> UpdateMedicalVisit(int id, [FromBody] MedicalVisit request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var tenantId = GetTenantId();
        var entity = await _dbContext.MedicalVisits.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        var doctorId = request.DoctorId;
        if (doctorId <= 0)
        {
            doctorId = await _dbContext.Doctors
                .AsNoTracking()
                .OrderBy(x => x.Id)
                .Select(x => x.Id)
                .FirstOrDefaultAsync();

            if (doctorId <= 0)
            {
                return BadRequest("Nessun medico disponibile per aggiornare la visita.");
            }
        }

        entity.EmployeeId = request.EmployeeId;
        entity.DoctorId = doctorId;
        entity.VisitDate = request.VisitDate;
        entity.NextDeadlineDate = request.NextDeadlineDate;
        entity.Outcome = request.Outcome;
        entity.ClinicalNotes = request.ClinicalNotes;
        entity.VisitType = request.VisitType;
        entity.TargetOrgans = request.TargetOrgans;
        entity.ObjectiveExam = request.ObjectiveExam;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("medical-visits/{id:int}")]
    public async Task<IActionResult> DeleteMedicalVisit(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.MedicalVisits.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.MedicalVisits.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("visit-exams")]
    public async Task<IActionResult> CreateVisitExam([FromBody] VisitExam request)
    {
        var tenantId = GetTenantId();
        
        // Verify the medical visit belongs to the current tenant
        var visitExists = await _dbContext.MedicalVisits.AnyAsync(v => v.Id == request.MedicalVisitId && v.TenantId == tenantId);
        if (!visitExists)
        {
            return NotFound("Medical visit not found.");
        }

        request.TenantId = tenantId;
        _dbContext.VisitExams.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("visit-exams/{id:int}")]
    public async Task<IActionResult> UpdateVisitExam(int id, [FromBody] VisitExam request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.VisitExams.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.MedicalVisitId = request.MedicalVisitId;
        entity.ExamTypeId = request.ExamTypeId;
        entity.Result = request.Result;
        entity.Notes = request.Notes;
        entity.ReferenceRange = request.ReferenceRange;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("visit-exams/{id:int}")]
    public async Task<IActionResult> DeleteVisitExam(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.VisitExams.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.VisitExams.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("anamneses")]
    public async Task<IActionResult> CreateAnamnesis([FromBody] Anamnesis request)
    {
        var tenantId = GetTenantId();
        var exists = await _dbContext.Anamneses.AnyAsync(x => x.MedicalVisitId == request.MedicalVisitId && x.TenantId == tenantId);
        if (exists)
        {
            return Conflict("An anamnesis already exists for this medical visit.");
        }

        request.TenantId = tenantId;
        _dbContext.Anamneses.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("anamneses/{id:int}")]
    public async Task<IActionResult> UpdateAnamnesis(int id, [FromBody] Anamnesis request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Anamneses.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.MedicalVisitId = request.MedicalVisitId;
        entity.WorkHistory = request.WorkHistory;
        entity.PersonalHistory = request.PersonalHistory;
        entity.FamilyHistory = request.FamilyHistory;
        entity.RemotePathology = request.RemotePathology;
        entity.RecentPathology = request.RecentPathology;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("anamneses/{id:int}")]
    public async Task<IActionResult> DeleteAnamnesis(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Anamneses.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.Anamneses.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("scheduled-exams")]
    public async Task<IActionResult> CreateScheduledExam([FromBody] ScheduledExam request)
    {
        var tenantId = GetTenantId();
        
        // Verify the employee belongs to the current tenant
        var employeeExists = await _dbContext.Employees.AnyAsync(e => e.Id == request.EmployeeId && e.TenantId == tenantId);
        if (!employeeExists)
        {
            return NotFound("Employee not found.");
        }

        request.TenantId = tenantId;
        _dbContext.ScheduledExams.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("scheduled-exams/{id:int}")]
    public async Task<IActionResult> UpdateScheduledExam(int id, [FromBody] ScheduledExam request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.ScheduledExams.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.EmployeeId = request.EmployeeId;
        entity.ExamTypeId = request.ExamTypeId;
        entity.DueDate = request.DueDate;
        entity.Status = request.Status;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("scheduled-exams/{id:int}")]
    public async Task<IActionResult> DeleteScheduledExam(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.ScheduledExams.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.ScheduledExams.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("vaccinations")]
    public async Task<IActionResult> CreateVaccination([FromBody] Vaccination request)
    {
        var tenantId = GetTenantId();
        
        // Verify the employee belongs to the current tenant
        var employeeExists = await _dbContext.Employees.AnyAsync(e => e.Id == request.EmployeeId && e.TenantId == tenantId);
        if (!employeeExists)
        {
            return NotFound("Employee not found.");
        }

        request.TenantId = tenantId;
        _dbContext.Vaccinations.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("vaccinations/{id:int}")]
    public async Task<IActionResult> UpdateVaccination(int id, [FromBody] Vaccination request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Vaccinations.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        entity.EmployeeId = request.EmployeeId;
        entity.VaccineName = request.VaccineName;
        entity.DateAdministered = request.DateAdministered;
        entity.NextDueDate = request.NextDueDate;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("vaccinations/{id:int}")]
    public async Task<IActionResult> DeleteVaccination(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Vaccinations.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity is null) return NotFound();

        _dbContext.Vaccinations.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("convocations")]
    public async Task<IActionResult> ConvocateEmployee([FromBody] ConvocationRequest request)
    {
        var tenantId = GetTenantId();
        var employeeExists = await _dbContext.Employees.AnyAsync(x => x.Id == request.EmployeeId && x.TenantId == tenantId);
        if (!employeeExists)
        {
            return NotFound("Employee not found.");
        }

        var log = await _notificationService.SendConvocationAsync(tenantId, request.EmployeeId, request.Channel, request.MessageText);
        return Ok(log);
    }

    public class ConvocationRequest
    {
        public int EmployeeId { get; set; }
        public NotificationChannel Channel { get; set; } = NotificationChannel.Email;
        public string MessageText { get; set; } = string.Empty;
    }

    /// <summary>
    /// Returns the computed next deadline date for a given employee + visit date,
    /// without creating a visit. Used by the frontend to preview the deadline.
    /// </summary>
    [HttpGet("deadline-preview")]
    public async Task<IActionResult> GetDeadlinePreview(
        [FromQuery] int employeeId,
        [FromQuery] DateTime visitDate,
        CancellationToken cancellationToken)
    {
        if (employeeId <= 0)
            return BadRequest("employeeId is required.");
        if (visitDate == default)
            visitDate = DateTime.UtcNow.Date;

        var computed = await _deadlineCalculationService.CalculateAsync(
            employeeId, visitDate, cancellationToken);

        if (computed is null)
            return Ok(new { deadline = (DateTime?)null, hasProtocol = false });

        return Ok(new { deadline = computed.Value, hasProtocol = true });
    }

    // ── MEDICAL VISITS ─────────────────────────────────────────────────────────

    [HttpGet("medical-visits")]
    public async Task<IActionResult> GetMedicalVisits()
    {
        var tenantId = GetTenantId();
        var visits = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Where(v => v.TenantId == tenantId)
            .OrderByDescending(v => v.VisitDate)
            .Select(v => new
            {
                v.Id,
                v.EmployeeId,
                v.DoctorId,
                v.VisitDate,
                v.NextDeadlineDate,
                v.VisitType,
                v.Outcome,
                v.IsSigned
            })
            .ToListAsync();
        return Ok(visits);
    }

    // ── MEDICAL RECORDS ───────────────────────────────────────────────────────

    [HttpGet("medical-records")]
    public async Task<IActionResult> GetMedicalRecords()
    {
        var tenantId = GetTenantId();
        var records = await _dbContext.MedicalRecords
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.EmployeeId,
                r.MedicalHistory,
                r.FamilyHistory,
                r.Allergies,
                r.CurrentTherapies,
                r.Notes,
                r.Status,
                r.CreatedAt
            })
            .ToListAsync();
        return Ok(records);
    }

    // ── PROTOCOLS ──────────────────────────────────────────────────────────────

    [HttpGet("protocols")]
    public async Task<IActionResult> GetProtocols()
    {
        var tenantId = GetTenantId();
        var protocols = await _dbContext.Protocols
            .AsNoTracking()
            .Where(p => p.TenantId == tenantId && p.IsActive)
            .OrderBy(p => p.Name)
            .Select(p => new ProtocolDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                LawReference = p.LawReference,
                CadenceDays = p.CadenceDays,
                Objective = p.Objective,
                JobRoleId = p.JobRoleId,
                IsTemplate = p.IsTemplate,
                IsActive = p.IsActive,
                Version = p.Version,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return Ok(protocols);
    }

    [HttpPost("protocols")]
    public async Task<IActionResult> CreateProtocol([FromBody] CreateProtocolRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Il nome del protocollo è obbligatorio.");

        var protocol = new Protocol
        {
            TenantId = GetTenantId(), 
            Name = request.Name.Trim(),
            Description = request.Description,
            LawReference = string.IsNullOrWhiteSpace(request.LawReference) ? "D.Lgs. 81/08" : request.LawReference.Trim(),
            CadenceDays = request.CadenceDays > 0 ? request.CadenceDays : 365,
            Objective = request.Objective,
            JobRoleId = request.JobRoleId,
            IsTemplate = false,
            IsActive = true,
            Version = 1,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Protocols.Add(protocol);
        await _dbContext.SaveChangesAsync();
        return Ok(new ProtocolDto
        {
            Id = protocol.Id,
            Name = protocol.Name,
            Description = protocol.Description,
            LawReference = protocol.LawReference,
            CadenceDays = protocol.CadenceDays,
            Objective = protocol.Objective,
            JobRoleId = protocol.JobRoleId,
            IsTemplate = protocol.IsTemplate,
            IsActive = protocol.IsActive,
            Version = protocol.Version,
            CreatedAt = protocol.CreatedAt
        });
    }

    [HttpPut("protocols/{id:int}")]
    public async Task<IActionResult> UpdateProtocol(int id, [FromBody] CreateProtocolRequest request)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Protocols
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (entity is null) return NotFound();

        entity.Name = request.Name.Trim();
        entity.Description = request.Description;
        entity.LawReference = string.IsNullOrWhiteSpace(request.LawReference) ? entity.LawReference : request.LawReference.Trim();
        entity.CadenceDays = request.CadenceDays > 0 ? request.CadenceDays : entity.CadenceDays;
        entity.Objective = request.Objective;
        entity.JobRoleId = request.JobRoleId;
        entity.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPatch("protocols/{id:int}/toggle")]
    public async Task<IActionResult> ToggleProtocol(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.Protocols
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (entity is null) return NotFound();

        entity.IsActive = !entity.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        return Ok(new { entity.Id, entity.IsActive });
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var tenantId = GetTenantId();
        var today = DateTime.UtcNow.Date;
        var endOfWeek = today.AddDays(7);

        var visitsToday = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Where(v => v.TenantId == tenantId && v.VisitDate.Date == today)
            .CountAsync();

        var deadlinesThisWeek = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Where(v => v.TenantId == tenantId && 
                        v.NextDeadlineDate.Date >= today && 
                        v.NextDeadlineDate.Date <= endOfWeek)
            .Select(v => v.EmployeeId)
            .Distinct()
            .CountAsync();

        var overdueVisits = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Where(v => v.TenantId == tenantId && v.NextDeadlineDate.Date < today)
            .Select(v => v.EmployeeId)
            .Distinct()
            .CountAsync();

        return Ok(new DashboardSummaryDto(
            visitsToday,
            deadlinesThisWeek,
            overdueVisits
        ));
    }

    [HttpGet("employees/{id:int}/last-visit")]
    public async Task<IActionResult> GetLastVisit(int id)
    {
        var tenantId = GetTenantId();
        var visit = await _dbContext.MedicalVisits
            .Include(v => v.Anamnesis)
            .AsNoTracking()
            .Where(v => v.EmployeeId == id && v.TenantId == tenantId)
            .OrderByDescending(v => v.VisitDate)
            .FirstOrDefaultAsync();

        if (visit == null) return NoContent();

        var dto = new LastVisitDto(
            ObjectiveExam: visit.ObjectiveExam,
            WorkHistory: visit.Anamnesis?.WorkHistory,
            PersonalHistory: visit.Anamnesis?.PersonalHistory,
            FamilyHistory: visit.Anamnesis?.FamilyHistory,
            RemotePathology: visit.Anamnesis?.RemotePathology,
            RecentPathology: visit.Anamnesis?.RecentPathology
        );

        return Ok(dto);
    }

    [HttpGet("employees/{id:int}/context")]
    public async Task<IActionResult> GetEmployeeContext(int id)
    {
        var tenantId = GetTenantId();
        var employee = await _dbContext.Employees
            .Include(e => e.JobRoleNavigation)
            .Include(e => e.RiskLevel)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);

        if (employee == null) return NotFound();

        var recentVisits = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Where(v => v.EmployeeId == id && v.TenantId == tenantId)
            .OrderByDescending(v => v.VisitDate)
            .Take(3)
            .Select(v => new HistoricalVisitDto(
                v.VisitDate,
                v.Outcome,
                v.BloodPressure,
                v.HeartRate
            ))
            .ToListAsync();

        var dto = new EmployeeContextDto(
            JobRole: employee.JobRoleNavigation != null ? employee.JobRoleNavigation.Name : employee.JobRole,
            RiskLevelName: employee.RiskLevel != null ? employee.RiskLevel.Name : null,
            RecentVisits: recentVisits
        );

        return Ok(dto);
    }

    [HttpGet("calendar-events")]
    public async Task<IActionResult> GetCalendarEvents([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var tenantId = GetTenantId();
        var visits = await _dbContext.MedicalVisits
            .Include(v => v.Employee)
            .ThenInclude(e => e.Company)
            .Where(v => v.TenantId == tenantId && v.VisitDate >= start && v.VisitDate <= end)
            .Select(v => new CalendarEventDto(
                v.Id,
                v.EmployeeId,
                v.Employee != null ? v.Employee.FirstName + " " + v.Employee.LastName : "",
                v.Employee != null ? v.Employee.CompanyId : 0,
                v.Employee != null && v.Employee.Company != null ? v.Employee.Company.Name : "",
                v.VisitDate,
                v.VisitType.ToString()
            ))
            .ToListAsync();

        return Ok(visits);
    }

    [HttpGet("recall-candidates")]
    public async Task<IActionResult> GetRecallCandidates([FromQuery] int companyId, [FromQuery] int days)
    {
        var tenantId = GetTenantId();
        var limitDate = DateTime.UtcNow.AddDays(days);
        var now = DateTime.UtcNow;

        var candidates = await _dbContext.MedicalVisits
            .Include(v => v.Employee)
            .ThenInclude(e => e.Company)
            .Where(v => v.TenantId == tenantId && 
                        (companyId == 0 || (v.Employee != null && v.Employee.CompanyId == companyId)) &&
                        v.NextDeadlineDate >= now && v.NextDeadlineDate <= limitDate)
            .OrderBy(v => v.NextDeadlineDate)
            .Select(v => new RecallCandidateDto(
                v.EmployeeId,
                v.Employee != null ? v.Employee.FirstName + " " + v.Employee.LastName : "",
                v.Employee != null && v.Employee.Company != null ? v.Employee.Company.Name : "",
                v.NextDeadlineDate
            ))
            .ToListAsync();

        return Ok(candidates.DistinctBy(c => c.EmployeeId));
    }

    [HttpPost("recall-campaign")]
    public async Task<IActionResult> TriggerRecallCampaign([FromBody] RecallCampaignRequestDto request)
    {
        var tenantId = GetTenantId();
        var limitDate = DateTime.UtcNow.AddDays(request.DaysThreshold);
        var now = DateTime.UtcNow;

        var employeesToExpire = await _dbContext.MedicalVisits
            .Include(v => v.Employee)
            .Where(v => v.TenantId == tenantId && 
                        (request.CompanyId == 0 || (v.Employee != null && v.Employee.CompanyId == request.CompanyId)) &&
                        v.NextDeadlineDate >= now && v.NextDeadlineDate <= limitDate)
            .Select(v => v.Employee)
            .Where(e => e != null)
            .Distinct()
            .ToListAsync();

        foreach (var emp in employeesToExpire)
        {
            var log = new NotificationLog
            {
                TenantId = tenantId,
                EmployeeId = emp!.Id,
                MessageText = $"Automatic Recall Campaign: Visita in scadenza entro {request.DaysThreshold} giorni.",
                SentDate = DateTime.UtcNow,
                IsDelivered = true, // Simulated email
                Channel = NotificationChannel.Email
            };
            _dbContext.NotificationLogs.Add(log);
        }

        await _dbContext.SaveChangesAsync();
        return Ok(new { success = true, notifiedCount = employeesToExpire.Count });
    }

    [HttpGet("companies/{id:int}/health-plan")]
    public async Task<IActionResult> GetCompanyHealthPlan(int id)
    {
        var tenantId = GetTenantId();
        var company = await _dbContext.Companies.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
        if (company == null) return NotFound();

        var employees = await _dbContext.Employees
            .Include(e => e.JobRoleNavigation)
            .Include(e => e.EmployeeRisks).ThenInclude(er => er.RiskFactor)
            .Include(e => e.PersonalProtocols).ThenInclude(pp => pp.Protocol)
            .Where(e => e.CompanyId == id && e.TenantId == tenantId && e.IsActive)
            .Select(e => new HealthPlanEmployeeDto(
                e.FirstName + " " + e.LastName,
                e.JobRoleNavigation != null ? e.JobRoleNavigation.Name : e.JobRole,
                e.EmployeeRisks.Select(er => er.RiskFactor != null ? er.RiskFactor.Name : "").ToList(),
                e.PersonalProtocols.Select(pp => pp.Protocol != null ? pp.Protocol.Name : "").ToList()
            ))
            .ToListAsync();

        return Ok(new HealthPlanDto(company.Name, employees));
    }

    [HttpGet("compliance-alerts")]
    public async Task<IActionResult> GetComplianceAlerts()
    {
        var tenantId = GetTenantId();
        var alerts = new List<ComplianceAlertDto>();

        // Missing Job Roles
        var missingJobRoles = await _dbContext.Employees
            .Where(e => e.TenantId == tenantId && e.IsActive && e.JobRoleId == null)
            .Select(e => new ComplianceAlertDto("Employee", e.Id, e.FirstName + " " + e.LastName, "Manca la Mansione (JobRole) assegnata", "Warning"))
            .ToListAsync();
        
        alerts.AddRange(missingJobRoles);

        // Missing RSPP
        var missingRSPP = await _dbContext.Companies
            .Where(c => c.TenantId == tenantId && c.IsActive && (c.RSPP == null || c.RSPP == ""))
            .Select(c => new ComplianceAlertDto("Company", c.Id, c.Name, "RSPP non definito", "Critical"))
            .ToListAsync();
            
        alerts.AddRange(missingRSPP);

        // Future visits
        var futureVisits = await _dbContext.MedicalVisits
            .Include(v => v.Employee)
            .Where(v => v.TenantId == tenantId && v.VisitDate > DateTime.UtcNow.AddDays(1))
            .Select(v => new ComplianceAlertDto("MedicalVisit", v.Id, v.Employee != null ? v.Employee.FirstName + " " + v.Employee.LastName : "", "Data visita nel futuro", "Warning"))
            .ToListAsync();
            
        alerts.AddRange(futureVisits);

        return Ok(alerts);
    }

    [HttpGet("companies/{companyId:int}/analytics")]
    public async Task<IActionResult> GetEnterpriseAnalytics(int companyId)
    {
        var tenantId = GetTenantId();
        
        var visits = await _dbContext.MedicalVisits
            .Include(v => v.Employee)
            .Where(v => v.TenantId == tenantId && v.Employee != null && v.Employee.CompanyId == companyId)
            .ToListAsync();

        var employees = await _dbContext.Employees
            .Include(e => e.EmployeeRisks).ThenInclude(er => er.RiskFactor)
            .Where(e => e.TenantId == tenantId && e.CompanyId == companyId && e.IsActive)
            .ToListAsync();

        var totalVisits = visits.Count;
        var idoneiCount = visits.Count(v => v.Outcome.Contains("Idoneo", StringComparison.OrdinalIgnoreCase) && !v.Outcome.Contains("Non", StringComparison.OrdinalIgnoreCase));
        var nonIdoneiCount = visits.Count(v => v.Outcome.Contains("Non Idoneo", StringComparison.OrdinalIgnoreCase));
        var prescriptionsCount = totalVisits - idoneiCount - nonIdoneiCount; // Roughly "Idoneo con limitazioni"

        var visitsByMonth = visits
            .GroupBy(v => v.VisitDate.ToString("yyyy-MM"))
            .ToDictionary(g => g.Key, g => g.Count());

        var risksDistribution = employees
            .SelectMany(e => e.EmployeeRisks)
            .Where(er => er.RiskFactor != null)
            .GroupBy(er => er.RiskFactor!.Name)
            .ToDictionary(g => g.Key, g => g.Count());

        var dto = new EnterpriseAnalyticsDto(
            totalVisits,
            idoneiCount,
            nonIdoneiCount,
            prescriptionsCount,
            visitsByMonth,
            risksDistribution
        );

        return Ok(dto);
    }

    [HttpGet("companies/{companyId:int}/allegato-3b")]
    public async Task<IActionResult> GetAllegato3B(int companyId, [FromQuery] int year)
    {
        var tenantId = GetTenantId();
        
        var company = await _dbContext.Companies.FirstOrDefaultAsync(c => c.Id == companyId && c.TenantId == tenantId);
        if (company == null) return NotFound();

        var visits = await _dbContext.MedicalVisits
            .Where(v => v.TenantId == tenantId && v.Employee != null && v.Employee.CompanyId == companyId && v.VisitDate.Year == year)
            .ToListAsync();

        var employees = await _dbContext.Employees
            .Include(e => e.EmployeeRisks).ThenInclude(er => er.RiskFactor)
            .Where(e => e.TenantId == tenantId && e.CompanyId == companyId && e.IsActive)
            .ToListAsync();

        var totalVisits = visits.Count;
        var idonei = visits.Count(v => v.Outcome.Contains("Idoneo", StringComparison.OrdinalIgnoreCase) && !v.Outcome.Contains("Non", StringComparison.OrdinalIgnoreCase) && !v.Outcome.Contains("limitazion", StringComparison.OrdinalIgnoreCase));
        var inidonei = visits.Count(v => v.Outcome.Contains("Non Idoneo", StringComparison.OrdinalIgnoreCase) || v.Outcome.Contains("Inidoneo", StringComparison.OrdinalIgnoreCase));
        var sospesi = visits.Count(v => v.Outcome.Contains("Sospeso", StringComparison.OrdinalIgnoreCase) || v.Outcome.Contains("Temporaneamente", StringComparison.OrdinalIgnoreCase));
        var idoneiParziali = totalVisits - idonei - inidonei - sospesi;

        var riskExposures = employees
            .SelectMany(e => e.EmployeeRisks)
            .Where(er => er.RiskFactor != null)
            .GroupBy(er => er.RiskFactor!.Name)
            .ToDictionary(g => g.Key, g => g.Count());

        var dto = new Allegato3BDto(
            company.Name,
            year,
            employees.Count,
            totalVisits,
            idonei,
            idoneiParziali,
            inidonei,
            sospesi,
            riskExposures
        );

        return Ok(dto);
    }

    [HttpPost("anamnesis-magic-link")]
    public async Task<IActionResult> GenerateAnamnesisMagicLink([FromBody] MagicLinkRequestDto request)
    {
        var tenantId = GetTenantId();
        
        var visit = await _dbContext.MedicalVisits
            .Include(v => v.Employee)
            .FirstOrDefaultAsync(v => v.Id == request.VisitId && v.TenantId == tenantId);

        if (visit == null || visit.Employee == null) return NotFound();

        // Generate token with EmployeeId, standard "Patient" role
        var token = _jwtTokenService.GenerateToken(
            visit.EmployeeId,
            visit.Employee.PersonalEmail ?? "patient@medwork.local",
            new List<string> { "Patient" },
            new List<string>(),
            tenantId
        );

        // Store notification logic
        var log = new NotificationLog
        {
            TenantId = tenantId,
            EmployeeId = visit.EmployeeId,
            MessageText = $"Compila la tua anamnesi pre-visita: https://medwork.local/patient-portal?token={token}",
            SentDate = DateTime.UtcNow,
            IsDelivered = true, // simulated email
            Channel = NotificationChannel.Email
        };

        _dbContext.NotificationLogs.Add(log);
        await _dbContext.SaveChangesAsync();

        return Ok(new { success = true, link = $"https://medwork.local/patient-portal?token={token}" });
    }

    [HttpGet("unsigned-visits")]
    public async Task<IActionResult> GetUnsignedVisits()
    {
        var tenantId = GetTenantId();
        var visits = await _dbContext.MedicalVisits
            .Include(v => v.Employee).ThenInclude(e => e.Company)
            .Where(v => v.TenantId == tenantId && !v.IsSigned)
            .Select(v => new UnsignedVisitDto(
                v.Id,
                v.Employee != null ? v.Employee.FirstName + " " + v.Employee.LastName : "",
                v.Employee != null && v.Employee.Company != null ? v.Employee.Company.Name : "",
                v.VisitDate,
                v.VisitType.ToString(),
                v.Outcome
            ))
            .ToListAsync();

        return Ok(visits);
    }

    [HttpPost("batch-sign")]
    public async Task<IActionResult> BatchSignVisits([FromBody] BatchSignRequestDto request)
    {
        if (request.VisitIds == null || !request.VisitIds.Any()) return BadRequest();

        var tenantId = GetTenantId();
        var visits = await _dbContext.MedicalVisits
            .Where(v => v.TenantId == tenantId && !v.IsSigned && request.VisitIds.Contains(v.Id))
            .ToListAsync();

        foreach (var v in visits)
        {
            v.IsSigned = true;
            v.SignedAt = DateTime.UtcNow;
            v.DigitalCertificateThumbprint = "SIMULATED-THUMBPRINT-0001";
        }

        await _dbContext.SaveChangesAsync();
        return Ok(new { success = true, signedCount = visits.Count });
    }

    // Helper — reads TenantId from the claim set by TenantContextFilter
    private int GetTenantId()
    {
        var claim = User.FindFirst("TenantId")?.Value;
        return int.TryParse(claim, out var id) && id > 0 ? id : 1;
    }
}

public sealed record ProtocolDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string LawReference { get; init; } = string.Empty;
    public int CadenceDays { get; init; }
    public string? Objective { get; init; }
    public int? JobRoleId { get; init; }
    public bool IsTemplate { get; init; }
    public bool IsActive { get; init; }
    public int Version { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed record CreateProtocolRequest
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? LawReference { get; init; }
    public int CadenceDays { get; init; } = 365;
    public string? Objective { get; init; }
    public int? JobRoleId { get; init; }
}

public record LastVisitDto(
    string? ObjectiveExam,
    string? WorkHistory,
    string? PersonalHistory,
    string? FamilyHistory,
    string? RemotePathology,
    string? RecentPathology
);

public record HistoricalVisitDto(
    DateTime VisitDate,
    string? Outcome,
    string? BloodPressure,
    string? HeartRate
);

public record EmployeeContextDto(
    string JobRole,
    string? RiskLevelName,
    List<HistoricalVisitDto> RecentVisits
);

public record DashboardSummaryDto(
    int VisitsToday,
    int DeadlinesThisWeek,
    int OverdueVisits
);

public record CalendarEventDto(int VisitId, int EmployeeId, string EmployeeName, int CompanyId, string CompanyName, DateTime EventDate, string EventType);

public record RecallCandidateDto(int EmployeeId, string EmployeeName, string CompanyName, DateTime DeadlineDate);
public record RecallCampaignRequestDto(int CompanyId, int DaysThreshold);

public record HealthPlanDto(string CompanyName, List<HealthPlanEmployeeDto> Employees);
public record HealthPlanEmployeeDto(string FullName, string JobRole, List<string> Risks, List<string> Protocols);

public record ComplianceAlertDto(string EntityType, int EntityId, string EntityName, string AlertMessage, string Severity);

public record UnsignedVisitDto(int VisitId, string EmployeeName, string CompanyName, DateTime VisitDate, string VisitType, string Outcome);
public record BatchSignRequestDto(List<int> VisitIds);

public record EnterpriseAnalyticsDto(int TotalVisits, int IdoneiCount, int NonIdoneiCount, int PrescriptionsCount, Dictionary<string, int> VisitsByMonth, Dictionary<string, int> RisksDistribution);

public record Allegato3BDto(string CompanyName, int Year, int TotalEmployeesSubjectToSurveillance, int TotalVisits, int Idonei, int IdoneiParziali, int Inidonei, int Sospesi, Dictionary<string, int> RiskExposures);

public record MagicLinkRequestDto(int VisitId);
