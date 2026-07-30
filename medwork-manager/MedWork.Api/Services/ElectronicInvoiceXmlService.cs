using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Services;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Xml;

namespace MedWork.Api.Services;

/// <summary>
/// Servizio generazione XML Fattura Elettronica (formato Agenzia Entrate)
/// Conforme a tracciato XML FatturaPA v1.2.1 / FatturaB2B
/// </summary>
public class ElectronicInvoiceXmlService : IElectronicInvoiceXmlService
{
    private readonly AppDbContext _db;
    private readonly ILogger<ElectronicInvoiceXmlService> _logger;

    public ElectronicInvoiceXmlService(AppDbContext db, ILogger<ElectronicInvoiceXmlService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<string> GenerateXmlAsync(int electronicInvoiceId, CancellationToken ct = default)
    {
        var invoice = await _db.ElectronicInvoices
            .AsNoTracking()
            .Include(i => i.Company)
            .FirstOrDefaultAsync(i => i.Id == electronicInvoiceId, ct);

        if (invoice == null)
            throw new KeyNotFoundException($"Fattura elettronica {electronicInvoiceId} non trovata");

        var company = invoice.Company ?? throw new InvalidOperationException("Azienda emittente non trovata");

        var lines = System.Text.Json.JsonSerializer.Deserialize<List<ElectronicInvoiceLine>>(invoice.LinesJson) 
            ?? new List<ElectronicInvoiceLine>();

        var payment = !string.IsNullOrEmpty(invoice.PaymentDataJson)
            ? System.Text.Json.JsonSerializer.Deserialize<ElectronicInvoicePayment>(invoice.PaymentDataJson)
            : null;

        return GenerateXml(invoice, company, lines, payment);
    }

    public string GenerateXml(ElectronicInvoice invoice, Company company, List<ElectronicInvoiceLine> lines, ElectronicInvoicePayment? payment)
    {
        var settings = new XmlWriterSettings
        {
            Encoding = Encoding.UTF8,
            Indent = true,
            IndentChars = "  ",
            NewLineChars = "\n",
            OmitXmlDeclaration = false
        };

        var sb = new StringBuilder();
        using var writer = XmlWriter.Create(sb, settings);

        writer.WriteStartDocument();
        
        // FatturaElettronica root
        writer.WriteStartElement("FatturaElettronica", "http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatturapa/v1.2.1");
        writer.WriteAttributeString("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
        writer.WriteAttributeString("versione", "FPR12");

        // FatturaElettronicaHeader
        WriteHeader(writer, invoice, company);

        // FatturaElettronicaBody
        writer.WriteStartElement("FatturaElettronicaBody");
        WriteInvoiceBody(writer, invoice, company, lines, payment);
        writer.WriteEndElement(); // FatturaElettronicaBody

        writer.WriteEndElement(); // FatturaElettronica
        writer.WriteEndDocument();

        return sb.ToString();
    }

    private void WriteHeader(XmlWriter w, ElectronicInvoice invoice, Company company)
    {
        w.WriteStartElement("FatturaElettronicaHeader");

        // DatiTrasmissione
        w.WriteStartElement("DatiTrasmissione");
        w.WriteElementString("IdTrasmittente", GetTransmitterId(company));
        w.WriteElementString("ProgressivoInvio", invoice.SdiIdentifier ?? GenerateProgressivoInvio());
        w.WriteElementString("FormatoTrasmissione", "FPR12");
        w.WriteElementString("CodiceDestinatario", invoice.RecipientCode ?? "0000000");
        
        if (!string.IsNullOrEmpty(invoice.RecipientPec))
            w.WriteElementString("PECDestinatario", invoice.RecipientPec);

        w.WriteEndElement(); // DatiTrasmissione

        // CedentePrestatore (Emittente)
        w.WriteStartElement("CedentePrestatore");
        WriteDatiAnagrafici(w, company);
        WriteSede(w, company);
        w.WriteEndElement(); // CedentePrestatore

        // RappresentanteFiscale (opzionale, per non residenti)
        // Non implementato per ora

        // CessionarioCommittente (Destinatario)
        w.WriteStartElement("CessionarioCommittente");
        WriteDatiAnagraficiDestinatario(w, invoice);
        WriteSedeDestinatario(w, invoice);
        w.WriteEndElement(); // CessionarioCommittente

        // TerzoIntermediarioOSoggettoEmittente (opzionale)

        // SoggettoEmittente (se diverso da cedente)
        if (company.VATNumber != invoice.RecipientVatNumber)
        {
            w.WriteStartElement("SoggettoEmittente");
            w.WriteElementString("Identificativo", GetTransmitterId(company));
            w.WriteEndElement();
        }

        w.WriteEndElement(); // FatturaElettronicaHeader
    }

    private void WriteInvoiceBody(XmlWriter w, ElectronicInvoice invoice, Company company, List<ElectronicInvoiceLine> lines, ElectronicInvoicePayment? payment)
    {
        w.WriteStartElement("DatiGenerali");
        w.WriteStartElement("DatiGeneraliDocumento");
        
        w.WriteElementString("TipoDocumento", invoice.DocumentType);
        w.WriteElementString("Divisa", "EUR");
        w.WriteElementString("Data", invoice.IssueDate.ToString("yyyy-MM-dd"));
        w.WriteElementString("Numero", invoice.Number.ToString());
        
        if (!string.IsNullOrEmpty(invoice.OrderReference))
            w.WriteElementString("RiferimentoAmministrazione", invoice.OrderReference);
        
        if (!string.IsNullOrEmpty(invoice.Cig))
            w.WriteElementString("RiferimentoAmministrazione", invoice.Cig);
        
        if (!string.IsNullOrEmpty(invoice.Cup))
            w.WriteElementString("CodiceCUP", invoice.Cup);

        if (!string.IsNullOrEmpty(invoice.Notes))
            w.WriteElementString("Causale", invoice.Notes);

        w.WriteEndElement(); // DatiGeneraliDocumento

        // DatiOrdineAcquisto (opzionale)
        // DatiContratto (opzionale)
        // DatiConvenzione (opzionale)
        // DatiRicezione (opzionale)
        // DatiFattureCollegate (opzionale)

        w.WriteEndElement(); // DatiGenerali

        // DatiBeniServizi
        w.WriteStartElement("DatiBeniServizi");
        
        foreach (var line in lines)
        {
            w.WriteStartElement("DettaglioLinee");
            w.WriteElementString("NumeroLinea", line.LineNumber.ToString());
            
            if (!string.IsNullOrEmpty(line.ReferenceItemCode))
                w.WriteElementString("CodiceArticolo", line.ReferenceItemCode);
            
            w.WriteElementString("Descrizione", line.Description);
            w.WriteElementString("Quantita", line.Quantity.ToString("F4"));
            w.WriteElementString("UnitaMisura", line.UnitOfMeasure);
            w.WriteElementString("PrezzoUnitario", line.UnitPrice.ToString("F4"));
            
            if (line.DiscountRate > 0)
                w.WriteElementString("ScontoMaggiorazione", line.DiscountRate.ToString("F2"));
            
            w.WriteElementString("PrezzoTotale", line.NetAmount.ToString("F2"));
            w.WriteElementString("AliquotaIVA", line.VatRate.ToString("F2"));
            
            // Natura operazione (solo per non imponibili/esenti)
            if (line.VatRate == 0 || line.VatNature != "N1")
                w.WriteElementString("Natura", line.VatNature);
            
            w.WriteEndElement(); // DettaglioLinee
        }

        // DatiRiepilogo (per aliquota IVA)
        var riepiloghi = lines
            .GroupBy(l => new { l.VatRate, l.VatNature })
            .Select(g => new 
            { 
                VatRate = g.Key.VatRate, 
                VatNature = g.Key.VatNature,
                Taxable = g.Sum(x => x.NetAmount),
                Vat = g.Sum(x => x.NetAmount * x.VatRate / 100)
            })
            .ToList();

        foreach (var r in riepiloghi)
        {
            w.WriteStartElement("DatiRiepilogo");
            w.WriteElementString("AliquotaIVA", r.VatRate.ToString("F2"));
            w.WriteElementString("ImponibileImporto", r.Taxable.ToString("F2"));
            w.WriteElementString("Imposta", r.Vat.ToString("F2"));
            
            if (r.VatNature != "N1")
                w.WriteElementString("Natura", r.VatNature);
            
            w.WriteEndElement(); // DatiRiepilogo
        }

        w.WriteEndElement(); // DatiBeniServizi

        // DatiPagamento
        if (payment != null)
        {
            w.WriteStartElement("DatiPagamento");
            w.WriteElementString("CondizioniPagamento", "TP02"); // TP01=Pagamento a rate, TP02=Pagamento a fine mese, TP03=Pagamento a 30gg, TP04=Pagamento a 60gg, TP05=Pagamento a 90gg, TP06=Pagamento a 120gg
            w.WriteElementString("DettaglioPagamento", "");
            w.WriteStartElement("DettaglioPagamento");
            w.WriteElementString("ModalitaPagamento", payment.PaymentMethod);
            
            if (!string.IsNullOrEmpty(payment.BankIban))
                w.WriteElementString("CodiceIBAN", payment.BankIban);
            
            if (!string.IsNullOrEmpty(payment.BankAbi))
                w.WriteElementString("ABI", payment.BankAbi);
            
            if (!string.IsNullOrEmpty(payment.BankCab))
                w.WriteElementString("CAB", payment.BankCab);
            
            if (!string.IsNullOrEmpty(payment.BankBic))
                w.WriteElementString("BIC", payment.BankBic);
            
            if (!string.IsNullOrEmpty(payment.BankAccountHolder))
                w.WriteElementString("IntestatarioConto", payment.BankAccountHolder);
            
            w.WriteElementString("DataScadenzaPagamento", payment.DueDate.ToString("yyyy-MM-dd"));
            w.WriteElementString("ImportoPagamento", payment.Amount.ToString("F2"));
            w.WriteEndElement(); // DettaglioPagamento
            w.WriteEndElement(); // DatiPagamento
        }

        // Allegati (opzionale)
        if (!string.IsNullOrEmpty(invoice.AttachmentsJson))
        {
            var attachments = System.Text.Json.JsonSerializer.Deserialize<List<InvoiceAttachment>>(invoice.AttachmentsJson) 
                ?? new List<InvoiceAttachment>();
            
            if (attachments.Any())
            {
                w.WriteStartElement("Allegati");
                foreach (var att in attachments)
                {
                    w.WriteStartElement("Allegato");
                    w.WriteElementString("NomeAttachment", att.FileName);
                    w.WriteElementString("FormatoAttachment", att.MimeType);
                    w.WriteElementString("DescrizioneAttachment", att.Description);
                    w.WriteElementString("Attachment", att.ContentBase64);
                    w.WriteEndElement();
                }
                w.WriteEndElement(); // Allegati
            }
        }
    }

    private void WriteDatiAnagrafici(XmlWriter w, Company company)
    {
        w.WriteStartElement("DatiAnagrafici");
        w.WriteStartElement("IdFiscaleIVA");
        w.WriteElementString("IdPaese", "IT");
        w.WriteElementString("IdCodice", company.VATNumber);
        w.WriteEndElement(); // IdFiscaleIVA

        if (!string.IsNullOrEmpty(company.TaxCode))
        {
            w.WriteElementString("CodiceFiscale", company.TaxCode);
        }

        w.WriteStartElement("Anagrafica");
        w.WriteElementString("Denominazione", company.Name);
        w.WriteEndElement(); // Anagrafica

        w.WriteElementString("RegimeFiscale", "RF01"); // RF01=Ordinario, RF02=Contribuenti minimi, ecc.
        w.WriteEndElement(); // DatiAnagrafici
    }

    private void WriteSede(XmlWriter w, Company company)
    {
        w.WriteStartElement("Sede");
        w.WriteElementString("Indirizzo", company.Address ?? "");
        w.WriteElementString("NumeroCivico", company.CivicNumber ?? "");
        w.WriteElementString("CAP", company.PostalCode ?? "");
        w.WriteElementString("Comune", company.City ?? "");
        w.WriteElementString("Provincia", company.Province ?? "");
        w.WriteElementString("Nazione", "IT");
        w.WriteEndElement(); // Sede
    }

    private void WriteDatiAnagraficiDestinatario(XmlWriter w, ElectronicInvoice invoice)
    {
        w.WriteStartElement("DatiAnagrafici");
        
        if (!string.IsNullOrEmpty(invoice.RecipientVatNumber))
        {
            w.WriteStartElement("IdFiscaleIVA");
            w.WriteElementString("IdPaese", invoice.RecipientCountry ?? "IT");
            w.WriteElementString("IdCodice", invoice.RecipientVatNumber);
            w.WriteEndElement(); // IdFiscaleIVA
        }

        if (!string.IsNullOrEmpty(invoice.RecipientTaxCode))
        {
            w.WriteElementString("CodiceFiscale", invoice.RecipientTaxCode);
        }

        w.WriteStartElement("Anagrafica");
        w.WriteElementString("Denominazione", invoice.RecipientName ?? "");
        w.WriteEndElement(); // Anagrafica

        w.WriteEndElement(); // DatiAnagrafici
    }

    private void WriteSedeDestinatario(XmlWriter w, ElectronicInvoice invoice)
    {
        w.WriteStartElement("Sede");
        w.WriteElementString("Indirizzo", invoice.RecipientAddress ?? "");
        w.WriteElementString("CAP", invoice.RecipientPostalCode ?? "");
        w.WriteElementString("Comune", invoice.RecipientCity ?? "");
        w.WriteElementString("Provincia", invoice.RecipientProvince ?? "");
        w.WriteElementString("Nazione", invoice.RecipientCountry ?? "IT");
        w.WriteEndElement(); // Sede
    }

    private string GetTransmitterId(Company company)
    {
        // Il trasmittente può essere l'intermediario o l'azienda stessa
        // Per semplicità usiamo la P.IVA dell'azienda
        return company.VATNumber;
    }

    private string GenerateProgressivoInvio()
    {
        return DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
    }
}

/// <summary>
/// Allegato fattura elettronica
/// </summary>
public class InvoiceAttachment
{
    public string FileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = "application/pdf";
    public string Description { get; set; } = string.Empty;
    public string ContentBase64 { get; set; } = string.Empty;
}

/// <summary>
/// Interfaccia per generazione XML
/// </summary>
public interface IElectronicInvoiceXmlService
{
    Task<string> GenerateXmlAsync(int electronicInvoiceId, CancellationToken ct = default);
    string GenerateXml(ElectronicInvoice invoice, Company company, List<ElectronicInvoiceLine> lines, ElectronicInvoicePayment? payment);
}