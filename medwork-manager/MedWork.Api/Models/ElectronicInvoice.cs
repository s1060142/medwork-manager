using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Fattura Elettronica per invio a SDI (Sistema di Interscambio)
/// Supporta TD01-TD06, PA, B2B, B2C, estero
/// </summary>
public class ElectronicInvoice
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    /// <summary>
    /// Identificativo univoco per SDI (progressivo invio)
    /// </summary>
    [StringLength(50)]
    public string? SdiIdentifier { get; set; }

    /// <summary>
    /// Tipo documento: TD01=Fattura, TD02=Acconto, TD03=Acconto fattura, TD04=Nota credito, TD05=Nota debito, TD06=Parcellazione
    /// </summary>
    [Required]
    [StringLength(4)]
    public string DocumentType { get; set; } = "TD01";

    /// <summary>
    /// Numero fattura progressivo per anno
    /// </summary>
    public int Number { get; set; }

    /// <summary>
    /// Anno fattura
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Data emissione
    /// </summary>
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Importo totale documento
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Importo imponibile totale
    /// </summary>
    public decimal TaxableAmount { get; set; }

    /// <summary>
    /// IVA totale
    /// </summary>
    public decimal VatAmount { get; set; }

    /// <summary>
    /// Codice destinatario SDI (7 caratteri) o "0000000" per B2C/estero
    /// </summary>
    [StringLength(7)]
    public string? RecipientCode { get; set; }

    /// <summary>
    /// PEC destinatario (alternativa a codice destinatario)
    /// </summary>
    [StringLength(100)]
    [EmailAddress]
    public string? RecipientPec { get; set; }

    /// <summary>
    /// Partita IVA destinatario
    /// </summary>
    [StringLength(20)]
    public string? RecipientVatNumber { get; set; }

    /// <summary>
    /// Codice fiscale destinatario
    /// </summary>
    [StringLength(16)]
    public string? RecipientTaxCode { get; set; }

    /// <summary>
    /// Denominazione/Ragione sociale destinatario
    /// </summary>
    [StringLength(200)]
    public string? RecipientName { get; set; }

    /// <summary>
    /// Indirizzo destinatario
    /// </summary>
    [StringLength(200)]
    public string? RecipientAddress { get; set; }

    /// <summary>
    /// CAP destinatario
    /// </summary>
    [StringLength(10)]
    public string? RecipientPostalCode { get; set; }

    /// <summary>
    /// Città destinatario
    /// </summary>
    [StringLength(100)]
    public string? RecipientCity { get; set; }

    /// <summary>
    /// Provincia destinatario
    /// </summary>
    [StringLength(2)]
    public string? RecipientProvince { get; set; }

    /// <summary>
    /// Nazione destinatario (default IT)
    /// </summary>
    [StringLength(2)]
    public string? RecipientCountry { get; set; } = "IT";

    /// <summary>
    /// CIG (Codice Identificativo Gara) - obbligatorio per PA
    /// </summary>
    [StringLength(20)]
    public string? Cig { get; set; }

    /// <summary>
    /// CUP (Codice Unico Progetto) - per PA
    /// </summary>
    [StringLength(20)]
    public string? Cup { get; set; }

    /// <summary>
    /// Flag se destinatario è Pubblica Amministrazione
    /// </summary>
    public bool IsPublicAdministration { get; set; }

    /// <summary>
    /// Riferimento ordine/amministrazione
    /// </summary>
    [StringLength(100)]
    public string? OrderReference { get; set; }

    /// <summary>
    /// Note documento
    /// </summary>
    [StringLength(4000)]
    public string? Notes { get; set; }

    /// <summary>
    /// JSON righe fattura (ElectronicInvoiceLine[])
    /// </summary>
    public string LinesJson { get; set; } = "[]";

    /// <summary>
    /// JSON dati pagamento (ElectronicInvoicePayment)
    /// </summary>
    public string? PaymentDataJson { get; set; }

    /// <summary>
    /// JSON allegati (InvoiceAttachment[])
    /// </summary>
    public string? AttachmentsJson { get; set; }

    /// <summary>
    /// Stato elaborazione: Bozza, DaInviare, Inviata, Accettata, Scartata, Consegnata, NonConsegnata, DecorrenzaTermini
    /// </summary>
    [StringLength(30)]
    public string Status { get; set; } = "Bozza";

    /// <summary>
    /// Codice errore SDI (se scartata)
    /// </summary>
    [StringLength(10)]
    public string? SdiErrorCode { get; set; }

    /// <summary>
    /// Descrizione errore SDI
    /// </summary>
    [StringLength(1000)]
    public string? SdiErrorDescription { get; set; }

    /// <summary>
    /// Data invio a SDI
    /// </summary>
    public DateTime? SentAt { get; set; }

    /// <summary>
    /// Data risposta SDI
    /// </summary>
    public DateTime? SdiResponseAt { get; set; }

    /// <summary>
    /// File XML generato (per audit)
    /// </summary>
    public string? GeneratedXml { get; set; }

    /// <summary>
    /// File XML firmato (per audit)
    /// </summary>
    public string? SignedXml { get; set; }

    // Navigation
    public ICollection<SdiNotificationLog> SdiNotifications { get; set; } = new List<SdiNotificationLog>();

    // Electronic Invoice specific fields
    /// <summary>
    /// Data creazione
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Data ultimo aggiornamento
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Nome file XML inviato a SDI
    /// </summary>
    [StringLength(100)]
    public string? SdiFileName { get; set; }

    /// <summary>
    /// Data/ora invio a SDI
    /// </summary>
    public DateTime? SdiSentAt { get; set; }

    /// <summary>
    /// Codice esito SDI
    /// </summary>
    [StringLength(10)]
    public string? SdiResultCode { get; set; }

    /// <summary>
    /// Descrizione esito SDI
    /// </summary>
    [StringLength(1000)]
    public string? SdiResultDescription { get; set; }

    /// <summary>
    /// Log operazioni
    /// </summary>
    public ICollection<ElectronicInvoiceLog> Logs { get; set; } = new List<ElectronicInvoiceLog>();
}

