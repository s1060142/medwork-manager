using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedWork.Api.Services;

/// <summary>
/// Servizio gestione fatturazione elettronica (CRUD + workflow SDI)
/// </summary>
public class ElectronicInvoiceService : IElectronicInvoiceService
{
    private readonly AppDbContext _dbContext;
    private readonly IElectronicInvoiceXmlService _xmlService;
    private readonly ISdiClient _sdiClient;
    private readonly SdiClientFactory _sdiFactory;
    private readonly ILogger<ElectronicInvoiceService> _logger;
    private readonly IAuditService _auditService;

    public ElectronicInvoiceService(
        AppDbContext dbContext,
        IElectronicInvoiceXmlService xmlService,
        ISdiClient sdiClient,
        SdiClientFactory sdiFactory,
        ILogger<ElectronicInvoiceService> logger,
        IAuditService auditService)
    {
        _dbContext = dbContext;
        _xmlService = xmlService;
        _sdiClient = sdiClient;
        _sdiFactory = sdiFactory;
        _logger = logger;
        _auditService = auditService;
    }

    // ============================================================
    // CRUD
    // ============================================================

    public async Task<ElectronicInvoice> CreateAsync(ElectronicInvoice invoice, CancellationToken ct = default)
    {
        // Genera numero progressivo se non fornito
        if (invoice.Number <= 0)
        {
            invoice.Number = await GetNextInvoiceNumberAsync(invoice.CompanyId, invoice.Year, ct);
        }

        // Calcola importi se righe presenti
        if (!string.IsNullOrEmpty(invoice.LinesJson))
        {
            CalculateTotals(invoice);
        }

        invoice.Status = "Bozza";
        invoice.CreatedAt = DateTime.UtcNow;
        _dbContext.ElectronicInvoices.Add(invoice);
        await _dbContext.SaveChangesAsync(ct);
        await _auditService.LogAsync("ElectronicInvoice", "Create", invoice.Id, $"Fattura {invoice.Number}/{invoice.Year} creata", ct);
        return invoice;
    }

    public async Task<ElectronicInvoice?> GetAsync(int id, CancellationToken ct = default)
    {
        return await _dbContext.ElectronicInvoices
            .Include(i => i.Company)
            .Include(i => i.Logs)
            .FirstOrDefaultAsync(i => i.Id == id, ct);
    }

