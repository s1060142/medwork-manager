using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/doctor-data")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class DoctorCrudController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public DoctorCrudController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost("medical-records")]
    public async Task<IActionResult> CreateMedicalRecord([FromBody] MedicalRecord request)
    {
        var exists = await _dbContext.MedicalRecords.AnyAsync(x => x.EmployeeId == request.EmployeeId);
        if (exists)
        {
            return Conflict("A medical record already exists for this employee.");
        }

        _dbContext.MedicalRecords.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("medical-records/{id:int}")]
    public async Task<IActionResult> UpdateMedicalRecord(int id, [FromBody] MedicalRecord request)
    {
        var entity = await _dbContext.MedicalRecords.FirstOrDefaultAsync(x => x.Id == id);
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
        var entity = await _dbContext.MedicalRecords.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        _dbContext.MedicalRecords.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("medical-visits")]
    public async Task<IActionResult> CreateMedicalVisit([FromBody] MedicalVisit request)
    {
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

        _dbContext.MedicalVisits.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("medical-visits/{id:int}")]
    public async Task<IActionResult> UpdateMedicalVisit(int id, [FromBody] MedicalVisit request)
    {
        var entity = await _dbContext.MedicalVisits.FirstOrDefaultAsync(x => x.Id == id);
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
        var entity = await _dbContext.MedicalVisits.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        _dbContext.MedicalVisits.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("visit-exams")]
    public async Task<IActionResult> CreateVisitExam([FromBody] VisitExam request)
    {
        _dbContext.VisitExams.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("visit-exams/{id:int}")]
    public async Task<IActionResult> UpdateVisitExam(int id, [FromBody] VisitExam request)
    {
        var entity = await _dbContext.VisitExams.FirstOrDefaultAsync(x => x.Id == id);
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
        var entity = await _dbContext.VisitExams.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        _dbContext.VisitExams.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("anamneses")]
    public async Task<IActionResult> CreateAnamnesis([FromBody] Anamnesis request)
    {
        var exists = await _dbContext.Anamneses.AnyAsync(x => x.MedicalVisitId == request.MedicalVisitId);
        if (exists)
        {
            return Conflict("An anamnesis already exists for this medical visit.");
        }

        _dbContext.Anamneses.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("anamneses/{id:int}")]
    public async Task<IActionResult> UpdateAnamnesis(int id, [FromBody] Anamnesis request)
    {
        var entity = await _dbContext.Anamneses.FirstOrDefaultAsync(x => x.Id == id);
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
        var entity = await _dbContext.Anamneses.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        _dbContext.Anamneses.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("scheduled-exams")]
    public async Task<IActionResult> CreateScheduledExam([FromBody] ScheduledExam request)
    {
        _dbContext.ScheduledExams.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("scheduled-exams/{id:int}")]
    public async Task<IActionResult> UpdateScheduledExam(int id, [FromBody] ScheduledExam request)
    {
        var entity = await _dbContext.ScheduledExams.FirstOrDefaultAsync(x => x.Id == id);
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
        var entity = await _dbContext.ScheduledExams.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        _dbContext.ScheduledExams.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("vaccinations")]
    public async Task<IActionResult> CreateVaccination([FromBody] Vaccination request)
    {
        _dbContext.Vaccinations.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("vaccinations/{id:int}")]
    public async Task<IActionResult> UpdateVaccination(int id, [FromBody] Vaccination request)
    {
        var entity = await _dbContext.Vaccinations.FirstOrDefaultAsync(x => x.Id == id);
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
        var entity = await _dbContext.Vaccinations.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        _dbContext.Vaccinations.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}