/// <summary>
/// Riga fattura elettronica
/// </summary>
public class ElectronicInvoiceLine
{
    public int LineNumber { get; set; }

    /// <summary>
    /// Codice articolo/servizio (opzionale)
    /// </summary>
    public string? ReferenceItemCode { get; set; }

    /// <summary>
    /// Descrizione bene/servizio
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Quantità
    /// </summary>
    public decimal Quantity { get; set; } = 1;

    /// <summary>
    /// Unità di misura (es: PZ, ORE, GIORNI, KG)
    /// </summary>
    public string UnitOfMeasure { get; set; } = "PZ";

    /// <summary>
    /// Prezzo unitario
    /// </summary>
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Sconto/maggiorazione percentuale
    /// </summary>
    public decimal DiscountRate { get; set; } = 0;

    /// <summary>
    /// Importo netto riga
    /// </summary>
    public decimal NetAmount { get; set; }

    /// <summary>
    /// Aliquota IVA (es: 22, 10, 4, 0)
    /// </summary>
    public decimal VatRate { get; set; } = 22;

    /// <summary>
    /// Natura operazione IVA (N1-N6, N7 per non imponibili)
    /// </summary>
    [StringLength(2)]
    public string VatNature { get; set; } = "N1"; // N1=Escluso ex art.15, N2=Non soggetta, N3=Non imponibile, N4=Esente, N5=Regime del margine, N6=Inversione contabile, N7=IVA assolta in altro stato UE
}

/// <summary>
/// Dati pagamento fattura elettronica
/// </summary>
public class ElectronicInvoicePayment
{
    /// <summary>
    /// Modalità pagamento: MP01=Contanti, MP02=Assegno, MP03=Assegno circolare, MP04=Bonifico, MP05=Carta credito, MP06=Carta debito, MP07=Bollettino, MP08=RID, MP09=SEPA, MP10=Altro
    /// </summary>
    [StringLength(4)]
    public string PaymentMethod { get; set; } = "MP04"; // Default bonifico

    /// <summary>
    /// IBAN
    /// </summary>
    [StringLength(34)]
    public string? BankIban { get; set; }

    /// <summary>
    /// ABI
    /// </summary>
    [StringLength(5)]
    public string? BankAbi { get; set; }

    /// <summary>
    /// CAB
    /// </summary>
    [StringLength(5)]
    public string? BankCab { get; set; }

    /// <summary>
    /// BIC/SWIFT
    /// </summary>
    [StringLength(11)]
    public string? BankBic { get; set; }

