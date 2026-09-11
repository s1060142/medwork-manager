using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/company-groups")]
[Authorize]
public class CompanyGroupsController : ControllerBase
{
    private readonly AppDbContext _db;

    public CompanyGroupsController(AppDbContext db)
    {
        _db = db;
    }

    private int GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value;
        return int.TryParse(tenantClaim, out var id) && id > 0 ? id : 1;
    }

    // =========================================================================
    // 1. Group Listing, Legacy doctor-data route, and CRUD
    // =========================================================================

    [HttpGet("/api/doctor-data/company-groups")]
    public async Task<IActionResult> GetDoctorCompanyGroups()
    {
        var tenantId = GetTenantId();
        var today = DateTime.UtcNow.Date;
        var in60Days = today.AddDays(60);

        var groups = await _db.CompanyGroups
            .AsNoTracking()
            .Where(g => g.TenantId == tenantId)
            .OrderBy(g => g.Name)
            .Select(g => new
            {
                g.Id,
                g.Name,
                CompanyCount = _db.Companies.Count(c => c.CompanyGroupId == g.Id && c.TenantId == tenantId),
                ActiveProtocols = _db.GroupProtocols.Count(gp => gp.CompanyGroupId == g.Id),
                DueVisits = _db.MedicalVisits.Count(v => v.Employee != null && v.Employee.Company != null && v.Employee.Company.CompanyGroupId == g.Id && v.TenantId == tenantId && v.NextDeadlineDate.Date <= in60Days),
                LastModified = g.UpdatedAt.HasValue ? g.UpdatedAt.Value.ToString("dd/MM/yyyy") : g.CreatedAt.ToString("dd/MM/yyyy")
            })
            .ToListAsync();

        var totalGroups = groups.Count;
        var activeCompanies = await _db.Companies.CountAsync(c => c.TenantId == tenantId && c.IsActive);
        var upcomingDeadlines = await _db.MedicalVisits.CountAsync(v => v.TenantId == tenantId && v.NextDeadlineDate.Date >= today && v.NextDeadlineDate.Date <= in60Days);
        var activeVaccinations = await _db.Vaccinations.CountAsync(v => v.TenantId == tenantId);

        return Ok(new
        {
            summary = new
            {
                totalGroups,
                activeCompanies,
                upcomingDeadlines,
                activeVaccinations
            },
            groups
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tenantId = GetTenantId();
        var today = DateTime.UtcNow.Date;
        var in60Days = today.AddDays(60);

        var groups = await _db.CompanyGroups
            .AsNoTracking()
            .Where(g => g.TenantId == tenantId)
            .OrderBy(g => g.Name)
            .Select(g => new
            {
                g.Id,
                g.Name,
                g.LegalName,
                Type = g.Type.ToString(),
                Status = g.Status.ToString(),
                g.City,
                g.VATNumber,
                g.TaxCode,
                g.PEC,
                g.ContactEmail,
                g.ContactPhone,
                g.PropagateProtocols,
                g.PropagateDoctors,
                g.PropagateRiskFactors,
                g.PropagateVisitSchedules,
                g.ConsolidatedBilling,
                g.IsActive,
                g.CreatedAt,
                g.UpdatedAt,
                CompaniesCount = _db.Companies.Count(c => c.CompanyGroupId == g.Id && c.TenantId == tenantId),
                EmployeesCount = _db.Employees.Count(e => e.Company != null && e.Company.CompanyGroupId == g.Id && e.TenantId == tenantId),
                BranchesCount = _db.Branches.Count(b => b.Company != null && b.Company.CompanyGroupId == g.Id && b.TenantId == tenantId),
                VisitsDue = _db.MedicalVisits.Count(v => v.Employee != null && v.Employee.Company != null && v.Employee.Company.CompanyGroupId == g.Id && v.TenantId == tenantId && v.NextDeadlineDate.Date >= today && v.NextDeadlineDate.Date <= in60Days),
                VisitsOverdue = _db.MedicalVisits.Count(v => v.Employee != null && v.Employee.Company != null && v.Employee.Company.CompanyGroupId == g.Id && v.TenantId == tenantId && v.NextDeadlineDate.Date < today),
                SiteVisitsDue = _db.SiteVisits.Count(s => s.Company != null && s.Company.CompanyGroupId == g.Id && s.TenantId == tenantId && (s.NextDueDate == null || s.NextDueDate.Value.Date <= in60Days)),
                NominationsDue = _db.Companies.Count(c => c.CompanyGroupId == g.Id && c.TenantId == tenantId && !_db.CompanyDoctors.Any(cd => cd.CompanyId == c.Id && cd.IsActive)),
                VaccinationDeadlines = _db.Vaccinations.Count(vac => vac.Employee != null && vac.Employee.Company != null && vac.Employee.Company.CompanyGroupId == g.Id && vac.TenantId == tenantId && vac.NextDueDate.HasValue && vac.NextDueDate.Value.Date <= in60Days),
                ActiveProtocolsCount = _db.GroupProtocols.Count(gp => gp.CompanyGroupId == g.Id)
            })
            .ToListAsync();

        return Ok(groups);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups
            .AsNoTracking()
            .Where(g => g.Id == id && g.TenantId == tenantId)
            .Include(g => g.GroupDoctors)
                .ThenInclude(gd => gd.Doctor)
            .Include(g => g.GroupProtocols)
                .ThenInclude(gp => gp.Protocol)
            .Include(g => g.GroupRiskFactors)
                .ThenInclude(gr => gr.RiskFactor)
            .Include(g => g.GroupBillingConfigs)
            .Include(g => g.Companies)
            .FirstOrDefaultAsync();

        if (group == null)
            return NotFound(new { message = $"Gruppo aziendale con ID {id} non trovato." });

        var companies = await _db.Companies
            .AsNoTracking()
            .Where(c => c.CompanyGroupId == id && c.TenantId == tenantId)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.LegalName,
                c.VATNumber,
                c.TaxCode,
                c.OperationalCity,
                c.LegalCity,
                c.ContactEmail,
                c.ContactPhone,
                c.RSPP,
                c.IsActive,
                EmployeesCount = _db.Employees.Count(e => e.CompanyId == c.Id && e.TenantId == tenantId),
                BranchesCount = _db.Branches.Count(b => b.CompanyId == c.Id && b.TenantId == tenantId),
                HasCoordinatorDoctor = _db.CompanyDoctors.Any(cd => cd.CompanyId == c.Id && cd.IsActive && cd.IsCoordinator)
            })
            .ToListAsync();

        return Ok(new
        {
            group.Id,
            group.Name,
            group.LegalName,
            group.Address,
            group.City,
            group.PostalCode,
            group.Province,
            group.VATNumber,
            group.TaxCode,
            Type = group.Type.ToString(),
            Status = group.Status.ToString(),
            group.LegalForm,
            group.ShareCapital,
            group.RegistrationNumber,
            group.PEC,
            group.ContactEmail,
            group.ContactPhone,
            group.PropagateProtocols,
            group.PropagateRiskFactors,
            group.PropagateDoctors,
            group.PropagateVisitSchedules,
            group.ConsolidatedBilling,
            group.LegalRepresentative,
            group.LegalRepTaxCode,
            group.RSPPGroup,
            group.MedicoCompetenteGroup,
            group.LastComplianceReview,
            group.ComplianceNotes,
            group.IsActive,
            group.CreatedAt,
            group.UpdatedAt,
            Companies = companies,
            Doctors = group.GroupDoctors.Select(d => new
            {
                d.Id,
                d.DoctorId,
                DoctorFullName = d.Doctor != null ? $"Dott. {d.Doctor.FirstName} {d.Doctor.LastName}" : $"Medico #{d.DoctorId}",
                Role = d.Role.ToString(),
                d.IsActive,
                d.AssignedAt,
                d.UntilDate,
                d.Notes
            }),
            Protocols = group.GroupProtocols.Select(p => new
            {
                p.Id,
                p.ProtocolId,
                ProtocolName = p.Protocol != null ? p.Protocol.Name : $"Protocollo #{p.ProtocolId}",
                p.IsMandatory,
                p.FrequencyOverride,
                p.FrequencyMonthsOverride,
                p.Notes
            }),
            RiskFactors = group.GroupRiskFactors.Select(r => new
            {
                r.Id,
                r.RiskFactorId,
                RiskFactorName = r.RiskFactor != null ? r.RiskFactor.Name : $"Rischio #{r.RiskFactorId}",
                Level = r.Level.ToString(),
                r.AppliesToAllCompanies,
                r.SpecificCompanyIds,
                r.Notes
            }),
            BillingConfigs = group.GroupBillingConfigs.Select(b => new
            {
                b.Id,
                b.Name,
                Frequency = b.Frequency.ToString(),
                b.FixedFee,
                b.PerVisitFee,
                b.PerEmployeeFee,
                b.PaymentTermsDays,
                b.PaymentMethod,
                b.IBAN,
                b.IsActive
            })
        });
    }

    [HttpPost]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> Create([FromBody] CompanyGroup request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Il nome del gruppo aziendale è obbligatorio." });

        request.TenantId = GetTenantId();
        request.CreatedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;
        _db.CompanyGroups.Add(request);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = request.Id }, request);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> Update(int id, [FromBody] CompanyGroup request)
    {
        var tenantId = GetTenantId();
        var entity = await _db.CompanyGroups.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity == null)
            return NotFound(new { message = $"Gruppo aziendale {id} non trovato." });

        entity.Name = request.Name;
        entity.LegalName = request.LegalName;
        entity.Address = request.Address;
        entity.City = request.City;
        entity.PostalCode = request.PostalCode;
        entity.Province = request.Province;
        entity.VATNumber = request.VATNumber;
        entity.TaxCode = request.TaxCode;
        entity.Type = request.Type;
        entity.Status = request.Status;
        entity.LegalForm = request.LegalForm;
        entity.ShareCapital = request.ShareCapital;
        entity.RegistrationNumber = request.RegistrationNumber;
        entity.PEC = request.PEC;
        entity.ContactEmail = request.ContactEmail;
        entity.ContactPhone = request.ContactPhone;
        entity.PropagateProtocols = request.PropagateProtocols;
        entity.PropagateRiskFactors = request.PropagateRiskFactors;
        entity.PropagateDoctors = request.PropagateDoctors;
        entity.PropagateVisitSchedules = request.PropagateVisitSchedules;
        entity.ConsolidatedBilling = request.ConsolidatedBilling;
        entity.LegalRepresentative = request.LegalRepresentative;
        entity.LegalRepTaxCode = request.LegalRepTaxCode;
        entity.RSPPGroup = request.RSPPGroup;
        entity.MedicoCompetenteGroup = request.MedicoCompetenteGroup;
        entity.LastComplianceReview = request.LastComplianceReview;
        entity.ComplianceNotes = request.ComplianceNotes;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var tenantId = GetTenantId();
        var entity = await _db.CompanyGroups.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (entity == null)
            return NotFound(new { message = $"Gruppo aziendale {id} non trovato." });

        var linkedCompanies = await _db.Companies.Where(c => c.CompanyGroupId == id && c.TenantId == tenantId).ToListAsync();
        foreach (var c in linkedCompanies)
        {
            c.CompanyGroupId = null;
        }

        _db.CompanyGroups.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // =========================================================================
    // 2. Capability #1: Group Dashboard (Aggregated KPIs)
    // =========================================================================

    [HttpGet("{id:int}/dashboard")]
    public async Task<IActionResult> GetDashboard(int id)
    {
        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);
        if (group == null)
            return NotFound(new { message = $"Gruppo aziendale {id} non trovato." });

        var today = DateTime.UtcNow.Date;
        var in60Days = today.AddDays(60);

        var companies = await _db.Companies
            .AsNoTracking()
            .Where(c => c.CompanyGroupId == id && c.TenantId == tenantId)
            .ToListAsync();

        var companyIds = companies.Select(c => c.Id).ToList();

        var branchesCount = await _db.Branches
            .AsNoTracking()
            .CountAsync(b => companyIds.Contains(b.CompanyId) && b.TenantId == tenantId);

        var employees = await _db.Employees
            .AsNoTracking()
            .Where(e => companyIds.Contains(e.CompanyId) && e.TenantId == tenantId)
            .ToListAsync();

        var employeeIds = employees.Select(e => e.Id).ToList();

        // Visits due in next 60 days
        var visitsDue = await _db.MedicalVisits
            .AsNoTracking()
            .CountAsync(v => employeeIds.Contains(v.EmployeeId) && v.TenantId == tenantId && v.NextDeadlineDate.Date >= today && v.NextDeadlineDate.Date <= in60Days);

        // Visits overdue
        var visitsOverdue = await _db.MedicalVisits
            .AsNoTracking()
            .CountAsync(v => employeeIds.Contains(v.EmployeeId) && v.TenantId == tenantId && v.NextDeadlineDate.Date < today);

        // Site visits due (within 60 days or overdue)
        var siteVisitsDue = await _db.SiteVisits
            .AsNoTracking()
            .CountAsync(s => companyIds.Contains(s.CompanyId) && s.TenantId == tenantId && (s.NextDueDate == null || s.NextDueDate.Value.Date <= in60Days));

        // Nominations due: companies with no active CompanyDoctor
        var nominatedCompanyIds = await _db.CompanyDoctors
            .AsNoTracking()
            .Where(cd => companyIds.Contains(cd.CompanyId) && cd.IsActive && cd.TenantId == tenantId)
            .Select(cd => cd.CompanyId)
            .Distinct()
            .ToListAsync();

        var nominationsDue = companyIds.Count(cid => !nominatedCompanyIds.Contains(cid));

        // Vaccination deadlines due within 60 days or overdue
        var vaccinationDeadlines = await _db.Vaccinations
            .AsNoTracking()
            .CountAsync(v => employeeIds.Contains(v.EmployeeId) && v.TenantId == tenantId && v.NextDueDate.HasValue && v.NextDueDate.Value.Date <= in60Days);

        // Active protocols count: group protocols + distinct job role protocols for group workers
        var groupProtocolCount = await _db.GroupProtocols.CountAsync(gp => gp.CompanyGroupId == id);
        var activeProtocolsCount = groupProtocolCount > 0 ? groupProtocolCount : await _db.Protocols.CountAsync(p => p.TenantId == tenantId);

        // Missing records (employees without medical records)
        var employeesWithRecords = await _db.MedicalRecords
            .AsNoTracking()
            .Where(mr => employeeIds.Contains(mr.EmployeeId) && mr.TenantId == tenantId)
            .Select(mr => mr.EmployeeId)
            .Distinct()
            .ToListAsync();
        var missingRecordsCount = employeeIds.Count(eid => !employeesWithRecords.Contains(eid));

        // Overdue activities
        var overdueActivities = await _db.ActivityDeadlines
            .AsNoTracking()
            .CountAsync(a => companyIds.Contains(a.CompanyId) && a.TenantId == tenantId && a.DeadlineDate.Date < today && a.Status != "Done");

        // Total compliance alerts
        var complianceAlerts = visitsOverdue + nominationsDue + missingRecordsCount + overdueActivities;

        // Calculate overall compliance score (100 - penalties)
        var totalWorkforce = Math.Max(1, employees.Count);
        var complianceScore = Math.Max(0, Math.Min(100, 100 - (visitsOverdue * 10 / totalWorkforce * 10) - (nominationsDue * 20) - (missingRecordsCount * 5 / totalWorkforce * 10)));

        // Company breakdown comparison matrix
        var companyBreakdown = new List<object>();
        foreach (var c in companies)
        {
            var cEmployees = employees.Where(e => e.CompanyId == c.Id).ToList();
            var cEmpIds = cEmployees.Select(e => e.Id).ToList();
            var cVisitsDue = await _db.MedicalVisits.CountAsync(v => cEmpIds.Contains(v.EmployeeId) && v.TenantId == tenantId && v.NextDeadlineDate.Date >= today && v.NextDeadlineDate.Date <= in60Days);
            var cVisitsOverdue = await _db.MedicalVisits.CountAsync(v => cEmpIds.Contains(v.EmployeeId) && v.TenantId == tenantId && v.NextDeadlineDate.Date < today);
            var cHasMc = nominatedCompanyIds.Contains(c.Id);
            var cScore = Math.Max(20, Math.Min(100, 100 - (cVisitsOverdue * 15) - (cHasMc ? 0 : 30)));

            companyBreakdown.Add(new
            {
                c.Id,
                c.Name,
                c.LegalName,
                c.VATNumber,
                City = c.OperationalCity ?? c.LegalCity ?? "-",
                EmployeesCount = cEmployees.Count,
                VisitsDue = cVisitsDue,
                VisitsOverdue = cVisitsOverdue,
                HasMcNomination = cHasMc,
                ComplianceScore = cScore,
                RiskClass = c.RiskClass ?? "Medio"
            });
        }

        return Ok(new
        {
            group.Id,
            group.Name,
            Type = group.Type.ToString(),
            Status = group.Status.ToString(),
            CompaniesCount = companies.Count,
            BranchesCount = branchesCount,
            EmployeesCount = employees.Count,
            ActiveProtocolsCount = activeProtocolsCount,
            VisitsDue = visitsDue,
            VisitsOverdue = visitsOverdue,
            SiteVisitsDue = siteVisitsDue,
            NominationsDue = nominationsDue,
            VaccinationDeadlines = vaccinationDeadlines,
            MissingRecords = missingRecordsCount,
            OverdueActivities = overdueActivities,
            ComplianceAlerts = complianceAlerts,
            ComplianceScore = complianceScore,
            CompanyBreakdown = companyBreakdown
        });
    }

    // =========================================================================
    // 3. Capability #2: Unified Deadlines
    // =========================================================================

    public sealed record UnifiedDeadlineItem(
        int Id,
        string Type,
        string TypeLabel,
        string Title,
        int CompanyId,
        string CompanyName,
        int? EmployeeId,
        string? EmployeeName,
        int? DoctorId,
        string? DoctorName,
        DateTime DueDate,
        bool IsOverdue,
        int DaysRemaining,
        string Status,
        string Severity,
        string? RiskProfile
    );

    [HttpGet("{id:int}/deadlines")]
    public async Task<IActionResult> GetDeadlines(
        int id,
        [FromQuery] string? type = "all",
        [FromQuery] int? companyId = null,
        [FromQuery] int? physicianId = null,
        [FromQuery] string? riskProfile = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);
        if (group == null)
            return NotFound(new { message = $"Gruppo aziendale {id} non trovato." });

        var today = DateTime.UtcNow.Date;

        var groupCompanies = await _db.Companies
            .AsNoTracking()
            .Where(c => c.CompanyGroupId == id && c.TenantId == tenantId)
            .ToDictionaryAsync(c => c.Id, c => c.Name);

        var companyIds = companyId.HasValue && groupCompanies.ContainsKey(companyId.Value)
            ? new List<int> { companyId.Value }
            : groupCompanies.Keys.ToList();

        var deadlines = new List<UnifiedDeadlineItem>();

        // 1. Medical Visit deadlines
        if (type == "all" || type == "visit")
        {
            var visitsQuery = _db.MedicalVisits
                .AsNoTracking()
                .Include(v => v.Employee)
                    .ThenInclude(e => e.Company)
                .Include(v => v.Doctor)
                .Where(v => v.TenantId == tenantId && v.Employee != null && companyIds.Contains(v.Employee.CompanyId));

            if (physicianId.HasValue)
                visitsQuery = visitsQuery.Where(v => v.DoctorId == physicianId.Value);

            var visits = await visitsQuery
                .OrderBy(v => v.NextDeadlineDate)
                .Take(200)
                .ToListAsync();

            foreach (var v in visits)
            {
                var daysRemaining = (v.NextDeadlineDate.Date - today).Days;
                var isOverdue = daysRemaining < 0;
                var itemSeverity = isOverdue ? "critical" : (daysRemaining <= 15 ? "high" : (daysRemaining <= 45 ? "medium" : "low"));
                var itemStatus = isOverdue ? "Scaduta" : (daysRemaining <= 30 ? "In Scadenza" : "Pianificata");

                deadlines.Add(new UnifiedDeadlineItem(
                    v.Id,
                    "visit",
                    "Visita Periodica",
                    $"Visita {v.VisitType} - {v.Employee?.LastName} {v.Employee?.FirstName}",
                    v.Employee?.CompanyId ?? 0,
                    v.Employee?.Company?.Name ?? "Azienda",
                    v.EmployeeId,
                    v.Employee != null ? $"{v.Employee.LastName} {v.Employee.FirstName}" : null,
                    v.DoctorId,
                    v.Doctor != null ? $"Dott. {v.Doctor.FirstName} {v.Doctor.LastName}" : null,
                    v.NextDeadlineDate,
                    isOverdue,
                    daysRemaining,
                    itemStatus,
                    itemSeverity,
                    v.Employee?.JobRole
                ));
            }
        }

        // 2. Activity deadlines (Art. 40, Art. 35)
        if (type == "all" || type == "activity")
        {
            var activities = await _db.ActivityDeadlines
                .AsNoTracking()
                .Include(a => a.Company)
                .Where(a => a.TenantId == tenantId && companyIds.Contains(a.CompanyId))
                .OrderBy(a => a.DeadlineDate)
                .Take(100)
                .ToListAsync();

            foreach (var a in activities)
            {
                var daysRemaining = (a.DeadlineDate.Date - today).Days;
                var isOverdue = daysRemaining < 0;
                var itemSeverity = isOverdue ? "critical" : (daysRemaining <= 30 ? "high" : "medium");

                deadlines.Add(new UnifiedDeadlineItem(
                    a.Id,
                    "activity",
                    "Attività Obbligatoria",
                    a.ActivityType,
                    a.CompanyId,
                    a.Company?.Name ?? "Gruppo",
                    null,
                    null,
                    null,
                    null,
                    a.DeadlineDate,
                    isOverdue,
                    daysRemaining,
                    a.Status ?? (isOverdue ? "In Ritardo" : "In Corso"),
                    itemSeverity,
                    "D.Lgs 81/08"
                ));
            }
        }

        // 3. Site visit deadlines (Sopralluoghi)
        if (type == "all" || type == "site-visit")
        {
            var siteVisits = await _db.SiteVisits
                .AsNoTracking()
                .Include(s => s.Company)
                .Include(s => s.Doctor)
                .Where(s => s.TenantId == tenantId && companyIds.Contains(s.CompanyId))
                .OrderBy(s => s.NextDueDate ?? s.VisitDate.AddYears(1))
                .Take(100)
                .ToListAsync();

            foreach (var s in siteVisits)
            {
                var dueDate = s.NextDueDate ?? s.VisitDate.AddYears(1);
                var daysRemaining = (dueDate.Date - today).Days;
                var isOverdue = daysRemaining < 0;
                var itemSeverity = isOverdue ? "critical" : (daysRemaining <= 30 ? "high" : "low");

                deadlines.Add(new UnifiedDeadlineItem(
                    s.Id,
                    "site-visit",
                    "Sopralluogo Art. 25",
                    $"Sopralluogo {s.VisitedStructure} ({s.Company?.Name})",
                    s.CompanyId,
                    s.Company?.Name ?? "Azienda",
                    null,
                    null,
                    s.DoctorId,
                    s.Doctor != null ? $"Dott. {s.Doctor.FirstName} {s.Doctor.LastName}" : s.DoctorName,
                    dueDate,
                    isOverdue,
                    daysRemaining,
                    isOverdue ? "Overdue" : "Pianificato",
                    itemSeverity,
                    s.Location
                ));
            }
        }

        // 4. Nominations deadlines
        if (type == "all" || type == "nomination")
        {
            var nominations = await _db.CompanyNominations
                .AsNoTracking()
                .Include(n => n.Company)
                .Include(n => n.Employee)
                .Where(n => n.TenantId == tenantId && companyIds.Contains(n.CompanyId))
                .OrderBy(n => n.CertificationExpiry ?? n.CreatedAt.AddYears(1))
                .Take(100)
                .ToListAsync();

            foreach (var n in nominations)
            {
                var dueDate = n.CertificationExpiry ?? n.CreatedAt.AddYears(1);
                var daysRemaining = (dueDate.Date - today).Days;
                var isOverdue = daysRemaining < 0;

                deadlines.Add(new UnifiedDeadlineItem(
                    n.Id,
                    "nomination",
                    "Nomina D.Lgs 81/08",
                    $"Nomina {n.RoleName} - {n.Company?.Name}",
                    n.CompanyId,
                    n.Company?.Name ?? "Azienda",
                    n.EmployeeId,
                    n.Employee != null ? $"{n.Employee.LastName} {n.Employee.FirstName}" : null,
                    null,
                    null,
                    dueDate,
                    isOverdue,
                    daysRemaining,
                    n.Status ?? "Valid",
                    isOverdue ? "critical" : "medium",
                    n.RoleName
                ));
            }
        }

        // 5. Vaccination deadlines
        if (type == "all" || type == "vaccination")
        {
            var vaccinations = await _db.Vaccinations
                .AsNoTracking()
                .Include(vac => vac.Employee)
                    .ThenInclude(e => e.Company)
                .Where(vac => vac.TenantId == tenantId && vac.Employee != null && companyIds.Contains(vac.Employee.CompanyId) && vac.NextDueDate.HasValue)
                .OrderBy(vac => vac.NextDueDate)
                .Take(100)
                .ToListAsync();

            foreach (var vac in vaccinations)
            {
                var dueDate = vac.NextDueDate!.Value;
                var daysRemaining = (dueDate.Date - today).Days;
                var isOverdue = daysRemaining < 0;

                deadlines.Add(new UnifiedDeadlineItem(
                    vac.Id,
                    "vaccination",
                    "Richiamo Vaccino",
                    $"Richiamo {vac.VaccineName} - {vac.Employee?.LastName} {vac.Employee?.FirstName}",
                    vac.Employee?.CompanyId ?? 0,
                    vac.Employee?.Company?.Name ?? "Azienda",
                    vac.EmployeeId,
                    vac.Employee != null ? $"{vac.Employee.LastName} {vac.Employee.FirstName}" : null,
                    null,
                    null,
                    dueDate,
                    isOverdue,
                    daysRemaining,
                    isOverdue ? "Scaduto" : "In Scadenza",
                    isOverdue ? "high" : "low",
                    vac.VaccineName
                ));
            }
        }

        // Apply in-memory filtering for search, status, and risk profile
        var result = deadlines.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLowerInvariant();
            result = result.Where(d =>
                d.Title.ToLowerInvariant().Contains(s) ||
                d.CompanyName.ToLowerInvariant().Contains(s) ||
                (d.EmployeeName != null && d.EmployeeName.ToLowerInvariant().Contains(s)) ||
                (d.DoctorName != null && d.DoctorName.ToLowerInvariant().Contains(s))
            );
        }

        if (status == "overdue")
            result = result.Where(d => d.IsOverdue);
        else if (status == "due")
            result = result.Where(d => !d.IsOverdue && d.DaysRemaining <= 60);

        if (!string.IsNullOrWhiteSpace(riskProfile))
        {
            var rp = riskProfile.Trim().ToLowerInvariant();
            result = result.Where(d => d.RiskProfile != null && d.RiskProfile.ToLowerInvariant().Contains(rp));
        }

        var sortedResult = result.OrderBy(d => d.DueDate).ToList();
        return Ok(sortedResult);
    }

    // =========================================================================
    // 4. Capability #3: Unified Workforce View
    // =========================================================================

    [HttpGet("{id:int}/employees")]
    public async Task<IActionResult> GetEmployees(
        int id,
        [FromQuery] int? companyId = null,
        [FromQuery] int? physicianId = null,
        [FromQuery] int? protocolId = null,
        [FromQuery] string? riskProfile = null,
        [FromQuery] string? status = null,
        [FromQuery] string? fitnessStatus = null,
        [FromQuery] string? search = null)
    {
        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);
        if (group == null)
            return NotFound(new { message = $"Gruppo aziendale {id} non trovato." });

        var groupCompanyIds = await _db.Companies
            .AsNoTracking()
            .Where(c => c.CompanyGroupId == id && c.TenantId == tenantId)
            .Select(c => c.Id)
            .ToListAsync();

        var query = _db.Employees
            .AsNoTracking()
            .Include(e => e.Company)
            .Include(e => e.Branch)
            .Include(e => e.JobRoleNavigation)
            .Include(e => e.MedicalVisits)
            .Include(e => e.EmployeeRisks)
                .ThenInclude(er => er.RiskFactor)
            .Include(e => e.PersonalProtocols)
                .ThenInclude(pp => pp.Protocol)
            .Where(e => e.TenantId == tenantId && groupCompanyIds.Contains(e.CompanyId));

        if (companyId.HasValue && companyId.Value > 0)
            query = query.Where(e => e.CompanyId == companyId.Value);

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
        {
            if (status == "active")
                query = query.Where(e => e.IsActive);
            else if (status == "inactive")
                query = query.Where(e => !e.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLowerInvariant();
            query = query.Where(e =>
                e.FirstName.ToLower().Contains(s) ||
                e.LastName.ToLower().Contains(s) ||
                e.TaxCode.ToLower().Contains(s) ||
                (e.JobRole != null && e.JobRole.ToLower().Contains(s)) ||
                (e.Company != null && e.Company.Name.ToLower().Contains(s))
            );
        }

        var employees = await query.ToListAsync();

        var companyDoctors = await _db.CompanyDoctors
            .AsNoTracking()
            .Include(cd => cd.Doctor)
            .Where(cd => groupCompanyIds.Contains(cd.CompanyId) && cd.IsActive && cd.TenantId == tenantId)
            .ToListAsync();

        var doctorByCompany = companyDoctors
            .GroupBy(cd => cd.CompanyId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.IsCoordinator).First());

        var today = DateTime.UtcNow.Date;

        var items = employees.Select(e =>
        {
            var lastVisit = e.MedicalVisits.OrderByDescending(v => v.VisitDate).FirstOrDefault();
            var nextDeadline = lastVisit?.NextDeadlineDate;
            var daysRemaining = nextDeadline.HasValue ? (nextDeadline.Value.Date - today).Days : (int?)null;

            var outcome = lastVisit?.Outcome ?? "Nessuna visita";
            var outcomeCode = lastVisit?.OutcomeCode;

            string fitClass = "none";
            string fitLabel = "Senza idoneità";
            if (!string.IsNullOrWhiteSpace(outcomeCode))
            {
                if (outcomeCode == "NONIDONE0") { fitClass = "not-fit"; fitLabel = "Non idoneo"; }
                else if (outcomeCode == "IDONE0L") { fitClass = "partial"; fitLabel = "Con limitazioni"; }
                else if (outcomeCode == "IDONE0P") { fitClass = "partial"; fitLabel = "Con prescrizioni"; }
                else if (outcomeCode == "IDONE0") { fitClass = "fit"; fitLabel = "Idoneo"; }
                else if (outcomeCode == "INATTESA") { fitClass = "pending"; fitLabel = "In attesa"; }
            }
            else if (!string.IsNullOrWhiteSpace(outcome) && outcome != "Nessuna visita")
            {
                var oLower = outcome.ToLowerInvariant();
                if (oLower.Contains("non idone")) { fitClass = "not-fit"; fitLabel = "Non idoneo"; }
                else if (oLower.Contains("limit") || oLower.Contains("prescr") || oLower.Contains("parzial")) { fitClass = "partial"; fitLabel = "Parz. idoneo"; }
                else if (oLower.Contains("idone")) { fitClass = "fit"; fitLabel = "Idoneo"; }
            }

            doctorByCompany.TryGetValue(e.CompanyId, out var cd);
            var assignedDoctor = lastVisit?.DoctorId != null
                ? lastVisit.DoctorId
                : cd?.DoctorId;
            var assignedDoctorName = lastVisit?.Doctor != null
                ? $"Dott. {lastVisit.Doctor.FirstName} {lastVisit.Doctor.LastName}"
                : (cd?.Doctor != null ? $"Dott. {cd.Doctor.FirstName} {cd.Doctor.LastName}" : "Non assegnato");

            var risks = e.EmployeeRisks.Select(r => r.RiskFactor?.Name ?? "Rischio").ToList();
            var protocols = e.PersonalProtocols.Select(p => p.Protocol?.Name ?? "Protocollo").ToList();
            if (!protocols.Any() && !string.IsNullOrWhiteSpace(e.JobRole))
            {
                protocols.Add($"Protocollo {e.JobRole}");
            }

            return new
            {
                e.Id,
                e.FirstName,
                e.LastName,
                FullName = $"{e.LastName} {e.FirstName}",
                e.TaxCode,
                e.JobRole,
                e.Gender,
                e.BirthDate,
                e.PersonalEmail,
                e.PhoneNumber,
                e.IsActive,
                CompanyId = e.CompanyId,
                CompanyName = e.Company?.Name ?? "Azienda",
                BranchId = e.BranchId,
                BranchCity = e.Branch?.City ?? "-",
                LastVisitDate = lastVisit?.VisitDate,
                NextDeadlineDate = nextDeadline,
                DaysRemaining = daysRemaining,
                IsOverdue = daysRemaining.HasValue && daysRemaining.Value < 0,
                Outcome = outcome,
                OutcomeCode = outcomeCode,
                FitnessClass = fitClass,
                FitnessLabel = fitLabel,
                AssignedDoctorId = assignedDoctor,
                AssignedDoctorName = assignedDoctorName,
                Risks = risks,
                Protocols = protocols
            };
        });

        var filtered = items.AsEnumerable();

        if (physicianId.HasValue && physicianId.Value > 0)
        {
            filtered = filtered.Where(x => x.AssignedDoctorId == physicianId.Value);
        }

        if (!string.IsNullOrWhiteSpace(fitnessStatus) && fitnessStatus != "all")
        {
            filtered = filtered.Where(x => x.FitnessClass == fitnessStatus);
        }

        if (!string.IsNullOrWhiteSpace(riskProfile))
        {
            var rp = riskProfile.Trim().ToLowerInvariant();
            filtered = filtered.Where(x => x.Risks.Any(r => r.ToLowerInvariant().Contains(rp)));
        }

        return Ok(filtered.OrderBy(x => x.CompanyName).ThenBy(x => x.LastName).ToList());
    }

    // =========================================================================
    // 5. Capability #4: Planning Workspace & Bulk Actions
    // =========================================================================

    [HttpGet("{id:int}/planning-candidates")]
    public async Task<IActionResult> GetPlanningCandidates(
        int id,
        [FromQuery] int? companyId = null,
        [FromQuery] int? branchId = null,
        [FromQuery] int? physicianId = null,
        [FromQuery] int? withinDays = 60)
    {
        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);
        if (group == null)
            return NotFound(new { message = $"Gruppo aziendale {id} non trovato." });

        var groupCompanyIds = await _db.Companies
            .AsNoTracking()
            .Where(c => c.CompanyGroupId == id && c.TenantId == tenantId)
            .Select(c => c.Id)
            .ToListAsync();

        var maxDate = DateTime.UtcNow.Date.AddDays(withinDays ?? 60);

        var query = _db.Employees
            .AsNoTracking()
            .Include(e => e.Company)
            .Include(e => e.Branch)
            .Include(e => e.MedicalVisits)
            .Where(e => e.TenantId == tenantId && e.IsActive && groupCompanyIds.Contains(e.CompanyId));

        if (companyId.HasValue && companyId.Value > 0)
            query = query.Where(e => e.CompanyId == companyId.Value);

        if (branchId.HasValue && branchId.Value > 0)
            query = query.Where(e => e.BranchId == branchId.Value);

        var candidates = await query.ToListAsync();

        var result = candidates
            .Select(e =>
            {
                var lastVisit = e.MedicalVisits.OrderByDescending(v => v.VisitDate).FirstOrDefault();
                var nextDate = lastVisit?.NextDeadlineDate ?? DateTime.UtcNow.Date;
                var isOverdue = nextDate < DateTime.UtcNow.Date;
                return new
                {
                    e.Id,
                    FullName = $"{e.LastName} {e.FirstName}",
                    e.TaxCode,
                    e.JobRole,
                    e.CompanyId,
                    CompanyName = e.Company?.Name ?? "Azienda",
                    e.BranchId,
                    BranchCity = e.Branch?.City ?? "-",
                    LastVisitDate = lastVisit?.VisitDate,
                    NextDeadlineDate = nextDate,
                    IsOverdue = isOverdue,
                    NeedsPlanning = isOverdue || nextDate <= maxDate
                };
            })
            .Where(x => x.NeedsPlanning)
            .OrderBy(x => x.NextDeadlineDate)
            .ToList();

        return Ok(result);
    }

    public sealed record BulkPlanVisitsRequest(
        List<int> EmployeeIds,
        int? DoctorId,
        DateTime ScheduledDate,
        string VisitType,
        string? Notes
    );

    [HttpPost("{id:int}/bulk-plan-visits")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> BulkPlanVisits(int id, [FromBody] BulkPlanVisitsRequest request)
    {
        if (request.EmployeeIds == null || !request.EmployeeIds.Any())
            return BadRequest(new { message = "Selezionare almeno un lavoratore per la pianificazione." });

        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);
        if (group == null)
            return NotFound(new { message = $"Gruppo aziendale {id} non trovato." });

        var doctorId = request.DoctorId;
        if (!doctorId.HasValue)
        {
            var defaultDoc = await _db.Doctors.FirstOrDefaultAsync(d => d.TenantId == tenantId);
            doctorId = defaultDoc?.Id;
        }

        var plannedVisits = new List<MedicalVisit>();
        var scheduledDate = request.ScheduledDate == default ? DateTime.UtcNow.AddDays(7) : request.ScheduledDate;
        var nextDeadline = scheduledDate.AddYears(1);

        var visitType = MedicalVisitType.Periodic;
        if (Enum.TryParse<MedicalVisitType>(request.VisitType, true, out var parsedType))
            visitType = parsedType;

        foreach (var empId in request.EmployeeIds)
        {
            plannedVisits.Add(new MedicalVisit
            {
                TenantId = tenantId,
                EmployeeId = empId,
                DoctorId = doctorId,
                VisitDate = scheduledDate,
                NextDeadlineDate = nextDeadline,
                VisitType = visitType,
                Outcome = "In attesa di visita",
                OutcomeCode = "INATTESA",
                ClinicalNotes = request.Notes ?? "Pianificata massivamente da Centro Gruppi Aziendali",
                CreatedAt = DateTime.UtcNow
            });
        }

        _db.MedicalVisits.AddRange(plannedVisits);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = $"{plannedVisits.Count} visite pianificate con successo per la data {scheduledDate:dd/MM/yyyy}.",
            count = plannedVisits.Count
        });
    }

    public sealed record BulkPlanCampaignRequest(
        string Title,
        List<int> CompanyIds,
        int? ProtocolId,
        int TargetMonths,
        int? DoctorId,
        string? Description
    );

    [HttpPost("{id:int}/bulk-plan-campaign")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> BulkPlanCampaign(int id, [FromBody] BulkPlanCampaignRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "Il titolo della campagna è obbligatorio." });

        var tenantId = GetTenantId();
        var targetCompanies = request.CompanyIds != null && request.CompanyIds.Any()
            ? request.CompanyIds
            : await _db.Companies.Where(c => c.CompanyGroupId == id && c.TenantId == tenantId).Select(c => c.Id).ToListAsync();

        var activitiesCreated = new List<ActivityDeadline>();
        var dueDate = DateTime.UtcNow.AddMonths(request.TargetMonths > 0 ? request.TargetMonths : 1);

        foreach (var cId in targetCompanies)
        {
            activitiesCreated.Add(new ActivityDeadline
            {
                TenantId = tenantId,
                CompanyId = cId,
                ActivityType = $"Campagna: {request.Title}",
                DeadlineDate = dueDate,
                Status = "To Do",
                Notes = request.Description,
                CreatedAt = DateTime.UtcNow
            });
        }

        _db.ActivityDeadlines.AddRange(activitiesCreated);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = $"Campagna '{request.Title}' attivata con successo su {activitiesCreated.Count} aziende del gruppo.",
            companiesCount = activitiesCreated.Count
        });
    }

    public sealed record BulkPlanSiteVisitsRequest(
        List<int> CompanyIds,
        int? DoctorId,
        DateTime TargetDate,
        string Structure,
        string? Notes
    );

    [HttpPost("{id:int}/bulk-plan-site-visits")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> BulkPlanSiteVisits(int id, [FromBody] BulkPlanSiteVisitsRequest request)
    {
        var tenantId = GetTenantId();
        var companies = request.CompanyIds != null && request.CompanyIds.Any()
            ? request.CompanyIds
            : await _db.Companies.Where(c => c.CompanyGroupId == id && c.TenantId == tenantId).Select(c => c.Id).ToListAsync();

        var doctorId = request.DoctorId;
        if (!doctorId.HasValue)
        {
            var defaultDoc = await _db.Doctors.FirstOrDefaultAsync(d => d.TenantId == tenantId);
            doctorId = defaultDoc?.Id;
        }

        var doctorName = doctorId.HasValue
            ? (await _db.Doctors.FirstOrDefaultAsync(d => d.Id == doctorId.Value))?.FirstName
            : "Medico Competente";

        var siteVisits = new List<SiteVisit>();
        var targetDate = request.TargetDate == default ? DateTime.UtcNow.AddMonths(1) : request.TargetDate;

        foreach (var cId in companies)
        {
            siteVisits.Add(new SiteVisit
            {
                TenantId = tenantId,
                CompanyId = cId,
                DoctorId = doctorId,
                DoctorName = doctorName,
                VisitedStructure = string.IsNullOrWhiteSpace(request.Structure) ? "Stabilimento / Sede Operativa" : request.Structure,
                VisitDate = targetDate,
                NextDueDate = targetDate.AddYears(1),
                Frequency = "Annuale (D.Lgs 81/08 art. 25)",
                Notes = request.Notes ?? "Sopralluogo congiunto di gruppo pianificato",
                Outcome = "In Programma",
                CreatedAt = DateTime.UtcNow
            });
        }

        _db.SiteVisits.AddRange(siteVisits);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = $"{siteVisits.Count} sopralluoghi pianificati con successo per le aziende del gruppo.",
            count = siteVisits.Count
        });
    }

    // =========================================================================
    // 6. Capability #5: Compliance Workspace (D.Lgs 81/08 Radar)
    // =========================================================================

    [HttpGet("{id:int}/compliance")]
    public async Task<IActionResult> GetCompliance(int id)
    {
        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);
        if (group == null)
            return NotFound(new { message = $"Gruppo aziendale {id} non trovato." });

        var today = DateTime.UtcNow.Date;

        var companies = await _db.Companies
            .AsNoTracking()
            .Where(c => c.CompanyGroupId == id && c.TenantId == tenantId)
            .ToListAsync();

        var companyIds = companies.Select(c => c.Id).ToList();

        var employees = await _db.Employees
            .AsNoTracking()
            .Where(e => companyIds.Contains(e.CompanyId) && e.TenantId == tenantId)
            .ToListAsync();

        var employeeIds = employees.Select(e => e.Id).ToList();

        // 1. Missing medical records (Cartelle Sanitarie mancanti)
        var employeesWithRecords = await _db.MedicalRecords
            .AsNoTracking()
            .Where(mr => employeeIds.Contains(mr.EmployeeId) && mr.TenantId == tenantId)
            .Select(mr => mr.EmployeeId)
            .Distinct()
            .ToListAsync();

        var missingRecordsList = employees
            .Where(e => !employeesWithRecords.Contains(e.Id))
            .Select(e => new
            {
                e.Id,
                FullName = $"{e.LastName} {e.FirstName}",
                e.TaxCode,
                e.CompanyId,
                CompanyName = companies.FirstOrDefault(c => c.Id == e.CompanyId)?.Name ?? "Azienda",
                Issue = "Cartella Sanitaria 3A non ancora istituita"
            })
            .ToList();

        // 2. Expired visits (Visite scadute)
        var latestVisits = await _db.MedicalVisits
            .AsNoTracking()
            .Where(v => employeeIds.Contains(v.EmployeeId) && v.TenantId == tenantId)
            .GroupBy(v => v.EmployeeId)
            .Select(g => g.OrderByDescending(v => v.VisitDate).First())
            .ToListAsync();

        var expiredVisitsList = latestVisits
            .Where(v => v.NextDeadlineDate.Date < today)
            .Select(v =>
            {
                var emp = employees.FirstOrDefault(e => e.Id == v.EmployeeId);
                var daysOverdue = (today - v.NextDeadlineDate.Date).Days;
                return new
                {
                    v.Id,
                    EmployeeId = v.EmployeeId,
                    FullName = emp != null ? $"{emp.LastName} {emp.FirstName}" : $"Lavoratore #{v.EmployeeId}",
                    CompanyId = emp?.CompanyId ?? 0,
                    CompanyName = companies.FirstOrDefault(c => c.Id == emp?.CompanyId)?.Name ?? "Azienda",
                    v.NextDeadlineDate,
                    DaysOverdue = daysOverdue,
                    Issue = $"Visita periodica scaduta da {daysOverdue} giorni"
                };
            })
            .OrderByDescending(x => x.DaysOverdue)
            .ToList();

        // 3. Missing nominations (Nomina Medico Competente mancante)
        var nominatedCompanyIds = await _db.CompanyDoctors
            .AsNoTracking()
            .Where(cd => companyIds.Contains(cd.CompanyId) && cd.IsActive && cd.TenantId == tenantId)
            .Select(cd => cd.CompanyId)
            .Distinct()
            .ToListAsync();

        var missingNominationsList = companies
            .Where(c => !nominatedCompanyIds.Contains(c.Id))
            .Select(c => new
            {
                c.Id,
                CompanyName = c.Name,
                c.VATNumber,
                Issue = "Nessun Medico Competente nominato per l'azienda (D.Lgs 81/08 art. 18)"
            })
            .ToList();

        // 4. Missing protocols (Lavoratori senza protocollo sanitario assegnato)
        var personalProtocolEmpIds = await _db.PersonalProtocols
            .AsNoTracking()
            .Where(pp => employeeIds.Contains(pp.EmployeeId))
            .Select(pp => pp.EmployeeId)
            .Distinct()
            .ToListAsync();

        var missingProtocolsList = employees
            .Where(e => !personalProtocolEmpIds.Contains(e.Id) && string.IsNullOrWhiteSpace(e.JobRole))
            .Select(e => new
            {
                e.Id,
                FullName = $"{e.LastName} {e.FirstName}",
                e.CompanyId,
                CompanyName = companies.FirstOrDefault(c => c.Id == e.CompanyId)?.Name ?? "Azienda",
                Issue = "Mansione o Protocollo Sanitario non associato al lavoratore"
            })
            .ToList();

        // 5. Overdue activities
        var overdueActivitiesList = await _db.ActivityDeadlines
            .AsNoTracking()
            .Include(a => a.Company)
            .Where(a => companyIds.Contains(a.CompanyId) && a.TenantId == tenantId && a.DeadlineDate.Date < today && a.Status != "Done")
            .Select(a => new
            {
                a.Id,
                a.ActivityType,
                a.CompanyId,
                CompanyName = a.Company != null ? a.Company.Name : "Gruppo",
                a.DeadlineDate,
                DaysOverdue = (today - a.DeadlineDate.Date).Days,
                Issue = $"Attività '{a.ActivityType}' in ritardo di {(today - a.DeadlineDate.Date).Days} giorni"
            })
            .ToListAsync();

        // Actionable remediations list
        var remediations = new List<object>();

        foreach (var item in missingNominationsList)
        {
            remediations.Add(new
            {
                id = $"nomination-{item.Id}",
                category = "Nomine Mediche",
                severity = "CRITICAL",
                title = $"Nomina MC Mancante: {item.CompanyName}",
                description = item.Issue,
                companyId = item.Id,
                actionType = "nominate-doctor",
                actionLabel = "Nomina Medico Gruppo"
            });
        }

        foreach (var item in expiredVisitsList.Take(10))
        {
            remediations.Add(new
            {
                id = $"visit-{item.Id}",
                category = "Visite Periodiche",
                severity = item.DaysOverdue > 90 ? "CRITICAL" : "HIGH",
                title = $"Visita Scaduta: {item.FullName} ({item.CompanyName})",
                description = item.Issue,
                companyId = item.CompanyId,
                employeeId = item.EmployeeId,
                actionType = "plan-visit",
                actionLabel = "Pianifica Subito"
            });
        }

        foreach (var item in missingRecordsList.Take(10))
        {
            remediations.Add(new
            {
                id = $"record-{item.Id}",
                category = "Cartelle Sanitarie",
                severity = "MEDIUM",
                title = $"Cartella Mancante: {item.FullName} ({item.CompanyName})",
                description = item.Issue,
                companyId = item.CompanyId,
                employeeId = item.Id,
                actionType = "create-record",
                actionLabel = "Crea Cartella"
            });
        }

        var totalAnomalies = missingRecordsList.Count + expiredVisitsList.Count + missingNominationsList.Count + missingProtocolsList.Count + overdueActivitiesList.Count;
        var totalWorkers = Math.Max(1, employees.Count);
        var score = Math.Max(10, Math.Min(100, 100 - (expiredVisitsList.Count * 8 / totalWorkers * 10) - (missingNominationsList.Count * 25) - (missingRecordsList.Count * 5 / totalWorkers * 10)));

        return Ok(new
        {
            ComplianceScore = score,
            TotalAnomalies = totalAnomalies,
            MissingRecords = missingRecordsList,
            MissingRecordsCount = missingRecordsList.Count,
            ExpiredVisits = expiredVisitsList,
            ExpiredVisitsCount = expiredVisitsList.Count,
            MissingNominations = missingNominationsList,
            MissingNominationsCount = missingNominationsList.Count,
            MissingProtocols = missingProtocolsList,
            MissingProtocolsCount = missingProtocolsList.Count,
            OverdueActivities = overdueActivitiesList,
            OverdueActivitiesCount = overdueActivitiesList.Count,
            Remediations = remediations
        });
    }

    // =========================================================================
    // 7. Capability #6: Aggregated Reporting & Fitness Judgments
    // =========================================================================

    [HttpGet("{id:int}/reports/aggregated")]
    public async Task<IActionResult> GetAggregatedReport(int id)
    {
        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);
        if (group == null)
            return NotFound(new { message = $"Gruppo aziendale {id} non trovato." });

        var companies = await _db.Companies
            .AsNoTracking()
            .Where(c => c.CompanyGroupId == id && c.TenantId == tenantId)
            .ToListAsync();

        var companyIds = companies.Select(c => c.Id).ToList();

        var employees = await _db.Employees
            .AsNoTracking()
            .Where(e => companyIds.Contains(e.CompanyId) && e.TenantId == tenantId)
            .ToListAsync();

        var employeeIds = employees.Select(e => e.Id).ToList();

        var visits = await _db.MedicalVisits
            .AsNoTracking()
            .Where(v => employeeIds.Contains(v.EmployeeId) && v.TenantId == tenantId)
            .ToListAsync();

        // 1. Worker distributions
        var workersByCompany = companies.Select(c => new
        {
            CompanyId = c.Id,
            CompanyName = c.Name,
            Count = employees.Count(e => e.CompanyId == c.Id)
        }).ToList();

        var workersByJobRole = employees
            .GroupBy(e => string.IsNullOrWhiteSpace(e.JobRole) ? "Non specificata" : e.JobRole)
            .Select(g => new { Role = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToList();

        // 2. Visits summary by type
        var visitsByType = visits
            .GroupBy(v => v.VisitType.ToString())
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToList();

        // 3. Fitness Judgments distribution
        var fitCount = 0;
        var fitWithPrescriptionsCount = 0;
        var fitWithLimitationsCount = 0;
        var tempUnfitCount = 0;
        var permUnfitCount = 0;
        var pendingCount = 0;

        var prescriptionsAndLimitations = new List<object>();

        foreach (var v in visits)
        {
            var code = v.OutcomeCode ?? "";
            var outcome = (v.Outcome ?? "").ToLowerInvariant();

            if (code == "IDONE0" || outcome == "idoneo") fitCount++;
            else if (code == "IDONE0P" || outcome.Contains("prescr")) fitWithPrescriptionsCount++;
            else if (code == "IDONE0L" || outcome.Contains("limit")) fitWithLimitationsCount++;
            else if (code == "NONIDONE0" || outcome.Contains("non idone"))
            {
                if (outcome.Contains("temp")) tempUnfitCount++;
                else permUnfitCount++;
            }
            else pendingCount++;

            if (!string.IsNullOrWhiteSpace(v.Prescriptions) || !string.IsNullOrWhiteSpace(v.Limitations))
            {
                var emp = employees.FirstOrDefault(e => e.Id == v.EmployeeId);
                prescriptionsAndLimitations.Add(new
                {
                    v.Id,
                    EmployeeFullName = emp != null ? $"{emp.LastName} {emp.FirstName}" : $"Lavoratore #{v.EmployeeId}",
                    CompanyName = companies.FirstOrDefault(c => c.Id == emp?.CompanyId)?.Name ?? "Azienda",
                    JobRole = emp?.JobRole ?? "-",
                    Prescriptions = v.Prescriptions ?? "-",
                    Limitations = v.Limitations ?? "-",
                    VisitDate = v.VisitDate,
                    NextReviewDate = v.NextDeadlineDate
                });
            }
        }

        return Ok(new
        {
            group.Id,
            group.Name,
            TotalWorkers = employees.Count,
            TotalVisits = visits.Count,
            WorkersByCompany = workersByCompany,
            WorkersByJobRole = workersByJobRole,
            VisitsByType = visitsByType,
            JudgmentsDistribution = new
            {
                Fit = fitCount,
                FitWithPrescriptions = fitWithPrescriptionsCount,
                FitWithLimitations = fitWithLimitationsCount,
                TemporaryUnfit = tempUnfitCount,
                PermanentUnfit = permUnfitCount,
                Pending = pendingCount
            },
            PrescriptionsAndLimitations = prescriptionsAndLimitations,
            PrescriptionsCount = prescriptionsAndLimitations.Count,
            ComplianceMetrics = new
            {
                VisitAdherencePercentage = visits.Any() ? Math.Round((double)visits.Count(v => v.NextDeadlineDate >= DateTime.UtcNow.Date) / visits.Count * 100, 1) : 100,
                ProtocolCoveragePercentage = employees.Any() ? Math.Round((double)employees.Count(e => !string.IsNullOrWhiteSpace(e.JobRole)) / employees.Count * 100, 1) : 100
            }
        });
    }

    [HttpGet("{id:int}/reports/export")]
    public async Task<IActionResult> ExportReportCsv(int id)
    {
        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);
        if (group == null)
            return NotFound(new { message = $"Gruppo aziendale {id} non trovato." });

        var companies = await _db.Companies.Where(c => c.CompanyGroupId == id && c.TenantId == tenantId).ToListAsync();
        var companyIds = companies.Select(c => c.Id).ToList();

        var employees = await _db.Employees
            .AsNoTracking()
            .Include(e => e.Company)
            .Include(e => e.MedicalVisits)
            .Where(e => companyIds.Contains(e.CompanyId) && e.TenantId == tenantId)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("ID;Cognome;Nome;Codice Fiscale;Azienda;Mansione;Ultima Visita;Esito;Scadenza;Stato");

        foreach (var e in employees)
        {
            var lastVisit = e.MedicalVisits.OrderByDescending(v => v.VisitDate).FirstOrDefault();
            sb.AppendLine($"{e.Id};{e.LastName};{e.FirstName};{e.TaxCode};{e.Company?.Name};{e.JobRole};{lastVisit?.VisitDate:dd/MM/yyyy};{lastVisit?.Outcome ?? "N/D"};{lastVisit?.NextDeadlineDate:dd/MM/yyyy};{(e.IsActive ? "Attivo" : "Inattivo")}");
        }

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return File(bytes, "text/csv; charset=utf-8", $"report_gruppo_{group.Name.Replace(" ", "_")}.csv");
    }

    // =========================================================================
    // 8. Capability #7: Physician Perspective
    // =========================================================================

    [HttpGet("{id:int}/physician-perspective")]
    public async Task<IActionResult> GetPhysicianPerspective(int id, [FromQuery] int? doctorId = null)
    {
        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);
        if (group == null)
            return NotFound(new { message = $"Gruppo aziendale {id} non trovato." });

        var companies = await _db.Companies
            .AsNoTracking()
            .Where(c => c.CompanyGroupId == id && c.TenantId == tenantId)
            .ToListAsync();

        var companyIds = companies.Select(c => c.Id).ToList();

        var allDoctors = await _db.Doctors
            .AsNoTracking()
            .Where(d => d.TenantId == tenantId)
            .ToListAsync();

        var groupDoctors = await _db.GroupDoctors
            .AsNoTracking()
            .Include(gd => gd.Doctor)
            .Where(gd => gd.CompanyGroupId == id)
            .ToListAsync();

        var companyDoctors = await _db.CompanyDoctors
            .AsNoTracking()
            .Include(cd => cd.Doctor)
            .Where(cd => companyIds.Contains(cd.CompanyId) && cd.IsActive && cd.TenantId == tenantId)
            .ToListAsync();

        var today = DateTime.UtcNow.Date;
        var in30Days = today.AddDays(30);

        var workloads = new List<object>();
        foreach (var doc in allDoctors)
        {
            var isGroupDoc = groupDoctors.FirstOrDefault(gd => gd.DoctorId == doc.Id);
            var assignedCompanies = companyDoctors.Where(cd => cd.DoctorId == doc.Id).Select(cd => cd.CompanyId).Distinct().ToList();
            if (isGroupDoc != null && !assignedCompanies.Any())
            {
                assignedCompanies = companyIds;
            }

            var assignedWorkersCount = await _db.Employees
                .AsNoTracking()
                .CountAsync(e => assignedCompanies.Contains(e.CompanyId) && e.TenantId == tenantId);

            var visitsConducted = await _db.MedicalVisits
                .AsNoTracking()
                .CountAsync(v => v.DoctorId == doc.Id && v.TenantId == tenantId);

            var upcomingVisits = await _db.MedicalVisits
                .AsNoTracking()
                .CountAsync(v => v.DoctorId == doc.Id && v.TenantId == tenantId && v.VisitDate.Date >= today && v.VisitDate.Date <= in30Days);

            var pendingJudgments = await _db.MedicalVisits
                .AsNoTracking()
                .CountAsync(v => v.DoctorId == doc.Id && v.TenantId == tenantId && (v.OutcomeCode == null || v.OutcomeCode == "INATTESA"));

            var pendingSiteVisits = await _db.SiteVisits
                .AsNoTracking()
                .CountAsync(s => s.DoctorId == doc.Id && s.TenantId == tenantId && (s.NextDueDate == null || s.NextDueDate.Value.Date <= in30Days));

            workloads.Add(new
            {
                doc.Id,
                DoctorFullName = $"Dott. {doc.FirstName} {doc.LastName}",
                doc.Specialty,
                RoleInGroup = isGroupDoc?.Role.ToString() ?? (assignedCompanies.Any() ? "Medico Competente" : "Collaboratore"),
                AssignedCompaniesCount = assignedCompanies.Count,
                AssignedWorkersCount = assignedWorkersCount,
                VisitsConducted = visitsConducted,
                UpcomingVisitsCount = upcomingVisits,
                PendingJudgmentsCount = pendingJudgments,
                PendingSiteVisitsCount = pendingSiteVisits,
                IsPrimaryCoordinator = isGroupDoc?.Role == GroupDoctorRole.Coordinatore
            });
        }

        var selectedDocId = doctorId.HasValue && doctorId.Value > 0 ? doctorId.Value : allDoctors.FirstOrDefault()?.Id ?? 0;
        var selectedDoc = allDoctors.FirstOrDefault(d => d.Id == selectedDocId);

        var upcomingVisitsList = await _db.MedicalVisits
            .AsNoTracking()
            .Include(v => v.Employee)
                .ThenInclude(e => e.Company)
            .Where(v => v.TenantId == tenantId && (selectedDocId == 0 || v.DoctorId == selectedDocId) && v.Employee != null && companyIds.Contains(v.Employee.CompanyId) && v.VisitDate.Date >= today)
            .OrderBy(v => v.VisitDate)
            .Take(25)
            .Select(v => new
            {
                v.Id,
                v.VisitDate,
                VisitType = v.VisitType.ToString(),
                EmployeeFullName = v.Employee != null ? $"{v.Employee.LastName} {v.Employee.FirstName}" : "-",
                CompanyName = v.Employee != null && v.Employee.Company != null ? v.Employee.Company.Name : "-",
                v.Outcome,
                v.OutcomeCode,
                v.IsSigned
            })
            .ToListAsync();

        return Ok(new
        {
            SelectedDoctor = selectedDoc != null ? new { selectedDoc.Id, FullName = $"Dott. {selectedDoc.FirstName} {selectedDoc.LastName}", selectedDoc.Specialty } : null,
            Workloads = workloads,
            UpcomingSchedule = upcomingVisitsList
        });
    }

    // =========================================================================
    // 9. Governance & Propagation Settings
    // =========================================================================

    [HttpPost("{id:int}/companies")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> AddCompanyToGroup(int id, [FromBody] int companyId)
    {
        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups.FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);
        if (group == null)
            return NotFound(new { message = $"Gruppo {id} non trovato." });

        var company = await _db.Companies.FirstOrDefaultAsync(c => c.Id == companyId && c.TenantId == tenantId);
        if (company == null)
            return NotFound(new { message = $"Azienda {companyId} non trovata." });

        company.CompanyGroupId = id;
        company.UpdatedAt = DateTime.UtcNow;

        var existingMembership = await _db.CompanyGroupMemberships
            .FirstOrDefaultAsync(m => m.CompanyGroupId == id && m.CompanyId == companyId);
        if (existingMembership == null)
        {
            _db.CompanyGroupMemberships.Add(new CompanyGroupMembership
            {
                CompanyGroupId = id,
                CompanyId = companyId,
                JoinedAt = DateTime.UtcNow,
                Status = MembershipStatus.Active
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true, message = $"Azienda '{company.Name}' aggiunta con successo al gruppo." });
    }

    [HttpDelete("{id:int}/companies/{companyId:int}")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> RemoveCompanyFromGroup(int id, int companyId)
    {
        var tenantId = GetTenantId();
        var company = await _db.Companies.FirstOrDefaultAsync(c => c.Id == companyId && c.CompanyGroupId == id && c.TenantId == tenantId);
        if (company == null)
            return NotFound(new { message = $"Azienda {companyId} non trovata nel gruppo {id}." });

        company.CompanyGroupId = null;
        company.UpdatedAt = DateTime.UtcNow;

        var membership = await _db.CompanyGroupMemberships
            .FirstOrDefaultAsync(m => m.CompanyGroupId == id && m.CompanyId == companyId);
        if (membership != null)
        {
            membership.Status = MembershipStatus.Left;
            membership.LeftAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true, message = $"Azienda '{company.Name}' rimossa dal gruppo." });
    }

    [HttpPost("{id:int}/propagate-protocols")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> PropagateProtocols(int id)
    {
        var tenantId = GetTenantId();
        var group = await _db.CompanyGroups
            .Include(g => g.GroupProtocols)
            .FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);

        if (group == null)
            return NotFound(new { message = $"Gruppo {id} non trovato." });

        var companyIds = await _db.Companies
            .Where(c => c.CompanyGroupId == id && c.TenantId == tenantId)
            .Select(c => c.Id)
            .ToListAsync();

        var employees = await _db.Employees
            .Include(e => e.PersonalProtocols)
            .Where(e => companyIds.Contains(e.CompanyId) && e.TenantId == tenantId)
            .ToListAsync();

        var appliedCount = 0;
        foreach (var gp in group.GroupProtocols)
        {
            foreach (var emp in employees)
            {
                if (!emp.PersonalProtocols.Any(p => p.ProtocolId == gp.ProtocolId))
                {
                    _db.PersonalProtocols.Add(new PersonalProtocol
                    {
                        TenantId = tenantId,
                        EmployeeId = emp.Id,
                        ProtocolId = gp.ProtocolId,
                        AssignedAt = DateTime.UtcNow,
                        Notes = "Propagato dal Gruppo Aziendale (D.Lgs 81/08)"
                    });
                    appliedCount++;
                }
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true, message = $"Protocolli di gruppo propagati a {appliedCount} lavoratori delle aziende collegate." });
    }

    [HttpPost("{id:int}/propagate-doctors")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> PropagateDoctors(int id)
    {
        var tenantId = GetTenantId();
        var groupDoctors = await _db.GroupDoctors
            .Where(gd => gd.CompanyGroupId == id && gd.IsActive)
            .ToListAsync();

        if (!groupDoctors.Any())
            return BadRequest(new { message = "Nessun medico configurato a livello di gruppo da propagare." });

        var companyIds = await _db.Companies
            .Where(c => c.CompanyGroupId == id && c.TenantId == tenantId)
            .Select(c => c.Id)
            .ToListAsync();

        var existingCompanyDoctors = await _db.CompanyDoctors
            .Where(cd => companyIds.Contains(cd.CompanyId) && cd.TenantId == tenantId)
            .ToListAsync();

        var addedCount = 0;
        foreach (var cId in companyIds)
        {
            foreach (var gd in groupDoctors)
            {
                if (!existingCompanyDoctors.Any(ecd => ecd.CompanyId == cId && ecd.DoctorId == gd.DoctorId))
                {
                    _db.CompanyDoctors.Add(new CompanyDoctor
                    {
                        TenantId = tenantId,
                        CompanyId = cId,
                        DoctorId = gd.DoctorId,
                        IsCoordinator = gd.Role == GroupDoctorRole.Coordinatore,
                        IsActive = true,
                        AssignedAt = DateTime.UtcNow
                    });
                    addedCount++;
                }
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true, message = $"{addedCount} nomine mediche propagate alle aziende del gruppo." });
    }

    [HttpPost("{id:int}/doctors")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> AddGroupDoctor(int id, [FromBody] GroupDoctor request)
    {
        request.CompanyGroupId = id;
        request.AssignedAt = DateTime.UtcNow;
        _db.GroupDoctors.Add(request);
        await _db.SaveChangesAsync();
        return Ok(request);
    }

    [HttpDelete("{id:int}/doctors/{groupDoctorId:int}")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
    public async Task<IActionResult> RemoveGroupDoctor(int id, int groupDoctorId)
    {
        var item = await _db.GroupDoctors.FirstOrDefaultAsync(gd => gd.Id == groupDoctorId && gd.CompanyGroupId == id);
        if (item == null)
            return NotFound();

        _db.GroupDoctors.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
