using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Controllers;

/// <summary>
/// FASE 1 - Cartella Sanitaria 3A: full CRUD + autosave for the medical record
/// (anamnesi, rischi, accertamenti, esame obiettivo, conclusioni).
/// Uses a distinct route to avoid clashing with FASE 0's read-only MedicalRecordsController.
/// </summary>
[Route("api/medical-records-v2")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class MedicalRecordController : ControllerBase
{
    private readonly AppDbContext _db;

    public MedicalRecordController(AppDbContext db) => _db = db;

    [HttpGet("employee/{employeeId:int}")]
    public async Task<IActionResult> GetByEmployee(int employeeId)
    {
        var record = await _db.MedicalRecords.AsNoTracking()
            .FirstOrDefaultAsync(x => x.EmployeeId == employeeId);
        return record is null ? NotFound() : Ok(record);
    }

    [HttpPost("employee/{employeeId:int}")]
    public async Task<IActionResult> Upsert(int employeeId, [FromBody] MedicalRecord request)
    {
        request.EmployeeId = employeeId;
        var validation = new List<ValidationResult>();
        if (!Validator.TryValidateObject(request, new ValidationContext(request), validation, true))
            return BadRequest(validation);

        var existing = await _db.MedicalRecords.FirstOrDefaultAsync(x => x.EmployeeId == employeeId);
        if (existing is null)
        {
            request.EmployeeId = employeeId;
            request.Status = MedicalRecordStatus.Active;
            request.CreatedAt = DateTime.UtcNow;
            _db.MedicalRecords.Add(request);
        }
        else
        {
            existing.MedicalHistory = request.MedicalHistory;
            existing.Notes = request.Notes;
            existing.CurrentTherapies = request.CurrentTherapies;
            existing.Allergies = request.Allergies;
            existing.FamilyHistory = request.FamilyHistory;
            existing.Status = request.Status;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(existing ?? request);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] MedicalRecord request)
    {
        var entity = await _db.MedicalRecords.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == GetTenantId());
        if (entity is null) return NotFound();

        entity.MedicalHistory = request.MedicalHistory;
        entity.Notes = request.Notes;
        entity.CurrentTherapies = request.CurrentTherapies;
        entity.Allergies = request.Allergies;
        entity.FamilyHistory = request.FamilyHistory;
        entity.Status = request.Status;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.MedicalRecords.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == GetTenantId());
        if (entity is null) return NotFound();
        _db.MedicalRecords.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Lightweight autosave endpoint (partial updates from the editor).</summary>
    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Autosave(int id, [FromBody] MedicalRecordPatch patch)
    {
        var entity = await _db.MedicalRecords.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == GetTenantId());
        if (entity is null) return NotFound();

        if (patch.MedicalHistory is not null) entity.MedicalHistory = patch.MedicalHistory;
        if (patch.Notes is not null) entity.Notes = patch.Notes;
        if (patch.CurrentTherapies is not null) entity.CurrentTherapies = patch.CurrentTherapies;
        if (patch.Allergies is not null) entity.Allergies = patch.Allergies;
        if (patch.FamilyHistory is not null) entity.FamilyHistory = patch.FamilyHistory;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    private int GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value;
        if (int.TryParse(tenantClaim, out var tenantId))
        {
            return tenantId;
        }
        throw new UnauthorizedAccessException("Tenant ID non valido nel token.");
    }
}

public sealed record MedicalRecordPatch(
    string? MedicalHistory,
    string? Notes,
    string? CurrentTherapies,
    string? Allergies,
    string? FamilyHistory);
