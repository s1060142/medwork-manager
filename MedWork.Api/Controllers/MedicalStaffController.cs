using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/medical-staff")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class MedicalStaffController : BaseController
{
    private readonly AppDbContext _dbContext;

    public MedicalStaffController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetStaff(
        [FromQuery] string? search,
        [FromQuery] MedicalStaffRole? role,
        [FromQuery] string? specialty,
        [FromQuery] int? companyId,
        [FromQuery] int? branchId,
        [FromQuery] bool? isActive)
    {
        var tenantId = GetTenantId();
        var query = _dbContext.Doctors
            .AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.CompanyDoctors)
                .ThenInclude(cd => cd.Company)
            .Include(d => d.CompanyDoctors)
                .ThenInclude(cd => cd.Branch)
            .Include(d => d.Absences)
            .Include(d => d.Documents)
            .Where(d => d.TenantId == tenantId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(d =>
                d.FirstName.ToLower().Contains(s) ||
                d.LastName.ToLower().Contains(s) ||
                d.MedicalLicenseNumber.ToLower().Contains(s) ||
                (d.TaxCode != null && d.TaxCode.ToLower().Contains(s)) ||
                (d.Specialty != null && d.Specialty.ToLower().Contains(s)));
        }

        if (role.HasValue)
        {
            query = query.Where(d => d.ProfessionalRole == role.Value);
        }

        if (!string.IsNullOrWhiteSpace(specialty))
        {
            query = query.Where(d => d.Specialty != null && d.Specialty.Contains(specialty));
        }

        if (isActive.HasValue)
        {
            query = query.Where(d => d.IsActive == isActive.Value);
        }

        if (companyId.HasValue && companyId.Value > 0)
        {
            query = query.Where(d => d.CompanyDoctors.Any(cd => cd.CompanyId == companyId.Value && cd.IsActive));
        }

        if (branchId.HasValue && branchId.Value > 0)
        {
            query = query.Where(d => d.CompanyDoctors.Any(cd => cd.BranchId == branchId.Value && cd.IsActive));
        }

        var list = await query
            .OrderBy(d => d.LastName)
            .ThenBy(d => d.FirstName)
            .ToListAsync();

        var today = DateTime.UtcNow.Date;

        var dtos = list.Select(d =>
        {
            var currentAbsence = d.Absences.FirstOrDefault(a => a.StartDate.Date <= today && a.EndDate.Date >= today);
            var expiringDocsCount = d.Documents.Count(doc => doc.ExpiryDate.HasValue && doc.ExpiryDate.Value.Date <= today.AddDays(30));

            return new MedicalStaffListDto(
                d.Id,
                d.FirstName,
                d.LastName,
                d.ProfessionalRole.ToString(),
                d.TaxCode,
                d.MedicalLicenseNumber,
                d.Specialty,
                d.LicenseAuthority,
                d.LicenseProvince,
                d.LicenseExpiryDate,
                d.Email,
                d.PEC,
                d.Phone,
                d.SignatureImageUrl,
                d.DigitalCertificateThumbprint,
                d.DigitalCertificateExpiry,
                d.IsActive,
                d.UserId,
                d.User?.Email,
                currentAbsence != null ? $"Assente ({currentAbsence.Reason})" : "Disponibile",
                currentAbsence != null,
                expiringDocsCount,
                d.CompanyDoctors.Where(cd => cd.IsActive).Select(cd => new AssignedCompanyInfoDto(
                    cd.Id,
                    cd.CompanyId,
                    cd.Company?.Name ?? "N/A",
                    cd.BranchId,
                    cd.Branch?.City ?? cd.Branch?.Address,
                    cd.IsCoordinator
                )).ToList()
            );
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetStaffById(int id)
    {
        var tenantId = GetTenantId();
        var staff = await _dbContext.Doctors
            .AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Availabilities)
            .Include(d => d.Absences)
                .ThenInclude(a => a.SubstituteDoctor)
            .Include(d => d.Documents)
            .Include(d => d.CompanyDoctors)
                .ThenInclude(cd => cd.Company)
            .Include(d => d.CompanyDoctors)
                .ThenInclude(cd => cd.Branch)
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId);

        if (staff == null) return NotFound();

        return Ok(staff);
    }

    [HttpPost]
    public async Task<IActionResult> CreateStaff([FromBody] CreateMedicalStaffRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenantId = GetTenantId();

        // Check license uniqueness within tenant
        var licenseExists = await _dbContext.Doctors.AnyAsync(d => d.TenantId == tenantId && d.MedicalLicenseNumber == request.MedicalLicenseNumber);
        if (licenseExists) return Conflict("Numero iscrizione Ordine già presente in archivio.");

        int? userId = null;
        if (request.CreateUserAccount && !string.IsNullOrWhiteSpace(request.Email))
        {
            var userExists = await _dbContext.Users.AnyAsync(u => u.TenantId == tenantId && u.Email.ToLower() == request.Email.ToLower());
            if (!userExists)
            {
                var user = new User
                {
                    TenantId = tenantId,
                    Email = request.Email.Trim().ToLower(),
                    FirstName = request.FirstName.Trim(),
                    LastName = request.LastName.Trim(),
                    Role = request.ProfessionalRole == MedicalStaffRole.SegreteriaSanitaria ? AppRole.Doctor : AppRole.Doctor,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Users.Add(user);
                await _dbContext.SaveChangesAsync();
                userId = user.Id;
            }
            else
            {
                userId = await _dbContext.Users.Where(u => u.TenantId == tenantId && u.Email.ToLower() == request.Email.ToLower()).Select(u => u.Id).FirstOrDefaultAsync();
            }
        }

        var doctor = new Doctor
        {
            TenantId = tenantId,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            ProfessionalRole = request.ProfessionalRole,
            TaxCode = request.TaxCode?.Trim().ToUpper(),
            MedicalLicenseNumber = request.MedicalLicenseNumber.Trim(),
            Specialty = request.Specialty?.Trim(),
            LicenseAuthority = request.LicenseAuthority?.Trim(),
            LicenseProvince = request.LicenseProvince?.Trim(),
            LicenseExpiryDate = request.LicenseExpiryDate,
            Email = request.Email?.Trim(),
            PEC = request.PEC?.Trim(),
            Phone = request.Phone?.Trim(),
            SignatureImageUrl = request.SignatureImageUrl,
            DigitalCertificateThumbprint = request.DigitalCertificateThumbprint,
            DigitalCertificateExpiry = request.DigitalCertificateExpiry,
            UserId = userId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Doctors.Add(doctor);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetStaffById), new { id = doctor.Id }, doctor);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateStaff(int id, [FromBody] CreateMedicalStaffRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenantId = GetTenantId();
        var doctor = await _dbContext.Doctors.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId);
        if (doctor == null) return NotFound();

        doctor.FirstName = request.FirstName.Trim();
        doctor.LastName = request.LastName.Trim();
        doctor.ProfessionalRole = request.ProfessionalRole;
        doctor.TaxCode = request.TaxCode?.Trim().ToUpper();
        doctor.MedicalLicenseNumber = request.MedicalLicenseNumber.Trim();
        doctor.Specialty = request.Specialty?.Trim();
        doctor.LicenseAuthority = request.LicenseAuthority?.Trim();
        doctor.LicenseProvince = request.LicenseProvince?.Trim();
        doctor.LicenseExpiryDate = request.LicenseExpiryDate;
        doctor.Email = request.Email?.Trim();
        doctor.PEC = request.PEC?.Trim();
        doctor.Phone = request.Phone?.Trim();
        doctor.SignatureImageUrl = request.SignatureImageUrl;
        doctor.DigitalCertificateThumbprint = request.DigitalCertificateThumbprint;
        doctor.DigitalCertificateExpiry = request.DigitalCertificateExpiry;
        doctor.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return Ok(doctor);
    }

    [HttpPatch("{id:int}/toggle-status")]
    public async Task<IActionResult> ToggleStaffStatus(int id)
    {
        var tenantId = GetTenantId();
        var doctor = await _dbContext.Doctors.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId);
        if (doctor == null) return NotFound();

        doctor.IsActive = !doctor.IsActive;
        doctor.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return Ok(new { doctor.Id, doctor.IsActive });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteStaff(int id)
    {
        var tenantId = GetTenantId();
        var doctor = await _dbContext.Doctors.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId);
        if (doctor == null) return NotFound();

        var hasVisits = await _dbContext.MedicalVisits.AnyAsync(v => v.DoctorId == id && v.TenantId == tenantId);
        if (hasVisits)
        {
            // Soft deactivate rather than delete to preserve legal medical visit records
            doctor.IsActive = false;
            doctor.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Il professionista presenta visite mediche registrate. Lo stato è stato impostato su Disattivato per preservare il registro legale." });
        }

        _dbContext.Doctors.Remove(doctor);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    // ── AVAILABILITY & ABSENCES ────────────────────────────────────────────────

    [HttpGet("{id:int}/availabilities")]
    public async Task<IActionResult> GetAvailabilities(int id)
    {
        var tenantId = GetTenantId();
        var slots = await _dbContext.DoctorAvailabilities
            .AsNoTracking()
            .Where(a => a.DoctorId == id && a.TenantId == tenantId)
            .OrderBy(a => a.DayOfWeek)
            .ThenBy(a => a.StartTime)
            .ToListAsync();

        return Ok(slots);
    }

    [HttpPost("{id:int}/availabilities")]
    public async Task<IActionResult> SetAvailabilities(int id, [FromBody] List<DoctorAvailabilityRequest> slots)
    {
        var tenantId = GetTenantId();
        var doctorExists = await _dbContext.Doctors.AnyAsync(d => d.Id == id && d.TenantId == tenantId);
        if (!doctorExists) return NotFound("Professionista non trovato.");

        // Replace current recurring availabilities
        var existing = await _dbContext.DoctorAvailabilities.Where(a => a.DoctorId == id && a.TenantId == tenantId).ToListAsync();
        _dbContext.DoctorAvailabilities.RemoveRange(existing);

        foreach (var req in slots)
        {
            _dbContext.DoctorAvailabilities.Add(new DoctorAvailability
            {
                TenantId = tenantId,
                DoctorId = id,
                DayOfWeek = req.DayOfWeek,
                StartTime = req.StartTime,
                EndTime = req.EndTime,
                Location = req.Location,
                IsRecurring = req.IsRecurring,
                ValidFrom = req.ValidFrom,
                ValidTo = req.ValidTo,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _dbContext.SaveChangesAsync();
        return Ok(await _dbContext.DoctorAvailabilities.Where(a => a.DoctorId == id && a.TenantId == tenantId).ToListAsync());
    }

    [HttpGet("{id:int}/absences")]
    public async Task<IActionResult> GetAbsences(int id)
    {
        var tenantId = GetTenantId();
        var absences = await _dbContext.StaffAbsences
            .AsNoTracking()
            .Include(a => a.SubstituteDoctor)
            .Where(a => a.DoctorId == id && a.TenantId == tenantId)
            .OrderByDescending(a => a.StartDate)
            .Select(a => new
            {
                a.Id,
                a.DoctorId,
                a.StartDate,
                a.EndDate,
                a.Reason,
                a.Notes,
                a.SubstituteDoctorId,
                SubstituteDoctorName = a.SubstituteDoctor != null ? $"{a.SubstituteDoctor.FirstName} {a.SubstituteDoctor.LastName}" : null
            })
            .ToListAsync();

        return Ok(absences);
    }

    [HttpPost("{id:int}/absences")]
    public async Task<IActionResult> AddAbsence(int id, [FromBody] StaffAbsenceRequest request)
    {
        var tenantId = GetTenantId();
        var doctorExists = await _dbContext.Doctors.AnyAsync(d => d.Id == id && d.TenantId == tenantId);
        if (!doctorExists) return NotFound("Professionista non trovato.");

        var absence = new StaffAbsence
        {
            TenantId = tenantId,
            DoctorId = id,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Reason = string.IsNullOrWhiteSpace(request.Reason) ? "Ferie" : request.Reason.Trim(),
            Notes = request.Notes?.Trim(),
            SubstituteDoctorId = request.SubstituteDoctorId > 0 ? request.SubstituteDoctorId : null,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.StaffAbsences.Add(absence);
        await _dbContext.SaveChangesAsync();
        return Ok(absence);
    }

    [HttpDelete("absences/{absenceId:int}")]
    public async Task<IActionResult> DeleteAbsence(int absenceId)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.StaffAbsences.FirstOrDefaultAsync(a => a.Id == absenceId && a.TenantId == tenantId);
        if (entity == null) return NotFound();

        _dbContext.StaffAbsences.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    // ── DOCUMENTS ─────────────────────────────────────────────────────────────

    [HttpGet("{id:int}/documents")]
    public async Task<IActionResult> GetDocuments(int id)
    {
        var tenantId = GetTenantId();
        var docs = await _dbContext.StaffDocuments
            .AsNoTracking()
            .Where(d => d.DoctorId == id && d.TenantId == tenantId)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();

        return Ok(docs);
    }

    [HttpPost("{id:int}/documents")]
    public async Task<IActionResult> AddDocument(int id, [FromBody] StaffDocumentRequest request)
    {
        var tenantId = GetTenantId();
        var doctorExists = await _dbContext.Doctors.AnyAsync(d => d.Id == id && d.TenantId == tenantId);
        if (!doctorExists) return NotFound("Professionista non trovato.");

        var doc = new StaffDocument
        {
            TenantId = tenantId,
            DoctorId = id,
            DocumentType = request.DocumentType ?? "IscrizioneOrdine",
            Title = request.Title.Trim(),
            FilePath = request.FilePath,
            ExpiryDate = request.ExpiryDate,
            UploadedAt = DateTime.UtcNow
        };

        _dbContext.StaffDocuments.Add(doc);
        await _dbContext.SaveChangesAsync();
        return Ok(doc);
    }

    [HttpDelete("documents/{documentId:int}")]
    public async Task<IActionResult> DeleteDocument(int documentId)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.StaffDocuments.FirstOrDefaultAsync(d => d.Id == documentId && d.TenantId == tenantId);
        if (entity == null) return NotFound();

        _dbContext.StaffDocuments.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    // ── COMPANY & BRANCH ASSIGNMENTS ──────────────────────────────────────────

    [HttpPost("assignments")]
    public async Task<IActionResult> AssignCompany([FromBody] CompanyAssignmentRequest request)
    {
        var tenantId = GetTenantId();
        var doctorExists = await _dbContext.Doctors.AnyAsync(d => d.Id == request.DoctorId && d.TenantId == tenantId);
        if (!doctorExists) return NotFound("Professionista non trovato.");

        var companyExists = await _dbContext.Companies.AnyAsync(c => c.Id == request.CompanyId && c.TenantId == tenantId);
        if (!companyExists) return NotFound("Azienda non trovata.");

        var existing = await _dbContext.CompanyDoctors.FirstOrDefaultAsync(cd =>
            cd.CompanyId == request.CompanyId &&
            cd.DoctorId == request.DoctorId &&
            cd.BranchId == request.BranchId &&
            cd.TenantId == tenantId);

        if (existing != null)
        {
            existing.IsCoordinator = request.IsCoordinator;
            existing.IsActive = true;
            await _dbContext.SaveChangesAsync();
            return Ok(existing);
        }

        var assignment = new CompanyDoctor
        {
            TenantId = tenantId,
            CompanyId = request.CompanyId,
            BranchId = request.BranchId > 0 ? request.BranchId : null,
            DoctorId = request.DoctorId,
            IsCoordinator = request.IsCoordinator,
            IsActive = true,
            AssignedAt = DateTime.UtcNow
        };

        _dbContext.CompanyDoctors.Add(assignment);
        await _dbContext.SaveChangesAsync();
        return Ok(assignment);
    }

    [HttpDelete("assignments/{assignmentId:int}")]
    public async Task<IActionResult> RemoveAssignment(int assignmentId)
    {
        var tenantId = GetTenantId();
        var entity = await _dbContext.CompanyDoctors.FirstOrDefaultAsync(cd => cd.Id == assignmentId && cd.TenantId == tenantId);
        if (entity == null) return NotFound();

        _dbContext.CompanyDoctors.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    // ── DASHBOARD & COMPLIANCE KPI ────────────────────────────────────────────

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var tenantId = GetTenantId();
        var today = DateTime.UtcNow.Date;
        var in30Days = today.AddDays(30);

        var staff = await _dbContext.Doctors
            .AsNoTracking()
            .Include(d => d.Absences)
            .Include(d => d.Documents)
            .Where(d => d.TenantId == tenantId)
            .ToListAsync();

        var totalActive = staff.Count(d => d.IsActive);
        var activeDoctors = staff.Count(d => d.IsActive && (d.ProfessionalRole == MedicalStaffRole.MedicoCompetente || d.ProfessionalRole == MedicalStaffRole.MedicoCoordinato || d.ProfessionalRole == MedicalStaffRole.MedicoSostituto));
        var activeNurses = staff.Count(d => d.IsActive && d.ProfessionalRole == MedicalStaffRole.Infermiere);
        var activeSecretaries = staff.Count(d => d.IsActive && d.ProfessionalRole == MedicalStaffRole.SegreteriaSanitaria);

        var absentToday = staff.Count(d => d.IsActive && d.Absences.Any(a => a.StartDate.Date <= today && a.EndDate.Date >= today));

        var expiringCertificates = staff.Count(d => d.IsActive && d.DigitalCertificateExpiry.HasValue && d.DigitalCertificateExpiry.Value.Date <= in30Days);

        var expiringDocuments = staff.SelectMany(d => d.Documents).Count(doc => doc.ExpiryDate.HasValue && doc.ExpiryDate.Value.Date <= in30Days);

        var totalCompanies = await _dbContext.Companies.CountAsync(c => c.TenantId == tenantId);
        var companiesWithDoctor = await _dbContext.CompanyDoctors
            .Where(cd => cd.TenantId == tenantId && cd.IsActive)
            .Select(cd => cd.CompanyId)
            .Distinct()
            .CountAsync();

        var companyCoveragePercent = totalCompanies > 0 ? (int)Math.Round((double)companiesWithDoctor / totalCompanies * 100) : 100;

        return Ok(new
        {
            totalActive,
            activeDoctors,
            activeNurses,
            activeSecretaries,
            absentToday,
            expiringCertificates,
            expiringDocuments,
            totalCompanies,
            companiesWithDoctor,
            companyCoveragePercent
        });
    }

    // ── V2 INTELLIGENCE: WORKLOAD BALANCING ─────────────────────────────────────

    [HttpGet("workload-balancing")]
    public async Task<IActionResult> GetWorkloadBalancing()
    {
        var tenantId = GetTenantId();
        var today = DateTime.UtcNow.Date;
        var startOfMonth = new DateTime(today.Year, today.Month, 1);

        var staff = await _dbContext.Doctors
            .AsNoTracking()
            .Include(d => d.CompanyDoctors)
                .ThenInclude(cd => cd.Company)
                    .ThenInclude(c => c.Employees)
            .Include(d => d.Availabilities)
            .Include(d => d.MedicalVisits)
            .Where(d => d.TenantId == tenantId && d.IsActive)
            .ToListAsync();

        var workloadMatrix = staff.Select(d =>
        {
            var assignedCompaniesCount = d.CompanyDoctors.Where(cd => cd.IsActive).Select(cd => cd.CompanyId).Distinct().Count();
            var totalAssignedWorkers = d.CompanyDoctors
                .Where(cd => cd.IsActive && cd.Company != null)
                .SelectMany(cd => cd.Company!.Employees)
                .Count();

            var visitsThisMonth = d.MedicalVisits.Count(v => v.VisitDate >= startOfMonth);
            var weeklyHoursAvailable = d.Availabilities.Sum(a => (a.EndTime - a.StartTime).TotalHours);

            // Workload index: workers per weekly hour ratio
            var workloadScore = weeklyHoursAvailable > 0 ? Math.Round(totalAssignedWorkers / weeklyHoursAvailable, 1) : 0;
            var isOverworked = workloadScore > 150 || visitsThisMonth > 80;

            return new
            {
                doctorId = d.Id,
                doctorName = $"{d.FirstName} {d.LastName}",
                role = d.ProfessionalRole.ToString(),
                assignedCompaniesCount,
                totalAssignedWorkers,
                visitsThisMonth,
                weeklyHoursAvailable,
                workloadScore,
                status = isOverworked ? "Sovraccarico" : (workloadScore < 30 ? "Sotto-utilizzato" : "Bilanciato")
            };
        }).ToList();

        return Ok(workloadMatrix);
    }

    // ── V2 INTELLIGENCE: PRODUCTIVITY METRICS ──────────────────────────────────

    [HttpGet("productivity-metrics")]
    public async Task<IActionResult> GetProductivityMetrics()
    {
        var tenantId = GetTenantId();
        var today = DateTime.UtcNow.Date;
        var last30Days = today.AddDays(-30);

        var doctors = await _dbContext.Doctors
            .AsNoTracking()
            .Include(d => d.MedicalVisits)
            .Where(d => d.TenantId == tenantId && d.IsActive)
            .ToListAsync();

        var metrics = doctors.Select(d =>
        {
            var visitsLast30 = d.MedicalVisits.Where(v => v.VisitDate >= last30Days).ToList();
            var totalVisits = visitsLast30.Count;
            var signedVisits = visitsLast30.Count(v => v.IsSigned);
            var unsignedVisits = totalVisits - signedVisits;

            var avgVisitsPerActiveDay = totalVisits > 0 ? Math.Round((double)totalVisits / 20.0, 1) : 0;
            var signatureComplianceRate = totalVisits > 0 ? (int)Math.Round((double)signedVisits / totalVisits * 100) : 100;

            return new
            {
                doctorId = d.Id,
                doctorName = $"{d.FirstName} {d.LastName}",
                role = d.ProfessionalRole.ToString(),
                totalVisitsLast30 = totalVisits,
                signedVisits,
                unsignedVisits,
                avgVisitsPerActiveDay,
                signatureComplianceRate
            };
        }).ToList();

        return Ok(metrics);
    }

    // ── V2 INTELLIGENCE: CAPACITY PLANNING ─────────────────────────────────────

    [HttpGet("capacity-planning")]
    public async Task<IActionResult> GetCapacityPlanning()
    {
        var tenantId = GetTenantId();
        var today = DateTime.UtcNow.Date;

        var weeklySlots = await _dbContext.DoctorAvailabilities
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId)
            .ToListAsync();

        var totalWeeklyHours = weeklySlots.Sum(s => (s.EndTime - s.StartTime).TotalHours);
        var totalMonthlySlots = (int)Math.Round(totalWeeklyHours * 4 * 2); // Assume ~30 mins per visit

        var next30DaysDeadlines = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Where(v => v.TenantId == tenantId && v.NextDeadlineDate.Date >= today && v.NextDeadlineDate.Date <= today.AddDays(30))
            .CountAsync();

        var next60DaysDeadlines = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Where(v => v.TenantId == tenantId && v.NextDeadlineDate.Date >= today && v.NextDeadlineDate.Date <= today.AddDays(60))
            .CountAsync();

        var capacityUtilization30 = totalMonthlySlots > 0 ? (int)Math.Round((double)next30DaysDeadlines / totalMonthlySlots * 100) : 0;

        return Ok(new
        {
            totalWeeklyHours,
            totalMonthlySlotsCapacity = totalMonthlySlots,
            next30DaysDeadlines,
            next60DaysDeadlines,
            capacityUtilization30Percent = capacityUtilization30,
            hasCapacityDeficit = capacityUtilization30 > 90
        });
    }

    // ── V2 INTELLIGENCE: COVERAGE GAPS ─────────────────────────────────────────

    [HttpGet("coverage-gaps")]
    public async Task<IActionResult> GetCoverageGaps()
    {
        var tenantId = GetTenantId();

        var companies = await _dbContext.Companies
            .AsNoTracking()
            .Include(c => c.CompanyDoctors)
                .ThenInclude(cd => cd.Doctor)
            .Include(c => c.Branches)
            .Where(c => c.TenantId == tenantId)
            .ToListAsync();

        var gaps = companies.Select(c =>
        {
            var nominatedDoc = c.CompanyDoctors.FirstOrDefault(cd => cd.IsActive && !cd.IsCoordinator);
            var coordinatorDoc = c.CompanyDoctors.FirstOrDefault(cd => cd.IsActive && cd.IsCoordinator);

            var hasNominated = nominatedDoc != null;
            var hasCoordinator = coordinatorDoc != null;

            return new
            {
                companyId = c.Id,
                companyName = c.Name,
                vatNumber = c.VATNumber,
                branchesCount = c.Branches.Count,
                nominatedDoctorName = nominatedDoc != null ? $"{nominatedDoc.Doctor?.FirstName} {nominatedDoc.Doctor?.LastName}" : null,
                coordinatorDoctorName = coordinatorDoc != null ? $"{coordinatorDoc.Doctor?.FirstName} {coordinatorDoc.Doctor?.LastName}" : null,
                hasCoverageGap = !hasNominated && !hasCoordinator,
                gapSeverity = (!hasNominated && !hasCoordinator) ? "Critico (Nessun Medico)" : (!hasNominated ? "Attenzione (Manca Nominato)" : "Ok")
            };
        }).ToList();

        return Ok(gaps);
    }

    // ── V2 INTELLIGENCE: VACATION IMPACT FORECASTING ────────────────────────────

    [HttpGet("vacation-impact")]
    public async Task<IActionResult> ForecastVacationImpact(
        [FromQuery] int doctorId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var tenantId = GetTenantId();
        var doctor = await _dbContext.Doctors
            .AsNoTracking()
            .Include(d => d.CompanyDoctors)
            .FirstOrDefaultAsync(d => d.Id == doctorId && d.TenantId == tenantId);

        if (doctor == null) return NotFound("Professionista non trovato.");

        var assignedCompanyIds = doctor.CompanyDoctors.Where(cd => cd.IsActive).Select(cd => cd.CompanyId).ToList();

        var impactedDeadlinesCount = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Include(v => v.Employee)
            .Where(v => v.TenantId == tenantId &&
                        v.Employee != null &&
                        assignedCompanyIds.Contains(v.Employee.CompanyId) &&
                        v.NextDeadlineDate.Date >= startDate.Date &&
                        v.NextDeadlineDate.Date <= endDate.Date)
            .CountAsync();

        var availableSubstitutes = await _dbContext.Doctors
            .AsNoTracking()
            .Include(d => d.Absences)
            .Where(d => d.TenantId == tenantId &&
                        d.Id != doctorId &&
                        d.IsActive &&
                        d.ProfessionalRole != MedicalStaffRole.SegreteriaSanitaria &&
                        !d.Absences.Any(a => a.StartDate.Date <= endDate.Date && a.EndDate.Date >= startDate.Date))
            .Select(d => new { d.Id, Name = $"{d.FirstName} {d.LastName}", d.Specialty })
            .ToListAsync();

        return Ok(new
        {
            doctorId,
            doctorName = $"{doctor.FirstName} {doctor.LastName}",
            startDate,
            endDate,
            impactedDeadlinesCount,
            hasComplianceRisk = impactedDeadlinesCount > 10,
            availableSubstitutesCount = availableSubstitutes.Count,
            suggestedSubstitutes = availableSubstitutes
        });
    }

    // ── V2 INTELLIGENCE: AUTO-SUBSTITUTION ──────────────────────────────────────

    [HttpPost("absences/{id:int}/auto-substitute")]
    public async Task<IActionResult> AutoSubstituteAbsence(int id)
    {
        var tenantId = GetTenantId();
        var absence = await _dbContext.StaffAbsences
            .Include(a => a.Doctor)
            .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId);

        if (absence == null) return NotFound("Assenza non trovata.");

        var availableSubstitute = await _dbContext.Doctors
            .AsNoTracking()
            .Include(d => d.Absences)
            .Where(d => d.TenantId == tenantId &&
                        d.Id != absence.DoctorId &&
                        d.IsActive &&
                        (d.ProfessionalRole == MedicalStaffRole.MedicoCompetente || d.ProfessionalRole == MedicalStaffRole.MedicoSostituto) &&
                        !d.Absences.Any(a => a.StartDate.Date <= absence.EndDate.Date && a.EndDate.Date >= absence.StartDate.Date))
            .OrderBy(d => d.Id)
            .FirstOrDefaultAsync();

        if (availableSubstitute == null)
        {
            return BadRequest("Nessun medico sostituto disponibile nell'intervallo richiesto.");
        }

        absence.SubstituteDoctorId = availableSubstitute.Id;
        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            absence.Id,
            absence.DoctorId,
            absence.SubstituteDoctorId,
            substituteDoctorName = $"{availableSubstitute.FirstName} {availableSubstitute.LastName}"
        });
    }

    // DTO records
    public record MedicalStaffListDto(
        int Id,
        string FirstName,
        string LastName,
        string ProfessionalRole,
        string? TaxCode,
        string MedicalLicenseNumber,
        string? Specialty,
        string? LicenseAuthority,
        string? LicenseProvince,
        DateTime? LicenseExpiryDate,
        string? Email,
        string? PEC,
        string? Phone,
        string? SignatureImageUrl,
        string? DigitalCertificateThumbprint,
        DateTime? DigitalCertificateExpiry,
        bool IsActive,
        int? UserId,
        string? LinkedUserEmail,
        string AvailabilityStatus,
        bool IsAbsent,
        int ExpiringDocsCount,
        List<AssignedCompanyInfoDto> AssignedCompanies
    );

    public record AssignedCompanyInfoDto(
        int AssignmentId,
        int CompanyId,
        string CompanyName,
        int? BranchId,
        string? BranchName,
        bool IsCoordinator
    );

    public class CreateMedicalStaffRequest
    {
        [Required]
        [StringLength(120, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(120, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;

        public MedicalStaffRole ProfessionalRole { get; set; } = MedicalStaffRole.MedicoCompetente;

        [StringLength(16)]
        public string? TaxCode { get; set; }

        [Required]
        [StringLength(50, MinimumLength = 4)]
        public string MedicalLicenseNumber { get; set; } = string.Empty;

        [StringLength(120)]
        public string? Specialty { get; set; }

        [StringLength(100)]
        public string? LicenseAuthority { get; set; }

        [StringLength(100)]
        public string? LicenseProvince { get; set; }

        public DateTime? LicenseExpiryDate { get; set; }

        [EmailAddress]
        [StringLength(150)]
        public string? Email { get; set; }

        [EmailAddress]
        [StringLength(150)]
        public string? PEC { get; set; }

        [Phone]
        [StringLength(30)]
        public string? Phone { get; set; }

        [StringLength(200)]
        public string? SignatureImageUrl { get; set; }

        [StringLength(200)]
        public string? DigitalCertificateThumbprint { get; set; }

        public DateTime? DigitalCertificateExpiry { get; set; }

        public bool CreateUserAccount { get; set; } = true;
    }

    public class DoctorAvailabilityRequest
    {
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string? Location { get; set; }
        public bool IsRecurring { get; set; } = true;
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
    }

    public class StaffAbsenceRequest
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Reason { get; set; }
        public string? Notes { get; set; }
        public int? SubstituteDoctorId { get; set; }
    }

    public class StaffDocumentRequest
    {
        public string? DocumentType { get; set; }
        [Required]
        public string Title { get; set; } = string.Empty;
        public string? FilePath { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }

    public class CompanyAssignmentRequest
    {
        public int DoctorId { get; set; }
        public int CompanyId { get; set; }
        public int? BranchId { get; set; }
        public bool IsCoordinator { get; set; }
    }
}
