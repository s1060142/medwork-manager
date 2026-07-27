using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/attachments")]
[Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
public class AttachmentsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AttachmentsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("")]
    public async Task<IActionResult> GetAttachments(
        [FromQuery] string? entityType = null,
        [FromQuery] int? entityId = null,
        [FromQuery] bool activeOnly = true)
    {
        var query = _dbContext.Attachments.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(entityType) && entityId.HasValue)
        {
            query = query.Where(x => x.EmployeeId == entityId && entityType == "Employee"
                                  || x.CompanyId == entityId && entityType == "Company"
                                  || x.MedicalVisitId == entityId && entityType == "MedicalVisit"
                                  || x.RiskFactorId == entityId && entityType == "RiskFactor"
                                  || x.SiteVisitId == entityId && entityType == "SiteVisit");
        }

        if (activeOnly)
            query = query.Where(x => !x.IsArchived);

        var data = await query
            .OrderByDescending(x => x.UploadedAt)
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.Category,
                x.Description,
                x.FileName,
                x.ContentType,
                x.FileSize,
                x.StoragePath,
                x.Checksum,
                x.IsConfidential,
                x.IsArchived,
                x.UploadedAt,
                x.UploadedBy,
                x.ExpiresAt,
                x.EmployeeId,
                x.CompanyId,
                x.MedicalVisitId,
                x.RiskFactorId,
                x.SiteVisitId
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetAttachment(int id)
    {
        var attachment = await _dbContext.Attachments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (attachment is null) return NotFound();

        return Ok(attachment);
    }

    [HttpPost("")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> CreateAttachment([FromBody] Attachment request)
    {
        request.UploadedAt = DateTime.UtcNow;
        request.UploadedBy = request.UploadedBy ?? "system";

        _dbContext.Attachments.Add(request);
        await _dbContext.SaveChangesAsync();

        return Ok(request);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> UpdateAttachment(int id, [FromBody] Attachment request)
    {
        var entity = await _dbContext.Attachments.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        entity.Title = request.Title;
        entity.Category = request.Category;
        entity.Description = request.Description;
        entity.FileName = request.FileName;
        entity.ContentType = request.ContentType;
        entity.FileSize = request.FileSize;
        entity.StoragePath = request.StoragePath;
        entity.Checksum = request.Checksum;
        entity.IsConfidential = request.IsConfidential;
        entity.IsArchived = request.IsArchived;
        entity.ExpiresAt = request.ExpiresAt;
        entity.EmployeeId = request.EmployeeId;
        entity.CompanyId = request.CompanyId;
        entity.MedicalVisitId = request.MedicalVisitId;
        entity.RiskFactorId = request.RiskFactorId;
        entity.SiteVisitId = request.SiteVisitId;

        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> DeleteAttachment(int id)
    {
        var entity = await _dbContext.Attachments.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        _dbContext.Attachments.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/archive")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> ArchiveAttachment(int id)
    {
        var entity = await _dbContext.Attachments.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        entity.IsArchived = true;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPost("{id:int}/restore")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> RestoreAttachment(int id)
    {
        var entity = await _dbContext.Attachments.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        entity.IsArchived = false;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    // Get attachments for a specific employee
    [HttpGet("employee/{employeeId:int}")]
    public async Task<IActionResult> GetEmployeeAttachments(int employeeId)
    {
        var data = await _dbContext.Attachments
            .AsNoTracking()
            .Where(x => x.EmployeeId == employeeId && !x.IsArchived)
            .OrderByDescending(x => x.UploadedAt)
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.Category,
                x.Description,
                x.FileName,
                x.ContentType,
                x.FileSize,
                x.StoragePath,
                x.Checksum,
                x.IsConfidential,
                x.UploadedAt,
                x.UploadedBy,
                x.ExpiresAt
            })
            .ToListAsync();

        return Ok(data);
    }

    // Get attachments for a specific company
    [HttpGet("company/{companyId:int}")]
    public async Task<IActionResult> GetCompanyAttachments(int companyId)
    {
        var data = await _dbContext.Attachments
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId && !x.IsArchived)
            .OrderByDescending(x => x.UploadedAt)
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.Category,
                x.Description,
                x.FileName,
                x.ContentType,
                x.FileSize,
                x.StoragePath,
                x.Checksum,
                x.IsConfidential,
                x.UploadedAt,
                x.UploadedBy,
                x.ExpiresAt
            })
            .ToListAsync();

        return Ok(data);
    }

    // Get attachments for a specific medical visit
    [HttpGet("medical-visit/{medicalVisitId:int}")]
    public async Task<IActionResult> GetMedicalVisitAttachments(int medicalVisitId)
    {
        var data = await _dbContext.Attachments
            .AsNoTracking()
            .Where(x => x.MedicalVisitId == medicalVisitId && !x.IsArchived)
            .OrderByDescending(x => x.UploadedAt)
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.Category,
                x.Description,
                x.FileName,
                x.ContentType,
                x.FileSize,
                x.StoragePath,
                x.Checksum,
                x.IsConfidential,
                x.UploadedAt,
                x.UploadedBy,
                x.ExpiresAt
            })
            .ToListAsync();

        return Ok(data);
    }
}