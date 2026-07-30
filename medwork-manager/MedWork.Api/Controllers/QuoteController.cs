using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

/// <summary>
/// Controller gestione Preventivi/Quote
/// </summary>
[ApiController]
[Route("api/quotes")]
[Authorize]
public class QuoteController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<QuoteController> _logger;

    public QuoteController(AppDbContext db, ILogger<QuoteController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private int GetCompanyIdFromClaims()
    {
        var claim = User.FindFirst("companyId")?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    [HttpGet]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> GetList([FromQuery] int? companyId, [FromQuery] string? status, CancellationToken ct = default)
    {
        var cid = companyId ?? GetCompanyIdFromClaims();
        if (cid <= 0) return BadRequest("CompanyId richiesto");

        var quotes = await _db.Quotes
            .Where(q => q.CompanyId == cid)
            .ApplyStatusFilter(status)
            .Include(q => q.Company)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync(ct);

        return Ok(quotes);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
    {
        var quote = await _db.Quotes
            .Include(q => q.Company)
            .FirstOrDefaultAsync(q => q.Id == id, ct);
        
        if (quote == null) return NotFound();
        
        var cid = GetCompanyIdFromClaims();
        if (quote.CompanyId != cid && !User.IsInRole(AppRole.Admin))
            return Forbid();

        return Ok(quote);
    }

    [HttpPost]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> Create([FromBody] Quote quote, CancellationToken ct = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        quote.CompanyId = GetCompanyIdFromClaims();
        if (quote.Year <= 0) quote.Year = DateTime.UtcNow.Year;
        
        var lastNumber = await _db.Quotes
            .Where(q => q.CompanyId == quote.CompanyId && q.Year == quote.Year)
            .MaxAsync(q => (int?)q.Number, ct) ?? 0;
        quote.Number = lastNumber + 1;
        quote.IssueDate = DateTime.UtcNow;

        var created = await _db.Quotes.AddAsync(quote, ct);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = quote.Id }, quote);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> Update(int id, [FromBody] Quote quote, CancellationToken ct = default)
    {
        if (id != quote.Id) return BadRequest("Id mismatch");
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var existing = await _db.Quotes.FindAsync([id], ct);
        if (existing == null) return NotFound();

        if (existing.Status != "Bozza")
            return BadRequest("Solo preventivi in bozza possono essere modificati");

        quote.CompanyId = existing.CompanyId;
        quote.CreatedAt = existing.CreatedAt;

        _db.Entry(existing).CurrentValues.SetValues(quote);
        await _db.SaveChangesAsync(ct);

        return Ok(quote);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var quote = await _db.Quotes.FindAsync([id], ct);
        if (quote == null) return NotFound();

        _db.Quotes.Remove(quote);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpPost("{id}/convert-to-invoice")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> ConvertToInvoice(int id, CancellationToken ct = default)
    {
        var quote = await _db.Quotes
            .Include(q => q.Company)
            .FirstOrDefaultAsync(q => q.Id == id, ct);
        
        if (quote == null) return NotFound();
        if (quote.Status != "Bozza" && quote.Status != "Inviato")
            return BadRequest("Solo preventivi in bozza o inviati possono essere convertiti");

        var invoice = new ElectronicInvoice
        {
            CompanyId = quote.CompanyId,
            Number = quote.Number,
            Year = quote.Year,
            Status = "Bozza",
            DocumentType = "TD01",
            RecipientName = quote.Company?.Name,
            RecipientVatNumber = quote.Company?.TaxCode,
            TaxableAmount = quote.TotalAmount,
            VatAmount = quote.VatAmount,
            TotalAmount = quote.TotalAmount,
            Notes = $"Convertito da preventivo #{quote.Number}"
        };

        var created = await _db.ElectronicInvoices.AddAsync(invoice, ct);
        quote.Status = "Convertito";
        quote.ConvertedToInvoiceId = invoice.Id;
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction("GetById", new { controller = "ElectronicInvoice", id = invoice.Id }, invoice);
    }
}

public static class QueryableExtensions
{
    public static IQueryable<Quote> ApplyStatusFilter(this IQueryable<Quote> query, string? status)
    {
        if (string.IsNullOrEmpty(status)) return query;
        
        return status switch
        {
            "Bozza" => query.Where(q => q.Status == "Bozza"),
            "Inviato" => query.Where(q => q.Status == "Inviato"),
            "Accettato" => query.Where(q => q.Status == "Accettato"),
            "Scaduto" => query.Where(q => q.Status == "Scaduto"),
            _ => query
        };
    }
}