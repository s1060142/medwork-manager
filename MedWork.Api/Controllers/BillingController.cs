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
public class BillingController : BaseController
{
    private readonly AppDbContext _db;
    private const decimal DefaultVisitTariff = 80m;

    public BillingController(AppDbContext db)
    {
        _db = db;
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

    /// <summary>
    /// Returns standardized service price list for occupational health services.
    /// </summary>
    [HttpGet("price-lists")]
    public IActionResult GetPriceLists()
    {
        var services = new[]
        {
            new { Code = "VIS_PER", Name = "Visita Medica Preventiva / Periodica (Art. 41)", DefaultPrice = 45.00m, VatRate = 0m, IsSanitaryExempt = true },
            new { Code = "AUD_TON", Name = "Esame Audiometrico Tonale Liminare", DefaultPrice = 20.00m, VatRate = 0m, IsSanitaryExempt = true },
            new { Code = "SPI_CVF", Name = "Spirometria con curva Flusso/Volume", DefaultPrice = 22.00m, VatRate = 0m, IsSanitaryExempt = true },
            new { Code = "VIS_ERG", Name = "Screening Ergoftalmologico (Visiotest / VDT)", DefaultPrice = 18.00m, VatRate = 0m, IsSanitaryExempt = true },
            new { Code = "TOX_SCR", Name = "Drug Test Screening Rapido Urine a Catena di Custodia", DefaultPrice = 30.00m, VatRate = 0m, IsSanitaryExempt = true },
            new { Code = "REL_A40", Name = "Relazione Sanitaria Annuale & Allegato 3B (Art. 40)", DefaultPrice = 150.00m, VatRate = 22.0m, IsSanitaryExempt = false },
            new { Code = "NOM_MC", Name = "Quota Annuale Nomina Medico Competente (Art. 25)", DefaultPrice = 300.00m, VatRate = 22.0m, IsSanitaryExempt = false },
            new { Code = "SOP_A25", Name = "Sopralluogo Ambienti di Lavoro (Art. 25 c.1 lett. l)", DefaultPrice = 200.00m, VatRate = 22.0m, IsSanitaryExempt = false },
        };

        return Ok(services);
    }

    /// <summary>
    /// Returns itemized pre-invoicing summary for all companies in a given period.
    /// </summary>
    [HttpGet("pre-invoicing-summary")]
    public async Task<IActionResult> GetPreInvoicingSummary([FromQuery] string? from, [FromQuery] string? to)
    {
        var tenantId = GetTenantId();
        if (tenantId <= 0) return Unauthorized();

        var fromDate = !string.IsNullOrWhiteSpace(from) && DateTime.TryParse(from, out var f) ? f : DateTime.UtcNow.AddMonths(-1);
        var toDate = !string.IsNullOrWhiteSpace(to) && DateTime.TryParse(to, out var t) ? t : DateTime.UtcNow;

        var companies = await _db.Companies
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId && c.IsActive)
            .ToListAsync();

        var visits = await _db.MedicalVisits
            .AsNoTracking()
            .Include(v => v.Employee)
            .Where(v => v.TenantId == tenantId && v.VisitDate >= fromDate && v.VisitDate <= toDate)
            .ToListAsync();

        var summaries = companies.Select(comp =>
        {
            var compVisits = visits.Where(v => v.Employee?.CompanyId == comp.Id).ToList();
            int visitCount = compVisits.Count;
            decimal visitTotal = visitCount * 45.00m;
            decimal extraServicesTotal = visitCount * 20.00m; // Audiometry / Tests estimate
            decimal subtotal = visitTotal + extraServicesTotal;
            decimal vat = 0m; // Medical services exempt ex art. 10 DPR 633/72
            decimal total = subtotal + vat;

            return new
            {
                CompanyId = comp.Id,
                CompanyName = comp.Name,
                VatNumber = comp.VATNumber ?? comp.TaxCode,
                PEC = comp.PEC,
                VisitsCount = visitCount,
                VisitsTotal = visitTotal,
                ExtraServicesTotal = extraServicesTotal,
                Subtotal = subtotal,
                VatAmount = vat,
                TotalAmount = total,
                Period = $"{fromDate:dd/MM/yyyy} - {toDate:dd/MM/yyyy}"
            };
        }).Where(s => s.VisitsCount > 0 || companies.Count <= 5).ToList();

        return Ok(summaries);
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
