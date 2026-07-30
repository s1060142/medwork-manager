using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

/// <summary>
/// Controller gestione Fatturazione Elettronica (SDI)
/// </summary>
[ApiController]
[Route("api/electronic-invoice")]
[Authorize]
public class ElectronicInvoiceController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IElectronicInvoiceService _invoiceService;
    private readonly IElectronicInvoiceXmlService _xmlService;
    private readonly ISdiClient _sdiClient;
    private readonly SdiClientFactory _sdiFactory;
    private readonly IAuditService _auditService;
    private readonly ILogger<ElectronicInvoiceController> _logger;

    public ElectronicInvoiceController(
        AppDbContext db,
        IElectronicInvoiceService invoiceService,
        IElectronicInvoiceXmlService xmlService,
        ISdiClient sdiClient,
        SdiClientFactory sdiFactory,
        IAuditService auditService,
        ILogger<ElectronicInvoiceController> logger)
    {
        _db = db;
        _invoiceService = invoiceService;
        _xmlService = xmlService;
        _sdiClient = sdiClient;
        _sdiFactory = sdiFactory;
        _auditService = auditService;
        _logger = logger;
    }

    // ============================================================
    // CRUD FATTURE ELETTRONICHE
    // ============================================================

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] int? companyId, [FromQuery] int? year, [FromQuery] string? status, CancellationToken ct = default)
    {
        var cid = companyId ?? GetCompanyIdFromClaims();
        if (cid <= 0) return BadRequest("CompanyId richiesto");

        var invoices = await _invoiceService.GetByCompanyAsync(cid, year, status, ct);
        return Ok(invoices);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
    {
        var invoice = await _invoiceService.GetAsync(id, ct);
        if (invoice == null) return NotFound();
        return Ok(invoice);
    }

    [HttpPost]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> Create([FromBody] ElectronicInvoice invoice, CancellationToken ct = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        invoice.CompanyId = GetCompanyIdFromClaims();
        if (invoice.Year <= 0) invoice.Year = DateTime.UtcNow.Year;

        var created = await _invoiceService.CreateAsync(invoice, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> Update(int id, [FromBody] ElectronicInvoice invoice, CancellationToken ct = default)
    {
        if (id != invoice.Id) return BadRequest("Id mismatch");
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var existing = await _invoiceService.GetAsync(id, ct);
        if (existing == null) return NotFound();

        // Solo bozze modificabili
        if (existing.Status != "Bozza")
            return BadRequest("Solo fatture in bozza possono essere modificate");

        var updated = await _invoiceService.UpdateAsync(invoice, ct);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var result = await _invoiceService.DeleteAsync(id, ct);
        if (!result) return NotFound();
        return NoContent();
    }

    // ============================================================
    // GENERAZIONE XML
    // ============================================================

    [HttpGet("{id}/xml")]
    public async Task<IActionResult> GetXml(int id, CancellationToken ct = default)
    {
        var invoice = await _invoiceService.GetAsync(id, ct);
        if (invoice == null) return NotFound();

        var xml = await _xmlService.GenerateXmlAsync(id, ct);
        return Content(xml, "application/xml");
    }

    [HttpGet("{id}/xml/download")]
    public async Task<IActionResult> DownloadXml(int id, CancellationToken ct = default)
    {
        var invoice = await _invoiceService.GetAsync(id, ct);
        if (invoice == null) return NotFound();

        var xml = await _xmlService.GenerateXmlAsync(id, ct);
        var fileName = $"IT{invoice.SdiIdentifier ?? invoice.Number.ToString()}_{invoice.Year}.xml";
        
        return File(System.Text.Encoding.UTF8.GetBytes(xml), "application/xml", fileName);
    }

    // ============================================================
    // WORKFLOW SDI
    // ============================================================

    [HttpPost("{id}/send")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> SendToSdi(int id, CancellationToken ct = default)
    {
        var invoice = await _invoiceService.GetAsync(id, ct);
        if (invoice == null) return NotFound();

        if (invoice.Status != "Bozza" && invoice.Status != "DaInviare")
            return BadRequest($"Fattura non inviabile (stato: {invoice.Status})");

        var result = await _invoiceService.SendToSdiAsync(id, ct);
        
        if (result.Success)
        {
            return Ok(new { 
                success = true, 
                message = "Fattura inviata a SDI",
                sdiIdentifier = result.SdiIdentifier,
                fileName = result.FileName
            });
        }
        else
        {
            return BadRequest(new { 
                success = false, 
                errorCode = result.ErrorCode,
                errorMessage = result.ErrorMessage
            });
        }
    }

    [HttpPost("{id}/check-status")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> CheckSdiStatus(int id, CancellationToken ct = default)
    {
        var result = await _invoiceService.CheckStatusAsync(id, ct);
        
        if (result.Success)
        {
            return Ok(new
            {
                success = true,
                status = result.Status,
                resultCode = result.ResultCode,
                resultDescription = result.ResultDescription,
                responseDate = result.ResponseDate
            });
        }

        return BadRequest(new
        {
            success = false,
            errorCode = result.ResultCode,
            errorMessage = result.ResultDescription
        });
    }

    [HttpPost("process-notifications")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Secretary)]
    public async Task<IActionResult> ProcessNotifications(CancellationToken ct = default)
    {
        var companyId = GetCompanyIdFromClaims();
        var count = await _invoiceService.ProcessSdiNotificationsAsync(companyId, ct);
        
        return Ok(new { processed = count });
    }

    // ============================================================
    // NUMERAZIONE
    // ============================================================

    [HttpGet("next-number")]
    public async Task<IActionResult> GetNextNumber([FromQuery] int? companyId, [FromQuery] int? year, CancellationToken ct = default)
    {
        var cid = companyId ?? GetCompanyIdFromClaims();
        var yr = year ?? DateTime.UtcNow.Year;
        
        var next = await _invoiceService.GetNextInvoiceNumberAsync(cid, yr, ct);
        return Ok(new { nextNumber = next, year = yr });
    }

    // ============================================================
    // LISTINI PREZZI
    // ============================================================

    [HttpGet("pricelist")]
    public async Task<IActionResult> GetPriceList([FromQuery] int? companyId, CancellationToken ct = default)
    {
        var cid = companyId ?? GetCompanyIdFromClaims();
        var list = await _db.PriceLists
            .Where(x => x.CompanyId == cid)
            .OrderBy(x => x.Code)
            .ToListAsync(ct);
        
        return Ok(list);
    }

    [HttpPost("pricelist")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Secretary)]
    public async Task<IActionResult> SavePriceList([FromBody] PriceList item, CancellationToken ct = default)
    {
        item.CompanyId = GetCompanyIdFromClaims();
        
        if (item.Id <= 0)
            _db.PriceLists.Add(item);
        else
            _db.PriceLists.Update(item);

        await _db.SaveChangesAsync(ct);
        return Ok(item);
    }

    [HttpDelete("pricelist/{id}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> DeletePriceList(int id, CancellationToken ct = default)
    {
        var item = await _db.PriceLists.FindAsync(new object[] { id }, ct);
        if (item == null) return NotFound();
        
        _db.PriceLists.Remove(item);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ============================================================
    // PREVENTIVI
    // ============================================================

    [HttpGet("quotes")]
    public async Task<IActionResult> GetQuotes([FromQuery] int? companyId, [FromQuery] int? year, [FromQuery] string? status, CancellationToken ct = default)
    {
        var cid = companyId ?? GetCompanyIdFromClaims();
        
        var query = _db.Quotes.Where(q => q.CompanyId == cid);
        
        if (year.HasValue) query = query.Where(q => q.Year == year.Value);
        if (!string.IsNullOrEmpty(status)) query = query.Where(q => q.Status == status);
        
        var quotes = await query.OrderByDescending(q => q.IssueDate).ToListAsync(ct);
        return Ok(quotes);
    }

    [HttpPost("quotes")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> CreateQuote([FromBody] Quote quote, CancellationToken ct = default)
    {
        quote.CompanyId = GetCompanyIdFromClaims();
        if (quote.Year <= 0) quote.Year = DateTime.UtcNow.Year;
        quote.Status = "Bozza";
        quote.CreatedAt = DateTime.UtcNow;

        // Calcola importi
        _invoiceService.CalculateTotals(quote);
        
        // Genera numero
        quote.Number = await GetNextQuoteNumberAsync(quote.CompanyId, quote.Year, ct);

        _db.Quotes.Add(quote);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetQuoteById), new { id = quote.Id }, quote);
    }

    [HttpGet("quotes/{id}")]
    public async Task<IActionResult> GetQuoteById(int id, CancellationToken ct = default)
    {
        var quote = await _db.Quotes
            .Include(q => q.Company)
            .FirstOrDefaultAsync(q => q.Id == id, ct);
        
        if (quote == null) return NotFound();
        return Ok(quote);
    }

    [HttpPut("quotes/{id}")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> UpdateQuote(int id, [FromBody] Quote quote, CancellationToken ct = default)
    {
        if (id != quote.Id) return BadRequest();
        
        var existing = await _db.Quotes.FindAsync(new object[] { id }, ct);
        if (existing == null) return NotFound();

        _invoiceService.CalculateTotals(quote);
        
        existing.Status = quote.Status;
        existing.ValidityDate = quote.ValidityDate;
        existing.Notes = quote.Notes;
        existing.LinesJson = quote.LinesJson;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.TaxableAmount = quote.TaxableAmount;
        existing.VatAmount = quote.VatAmount;
        existing.TotalAmount = quote.TotalAmount;

        await _db.SaveChangesAsync(ct);
        return Ok(existing);
    }

    [HttpPost("quotes/{id}/convert-to-invoice")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> ConvertQuoteToInvoice(int id, CancellationToken ct = default)
    {
        var quote = await _db.Quotes.FindAsync(new object[] { id }, ct);
        if (quote == null) return NotFound("Preventivo non trovato");

        if (quote.Status != "Accettato")
            return BadRequest("Solo preventivi accettati possono essere convertiti in fattura");

        var invoice = new ElectronicInvoice
        {
            CompanyId = quote.CompanyId,
            DocumentType = "TD01",
            Number = await _invoiceService.GetNextInvoiceNumberAsync(quote.CompanyId, DateTime.UtcNow.Year, ct),
            Year = DateTime.UtcNow.Year,
            IssueDate = DateTime.UtcNow,
            RecipientCode = "0000000", // Da compilare
            LinesJson = quote.LinesJson,
            PaymentDataJson = quote.PaymentDataJson,
            Notes = quote.Notes,
            Status = "Bozza"
        };

        _invoiceService.CalculateTotals(invoice);

        var created = await _invoiceService.CreateAsync(invoice, ct);
        
        quote.Status = "Convertito";
        quote.ConvertedToInvoiceId = created.Id;
        quote.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(created);
    }

    // ============================================================
    // CONFIGURAZIONE SDI
    // ============================================================

    [HttpGet("sdi-config")]
    public async Task<IActionResult> GetSdiConfig([FromQuery] int? companyId, CancellationToken ct = default)
    {
        var cid = companyId ?? GetCompanyIdFromClaims();
        var config = await _db.SdiConfigurations.FirstOrDefaultAsync(c => c.CompanyId == cid, ct);
        return Ok(config);
    }

    [HttpPost("sdi-config")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> SaveSdiConfig([FromBody] SdiConfiguration config, CancellationToken ct = default)
    {
        config.CompanyId = GetCompanyIdFromClaims();

        var existing = await _db.SdiConfigurations.FirstOrDefaultAsync(c => c.CompanyId == config.CompanyId, ct);
        
        if (existing == null)
        {
            config.IsActive = true;
            _db.SdiConfigurations.Add(config);
        }
        else
        {
            existing.Channel = config.Channel;
            existing.TransmitterId = config.TransmitterId;
            existing.IsTestEnvironment = config.IsTestEnvironment;
            existing.CertificateBase64 = config.CertificateBase64;
            existing.CertificatePasswordEncrypted = config.CertificatePasswordEncrypted;
            existing.SenderPec = config.SenderPec;
            existing.PecPasswordEncrypted = config.PecPasswordEncrypted;
            existing.PecSmtpServer = config.PecSmtpServer;
            existing.PecSmtpPort = config.PecSmtpPort;
            existing.IsActive = true;
        }

        await _db.SaveChangesAsync(ct);
        return Ok(config);
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private int GetCompanyIdFromClaims()
    {
        var claim = User.FindFirst("companyId")?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    private async Task<int> GetNextQuoteNumberAsync(int companyId, int year, CancellationToken ct = default)
    {
        var maxNum = await _db.Quotes
            .Where(q => q.CompanyId == companyId && q.Year == year)
            .MaxAsync(q => (int?)q.Number, ct) ?? 0;
        
        return maxNum + 1;
    }
}