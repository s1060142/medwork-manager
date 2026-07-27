using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/injuries")]
[Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
public class InjuriesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public InjuriesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("")]
    public async Task<IActionResult> GetInjuries(
        [FromQuery] int? employeeId = null,
        [FromQuery] int? companyId = null,
        [FromQuery] string? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _dbContext.Injuries.AsNoTracking();

        if (employeeId.HasValue)
            query = query.Where(x => x.EmployeeId == employeeId.Value);

        if (companyId.HasValue)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status);

        if (fromDate.HasValue)
            query = query.Where(x => x.InjuryDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(x => x.InjuryDate <= toDate.Value);

        var total = await query.CountAsync();

        var data = await query
            .OrderByDescending(x => x.InjuryDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                x.CompanyId,
                x.InjuryDate,
                x.ReportDate,
                x.InjuryType,
                x.BodyPart,
                x.InjuryNature,
                x.Cause,
                x.Location,
                x.DaysLost,
                x.IsReportedToInail,
                x.InailReportNumber,
                x.InailReportDate,
                x.Status,
                x.CreatedAt,
                x.CreatedBy
            })
            .ToListAsync();

        return Ok(new { data, total, page, pageSize });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetInjury(int id)
    {
        var injury = await _dbContext.Injuries
            .AsNoTracking()
            .Include(x => x.InjuryAttachments)
                .ThenInclude(x => x.Attachment)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (injury is null) return NotFound();

        return Ok(injury);
    }

    [HttpPost("")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> CreateInjury([FromBody] Injury request)
    {
        request.CreatedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;
        request.CreatedBy = request.CreatedBy ?? "system";
        request.UpdatedBy = request.UpdatedBy ?? "system";

        _dbContext.Injuries.Add(request);
        await _dbContext.SaveChangesAsync();

        return Ok(request);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> UpdateInjury(int id, [FromBody] Injury request)
    {
        var entity = await _dbContext.Injuries.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        entity.EmployeeId = request.EmployeeId;
        entity.CompanyId = request.CompanyId;
        entity.InjuryDate = request.InjuryDate;
        entity.ReportDate = request.ReportDate;
        entity.InjuryType = request.InjuryType;
        entity.BodyPart = request.BodyPart;
        entity.InjuryNature = request.InjuryNature;
        entity.Cause = request.Cause;
        entity.Location = request.Location;
        entity.Description = request.Description;
        entity.DaysLost = request.DaysLost;
        entity.ReturnToWorkDate = request.ReturnToWorkDate;
        entity.IsReportedToInail = request.IsReportedToInail;
        entity.InailReportNumber = request.InailReportNumber;
        entity.InailReportDate = request.InailReportDate;
        entity.Status = request.Status;
        entity.Notes = request.Notes;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = request.UpdatedBy ?? "system";

        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> DeleteInjury(int id)
    {
        var entity = await _dbContext.Injuries.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();

        _dbContext.Injuries.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    // Injury Attachments
    [HttpGet("{injuryId:int}/attachments")]
    public async Task<IActionResult> GetInjuryAttachments(int injuryId)
    {
        var injury = await _dbContext.Injuries.FindAsync(injuryId);
        if (injury is null) return NotFound("Infortunio non trovato");

        var data = await _dbContext.InjuryAttachments
            .AsNoTracking()
            .Where(x => x.InjuryId == injuryId)
            .Include(x => x.Attachment)
            .Select(x => new
            {
                x.InjuryId,
                x.AttachmentId,
                AttachmentTitle = x.Attachment!.Title,
                AttachmentFileName = x.Attachment.FileName,
                AttachmentContentType = x.Attachment.ContentType,
                AttachmentFileSize = x.Attachment.FileSize,
                AttachmentStoragePath = x.Attachment.StoragePath,
                AttachmentUploadedAt = x.Attachment.UploadedAt,
                AttachmentCategory = x.Attachment.Category
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpPost("{injuryId:int}/attachments")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> AddAttachmentToInjury(int injuryId, [FromBody] InjuryAttachment request)
    {
        var injury = await _dbContext.Injuries.FindAsync(injuryId);
        if (injury is null) return NotFound("Infortunio non trovato");

        var attachment = await _dbContext.Attachments.FindAsync(request.AttachmentId);
        if (attachment is null) return NotFound("Allegato non trovato");

        var exists = await _dbContext.InjuryAttachments
            .AnyAsync(x => x.InjuryId == injuryId && x.AttachmentId == request.AttachmentId);

        if (exists)
            return Conflict("Allegato già associato a questo infortunio");

        request.InjuryId = injuryId;
        _dbContext.InjuryAttachments.Add(request);
        await _dbContext.SaveChangesAsync();

        return Ok(request);
    }

    [HttpDelete("{injuryId:int}/attachments/{attachmentId:int}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> RemoveAttachmentFromInjury(int injuryId, int attachmentId)
    {
        var entity = await _dbContext.InjuryAttachments
            .FirstOrDefaultAsync(x => x.InjuryId == injuryId && x.AttachmentId == attachmentId);

        if (entity is null) return NotFound();

        _dbContext.InjuryAttachments.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    // Statistics
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics([FromQuery] int? companyId = null, [FromQuery] int year = 0)
    {
        var query = _dbContext.Injuries.AsNoTracking();

        if (companyId.HasValue)
            query = query.Where(x => x.CompanyId == companyId.Value);

        if (year > 0)
            query = query.Where(x => x.InjuryDate.Year == year);

        var total = await query.CountAsync();
        var byType = await query.GroupBy(x => x.InjuryType).Select(g => new { Type = g.Key, Count = g.Count() }).ToListAsync();
        var byStatus = await query.GroupBy(x => x.Status).Select(g => new { Status = g.Key, Count = g.Count() }).ToListAsync();
        var byBodyPart = await query.GroupBy(x => x.BodyPart).Select(g => new { BodyPart = g.Key, Count = g.Count() }).OrderByDescending(x => x.Count).Take(10).ToListAsync();
        var totalDaysLost = await query.SumAsync(x => (long?)x.DaysLost) ?? 0;
        var reportedToInail = await query.CountAsync(x => x.IsReportedToInail);

        return Ok(new
        {
            TotalInjuries = total,
            ByType = byType,
            ByStatus = byStatus,
            TopBodyParts = byBodyPart,
            TotalDaysLost = totalDaysLost,
            ReportedToInail = reportedToInail
        });
    }
}