    /// <summary>
    /// Intestatario conto
    /// </summary>
    [StringLength(100)]
    public string? BankAccountHolder { get; set; }

    /// <summary>
    /// Data scadenza pagamento
    /// </summary>
    public DateTime DueDate { get; set; }

    /// <summary>
    /// Importo rata
    /// </summary>
    public decimal Amount { get; set; }
}

/// <summary>
/// Configurazione canale SDI
/// </summary>
public class SdiConfiguration
{
    public int Id { get; set; }

    /// <summary>
    /// Nome configurazione
    /// </summary>
    [StringLength(100)]
    public string Name { get; set; } = "SDI Principale";

    /// <summary>
    /// Canale: SDICoop, SDIFtp, PEC
    /// </summary>
    [StringLength(20)]
    public string Channel { get; set; } = "SDICoop";

    /// <summary>
    /// ID trasmittente (Partita IVA)
    /// </summary>
    [Required]
    [StringLength(20)]
    public string TransmitterId { get; set; } = string.Empty;

    /// <summary>
    /// Ambiente test (true) o produzione (false)
    /// </summary>
    public bool IsTestEnvironment { get; set; } = true;

    /// <summary>
    /// Certificato digitale per firma (Base64 .pfx)
    /// </summary>
    public string? CertificateBase64 { get; set; }

    /// <summary>
    /// Password certificato (cifrata)
    /// </summary>
    public string? CertificatePasswordEncrypted { get; set; }

    /// <summary>
    /// PEC mittente (per canale PEC)
    /// </summary>
    [StringLength(100)]
    [EmailAddress]
    public string? SenderPec { get; set; }

    /// <summary>
    /// Password PEC (cifrata)
    /// </summary>
    public string? PecPasswordEncrypted { get; set; }

    /// <summary>
    /// Server SMTP PEC
    /// </summary>
    [StringLength(100)]
    public string? PecSmtpServer { get; set; }

    /// <summary>
    /// Porta SMTP PEC
    /// </summary>
    public int PecSmtpPort { get; set; } = 465;

    /// <summary>
    /// Attivo
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Azienda di riferimento (per multi-tenant)
    /// </summary>
    public int? CompanyId { get; set; }
    public Company? Company { get; set; }
}

/// <summary>
/// Log notifiche SDI ricevute
/// </summary>
public class SdiNotificationLog
{
    public int Id { get; set; }

    public int ElectronicInvoiceId { get; set; }
    public ElectronicInvoice? ElectronicInvoice { get; set; }

    /// <summary>
    /// Tipo notifica: RC=RicevutaConsegna, MC=MancataConsegna, DT=DecorrenzaTermini, NS=NotificaScarto, NE=NotificaEsito
    /// </summary>
    [StringLength(4)]
    public string NotificationType { get; set; } = string.Empty;

    /// <summary>
    /// Identificativo SDI
    /// </summary>
    [StringLength(50)]
    public string SdiIdentifier { get; set; } = string.Empty;

    /// <summary>
    /// Nome file notificato
    /// </summary>
    [StringLength(100)]
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Codice esito
    /// </summary>
    [StringLength(10)]
    public string? ResultCode { get; set; }

    /// <summary>
    /// Descrizione esito
    /// </summary>
    [StringLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Timestamp notifica
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Payload completo (Base64)
    /// </summary>
    public string? PayloadBase64 { get; set; }

    /// <summary>
    /// Processato
    /// </summary>
    public bool Processed { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Log operazioni fattura elettronica (invio, stato, notifiche)
/// </summary>
public class ElectronicInvoiceLog
{
    public int Id { get; set; }

    public int ElectronicInvoiceId { get; set; }
    public ElectronicInvoice? ElectronicInvoice { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Azione: Invio, InvioOk, InvioErrore, StatoAggiornato, NotificaRicevuta, FirmaXml, ScartoSdi, ConsegnaOk, ConsegnaKo, DecorrenzaTermini
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Codice errore (se azione fallita)
    /// </summary>
    [StringLength(10)]
    public string? ErrorCode { get; set; }

    /// <summary>
    /// Descrizione dettagliata
    /// </summary>
    [StringLength(4000)]
    public string? Description { get; set; }

    /// <summary>
    /// Riferimento payload XML (Base64 o percorso file)
    /// </summary>
    public string? PayloadReference { get; set; }

    public int? UserId { get; set; }
}