    public async Task<List<ElectronicInvoice>> GetByCompanyAsync(int companyId, int? year = null, string? status = null, CancellationToken ct = default)
    {
        var query = _dbContext.ElectronicInvoices
            .Include(i => i.Company)
            .Where(i => i.CompanyId == companyId);

        if (year.HasValue)
            query = query.Where(i => i.Year == year.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(i => i.Status == status);

        return await query.OrderByDescending(i => i.IssueDate).ThenByDescending(i => i.Number).ToListAsync(ct);
    }

    public async Task<ElectronicInvoice> UpdateAsync(ElectronicInvoice invoice, CancellationToken ct = default)
    {
        var existing = await _dbContext.ElectronicInvoices.FindAsync(new object[] { invoice.Id }, ct);
        if (existing == null)
            throw new KeyNotFoundException($"Fattura {invoice.Id} non trovata");

        // Ricalcola importi se righe cambiate
        if (!string.IsNullOrEmpty(invoice.LinesJson))
        {
            CalculateTotals(invoice);
        }

        existing.DocumentType = invoice.DocumentType;
        existing.IssueDate = invoice.IssueDate;
        existing.RecipientCode = invoice.RecipientCode;
        existing.RecipientPec = invoice.RecipientPec;
        existing.RecipientVatNumber = invoice.RecipientVatNumber;
        existing.RecipientTaxCode = invoice.RecipientTaxCode;
        existing.RecipientName = invoice.RecipientName;
        existing.RecipientAddress = invoice.RecipientAddress;
        existing.RecipientPostalCode = invoice.RecipientPostalCode;
        existing.RecipientCity = invoice.RecipientCity;
        existing.RecipientProvince = invoice.RecipientProvince;
        existing.RecipientCountry = invoice.RecipientCountry;
        existing.IsPublicAdministration = invoice.IsPublicAdministration;
        existing.Cig = invoice.Cig;
        existing.Cup = invoice.Cup;
        existing.OrderReference = invoice.OrderReference;
        existing.Notes = invoice.Notes;
        existing.LinesJson = invoice.LinesJson;
        existing.PaymentDataJson = invoice.PaymentDataJson;
        existing.AttachmentsJson = invoice.AttachmentsJson;
        existing.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        await _auditService.LogAsync("ElectronicInvoice", "Update", existing.Id, $"Fattura {existing.Number}/{existing.Year} aggiornata", ct);

        return existing;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var invoice = await _dbContext.ElectronicInvoices.FindAsync(new object[] { id }, ct);
        if (invoice == null)
            return false;

        // Solo bozza eliminabile
        if (invoice.Status != "Bozza")
            throw new InvalidOperationException("Solo fatture in bozza possono essere eliminate");

        _dbContext.ElectronicInvoices.Remove(invoice);
        await _dbContext.SaveChangesAsync(ct);

        await _auditService.LogAsync("ElectronicInvoice", "Delete", invoice.Id, $"Fattura {invoice.Number}/{invoice.Year} eliminata", ct);

        return true;
    }

    // ============================================================
    // WORKFLOW SDI
    // ============================================================

    public async Task<SdiSendResult> SendToSdiAsync(int invoiceId, CancellationToken ct = default)
    {
        var invoice = await GetAsync(invoiceId, ct) ?? throw new KeyNotFoundException($"Fattura {invoiceId} non trovata");
        var company = invoice.Company ?? await _dbContext.Companies.FindAsync(new object[] { invoice.CompanyId }, ct) ?? throw new KeyNotFoundException("Azienda non trovata");
        var config = await _dbContext.SdiConfigurations.FirstOrDefaultAsync(c => c.CompanyId == company.Id, ct);
        if (config == null)
            throw new InvalidOperationException("Configurazione SDI non trovata per questa azienda");

        // Genera XML
        var xml = await _xmlService.GenerateXmlAsync(invoiceId, ct);

        // Aggiorna identificativo SDI
        if (string.IsNullOrEmpty(invoice.SdiIdentifier))
        {
            invoice.SdiIdentifier = GenerateSdiIdentifier(config.TransmitterId);
            await _dbContext.SaveChangesAsync(ct);
        }

        // Crea log
        var log = new ElectronicInvoiceLog
        {
            ElectronicInvoiceId = invoice.Id,
            Action = "Invio",
            Timestamp = DateTime.UtcNow,
            Description = $"Invio fattura {invoice.Number}/{invoice.Year} a SDI via {config.Channel}"
        };
        _dbContext.ElectronicInvoiceLogs.Add(log);

        try
        {
            // Invia via canale appropriato
            var client = _sdiFactory.CreateClient(config);
            var result = await client.SendInvoiceAsync(invoice, xml, config, ct);

            if (result.Success)
            {
                invoice.Status = "Inviata";
                invoice.SdiIdentifier = result.SdiIdentifier;
                invoice.SdiFileName = result.FileName;
                invoice.SdiSentAt = DateTime.UtcNow;

                log.Action = "InvioOk";
                log.Description = $"Fattura inviata con successo. ID SDI: {result.SdiIdentifier}";
            }
            else
            {
                invoice.Status = "ErroreInvio";
                log.Action = "InvioErrore";
                log.Description = $"Errore invio: {result.ErrorCode} - {result.ErrorMessage}";
            }

            await _dbContext.SaveChangesAsync(ct);
            await _auditService.LogAsync("ElectronicInvoice", "SendToSdi", invoice.Id, log.Description, ct);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Eccezione invio fattura {InvoiceId}", invoiceId);
            invoice.Status = "ErroreInvio";
            log.Action = "InvioEccezione";
            log.Description = $"Eccezione: {ex.Message}";
            await _dbContext.SaveChangesAsync(ct);

            return new SdiSendResult { Success = false, ErrorCode = "EXCEPTION", ErrorMessage = ex.Message };
        }
    }

    public async Task<SdiResponseResult> CheckStatusAsync(int invoiceId, CancellationToken ct = default)
    {
        var invoice = await GetAsync(invoiceId, ct) ?? throw new KeyNotFoundException($"Fattura {invoiceId} non trovata");

        if (string.IsNullOrEmpty(invoice.SdiIdentifier))
            throw new InvalidOperationException("Fattura non ancora inviata a SDI");

        var company = invoice.Company ?? await _dbContext.Companies.FindAsync(new object[] { invoice.CompanyId }, ct);
        var config = await _dbContext.SdiConfigurations.FirstOrDefaultAsync(c => c.CompanyId == company!.Id, ct);

        if (config == null)
            throw new InvalidOperationException("Configurazione SDI non trovata");

        var client = _sdiFactory.CreateClient(config);
        var result = await client.CheckStatusAsync(invoice.SdiIdentifier!, config, ct);

        // Aggiorna stato fattura in base a risposta
        if (result.Success && !string.IsNullOrEmpty(result.Status))
        {
            invoice.Status = MapSdiStatus(result.Status);
            invoice.SdiResultCode = result.ResultCode;
            invoice.SdiResultDescription = result.ResultDescription;
            invoice.SdiResponseAt = result.ResponseDate;
            await _dbContext.SaveChangesAsync(ct);

            var log = new ElectronicInvoiceLog
            {
                ElectronicInvoiceId = invoice.Id,
                Action = "StatoAggiornato",
                Timestamp = DateTime.UtcNow,
                Description = $"Stato SDI aggiornato: {result.Status} ({result.ResultCode})"
            };
            _dbContext.ElectronicInvoiceLogs.Add(log);
            await _dbContext.SaveChangesAsync(ct);

            await _auditService.LogAsync("ElectronicInvoice", "CheckSdiStatus", invoice.Id, $"Stato fattura {invoice.Number}: {result.Status}", ct);
        }

        return result;
    }

    public async Task<int> ProcessSdiNotificationsAsync(int companyId, CancellationToken ct = default)
    {
        var config = await _dbContext.SdiConfigurations.FirstOrDefaultAsync(c => c.CompanyId == companyId, ct);
        if (config == null)
            return 0;

        var client = _sdiFactory.CreateClient(config);
        var since = DateTime.UtcNow.AddDays(-7); // Ultimi 7 giorni
        var notifications = await client.FetchNotificationsAsync(config, since, ct);

        int processed = 0;
        foreach (var notif in notifications)
        {
            var invoice = await _dbContext.ElectronicInvoices
                .FirstOrDefaultAsync(i => i.SdiIdentifier == notif.SdiIdentifier, ct);

            if (invoice == null)
            {
                _logger.LogWarning("Notifica SDI per fattura sconosciuta: {SdiId}", notif.SdiIdentifier);
                continue;
            }

            // Aggiorna stato in base a tipo notifica
            var oldStatus = invoice.Status;
            invoice.Status = MapNotificationToStatus(notif.NotificationType, notif.ResultCode);
            invoice.SdiResultCode = notif.ResultCode;
            invoice.SdiResultDescription = notif.Description;
            invoice.SdiResponseAt = notif.Timestamp;

            var log = new ElectronicInvoiceLog
            {
                ElectronicInvoiceId = invoice.Id,
                Action = "NotificaRicevuta",
                Timestamp = DateTime.UtcNow,
                Description = $"Notifica {notif.NotificationType}: {notif.Description} ({notif.ResultCode})"
            };
            _dbContext.ElectronicInvoiceLogs.Add(log);

            await _auditService.LogAsync("ElectronicInvoice", "SdiNotification", invoice.Id, $"Fattura {invoice.Number}: {oldStatus} -> {invoice.Status} ({notif.NotificationType})", ct);

            processed++;
        }

        await _dbContext.SaveChangesAsync(ct);
        return processed;
    }

    // ============================================================
    // UTILITIES
    // ============================================================

    public async Task<int> GetNextInvoiceNumberAsync(int companyId, int year, CancellationToken ct = default)
    {
        var maxNum = await _dbContext.ElectronicInvoices
            .Where(i => i.CompanyId == companyId && i.Year == year)
            .MaxAsync(i => (int?)i.Number, ct) ?? 0;

        return maxNum + 1;
    }

    public void CalculateTotals(ElectronicInvoice invoice)
    {
        if (string.IsNullOrEmpty(invoice.LinesJson))
            return;

        var lines = System.Text.Json.JsonSerializer.Deserialize<List<ElectronicInvoiceLine>>(invoice.LinesJson);
        if (lines == null || lines.Count == 0)
            return;

        invoice.TaxableAmount = lines.Sum(l => l.NetAmount);
        invoice.VatAmount = lines.Sum(l => l.NetAmount * l.VatRate / 100m);
        invoice.TotalAmount = invoice.TaxableAmount + invoice.VatAmount;
    }

    public void CalculateTotals(Quote quote)
    {
        if (string.IsNullOrEmpty(quote.LinesJson))
            return;

        var lines = System.Text.Json.JsonSerializer.Deserialize<List<QuoteLine>>(quote.LinesJson);
        if (lines == null || lines.Count == 0)
            return;

        quote.TaxableAmount = lines.Sum(l => l.NetAmount);
        quote.VatAmount = lines.Sum(l => l.NetAmount * l.VatRate / 100m);
        quote.TotalAmount = quote.TaxableAmount + quote.VatAmount;
    }

    private string GenerateSdiIdentifier(string transmitterId)
    {
        return $"IT{transmitterId}_{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    }

    private static string MapSdiStatus(string sdiStatus)
    {
        return sdiStatus.ToLowerInvariant() switch
        {
            "accettata" => "Accettata",
            "scartata" => "Scartata",
            "consegnata" => "Consegnata",
            "nonconsegnata" => "NonConsegnata",
            "decorrenzatermini" => "DecorrenzaTermini",
            _ => sdiStatus
        };
    }

    private static string MapNotificationToStatus(string notificationType, string? resultCode)
    {
        return notificationType switch
        {
            "RC" => "Consegnata",       // Ricevuta Consegna
            "MC" => "NonConsegnata",    // Mancata Consegna
            "DT" => "DecorrenzaTermini", // Decorrenza Termini
            "NS" => "Scartata",         // Notifica Scarto (da SDI)
            _ => "Sconosciuto"
        };
    }
}

/// <summary>
/// Interfaccia servizio fatturazione elettronica
/// </summary>
public interface IElectronicInvoiceService
{
    Task<ElectronicInvoice> CreateAsync(ElectronicInvoice invoice, CancellationToken ct = default);
    Task<ElectronicInvoice?> GetAsync(int id, CancellationToken ct = default);
    Task<List<ElectronicInvoice>> GetByCompanyAsync(int companyId, int? year = null, string? status = null, CancellationToken ct = default);
    Task<ElectronicInvoice> UpdateAsync(ElectronicInvoice invoice, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<SdiSendResult> SendToSdiAsync(int invoiceId, CancellationToken ct = default);
    Task<SdiResponseResult> CheckStatusAsync(int invoiceId, CancellationToken ct = default);
    Task<int> ProcessSdiNotificationsAsync(int companyId, CancellationToken ct = default);
    Task<int> GetNextInvoiceNumberAsync(int companyId, int year, CancellationToken ct = default);
    void CalculateTotals(ElectronicInvoice invoice);
    void CalculateTotals(Quote quote);
}