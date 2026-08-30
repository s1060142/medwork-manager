using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/billing")]
[Authorize(Roles = AppRole.Admin)]
public class BillingController : ControllerBase
{
    private readonly AppDbContext _db;
    private const decimal DefaultVisitTariff = 80m;

    public BillingController(AppDbContext db)
    {
        _db = db;
    }

    private int GetTenantId()
    {
        var claim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value;
        if (int.TryParse(claim, out var id) && id > 0)
            return id;
        throw new UnauthorizedAccessException("Tenant non specificato");
    }

    /// <summary>
    /// Returns all billing documents for the current tenant (optionally filtered by period).
    /// </summary>
    [HttpGet("documents")]
    public async Task<IActionResult> GetDocuments([FromQuery] string? period)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var query = _db.BillingDocuments
            .AsNoTracking()
            .Include(b => b.Company)
            .Where(b => b.TenantId == tenantId);

        if (!string.IsNullOrWhiteSpace(period))
        {
            query = query.Where(b => b.Period == period);
        }

        var result = await query
            .OrderByDescending(b => b.IssuedAt)
            .ToListAsync();

        return Ok(result);
    }

    /// <summary>
    /// Generates billing documents for the current tenant for a given date range.
    /// Request body: { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
    /// Groups visits by company, creates one BillingDocument per company with VisitCount * tariff.
    /// </summary>
    [HttpPost("documents")]
    public async Task<IActionResult> GenerateDocuments([FromBody] BillingGenerateRequest request)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.From) || string.IsNullOrWhiteSpace(request.To))
        {
            return BadRequest(new { message = "I campi 'from' e 'to' sono obbligatori." });
        }

        if (!DateOnly.TryParse(request.From, out var fromDate) || !DateOnly.TryParse(request.To, out var toDate))
        {
            return BadRequest(new { message = "Formato data non valido. Usa YYYY-MM-DD." });
        }

        if (toDate < fromDate)
        {
            return BadRequest(new { message = "'to' non può essere precedente a 'from'." });
        }

        var fromDateTime = fromDate.ToDateTime(new TimeOnly(0, 0));
        var toDateTime = toDate.ToDateTime(new TimeOnly(23, 59, 59));

        // Get all companies for this tenant
        var companyIds = await _db.Companies
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId)
            .Select(c => c.Id)
            .ToListAsync();

        if (!companyIds.Any())
        {
            return Ok(Array.Empty<object>());
        }

        // Get employees for these companies
        var employeesInCompanies = await _db.Employees
            .AsNoTracking()
            .Where(e => companyIds.Contains(e.CompanyId) && e.TenantId == tenantId)
            .Select(e => new { e.Id, e.CompanyId })
            .ToListAsync();

        var employeeIds = employeesInCompanies.Select(e => e.Id).ToHashSet();

        // Count visits in the date range per company
        var visitsByCompany = await _db.MedicalVisits
            .AsNoTracking()
            .Where(v => employeeIds.Contains(v.EmployeeId)
                     && v.VisitDate >= fromDateTime
                     && v.VisitDate <= toDateTime
                     && v.TenantId == tenantId)
            .Join(employeesInCompanies,
                  v => v.EmployeeId,
                  e => e.Id,
                  (v, e) => new { e.CompanyId })
            .GroupBy(x => x.CompanyId)
            .Select(g => new { CompanyId = g.Key, VisitCount = g.Count() })
            .ToListAsync();

        var tariff = request.TariffPerVisit > 0 ? request.TariffPerVisit : DefaultVisitTariff;
        var period = fromDate.ToString("YYYY-MM");

        // Prevent duplicate (TenantId, InvoiceNumber) under concurrent calls by
        // serializing the read-compute-insert inside a serializable transaction.
        await using var tx = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

        // Get the next progressive invoice number for this tenant/period
        var lastInvoice = await _db.BillingDocuments
            .AsNoTracking()
            .Where(b => b.TenantId == tenantId && b.Period == period)
            .OrderByDescending(b => b.Id)
            .FirstOrDefaultAsync();

        int progressive = 1;
        if (lastInvoice != null && !string.IsNullOrWhiteSpace(lastInvoice.InvoiceNumber))
        {
            var parts = lastInvoice.InvoiceNumber.Split('-');
            if (parts.Length == 2 && int.TryParse(parts[1], out var lastProg))
                progressive = lastProg + 1;
        }

        var created = new List<BillingDocument>();

        foreach (var companyVisits in visitsByCompany)
        {
            var invoiceNumber = $"FT-{progressive:D6}";
            var amount = companyVisits.VisitCount * tariff;

            var doc = new BillingDocument
            {
                TenantId = tenantId,
                CompanyId = companyVisits.CompanyId,
                Period = period,
                InvoiceNumber = invoiceNumber,
                VisitCount = companyVisits.VisitCount,
                Amount = amount,
                Status = "emesso",
                IssuedAt = DateTime.UtcNow,
                GeneratedById = User.Identity?.Name
            };

            _db.BillingDocuments.Add(doc);
            created.Add(doc);
            progressive++;
        }

        if (created.Any())
        {
            await _db.SaveChangesAsync();
        }

        await tx.CommitAsync();

        return Ok(created);
    }

    /// <summary>
    /// Updates the Status of a billing document within the current tenant scope.
    /// </summary>
    [HttpPatch("documents/{id:int}/status")]
    public async Task<IActionResult> UpdateDocumentStatus(int id, [FromBody] BillingStatusUpdateRequest request)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return BadRequest(new { message = "Il campo 'status' è obbligatorio." });
        }

        var entity = await _db.BillingDocuments
            .FirstOrDefaultAsync(b => b.Id == id && b.TenantId == tenantId);

        if (entity is null) return NotFound();

        entity.Status = request.Status;
        await _db.SaveChangesAsync();

        return Ok(entity);
    }
}

public class BillingStatusUpdateRequest
{
    public string Status { get; set; } = string.Empty;
}

public class BillingGenerateRequest
{
    /// <summary>Start date in YYYY-MM-DD format</summary>
    public string From { get; set; } = string.Empty;

    /// <summary>End date in YYYY-MM-DD format</summary>
    public string To { get; set; } = string.Empty;

    /// <summary>Tariff per visit; defaults to 80 if not provided</summary>
    public decimal TariffPerVisit { get; set; } = 0;
}
