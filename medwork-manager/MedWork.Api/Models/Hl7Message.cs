using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedWork.Api.Models
{
    /// <summary>
    /// Rappresenta un messaggio HL7 ricevuto o inviato tramite l'interfaccia LIS
    /// </summary>
    public class Hl7Message
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Identificatore unico del messaggio HL7 (MSH-10)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string MessageControlId { get; set; } = default!;

        /// <summary>
        /// Tipo di messaggio HL7 (MSH-9, es. ORU_R01, ADT_A01, osv.)
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string MessageType { get; set; } = default!;

        /// <summary>
        /// Evento che ha generato il messaggio (MSH-9.2, es. A01, O01, osv.)
        /// </summary>
        [MaxLength(10)]
        public string? TriggerEvent { get; set; }

        /// <summary>
        /// Data/ora di ricezione o invio del messaggio
        /// </summary>
        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Sistema mittente (MSH-3)
        /// </summary>
        [MaxLength(180)]
        public string? SendingApplication { get; set; }

        /// <summary>
        /// Sistema destinatario (MSH-5)
        /// </summary>
        [MaxLength(180)]
        public string? ReceivingApplication { get; set; }

        /// <summary>
        /// Contenuto grezzo del messaggio HL7 (pipe-delimited o XML)
        /// </summary>
        [Required]
        public string RawContent { get; set; } = default!;

        /// <summary>
        /// Contenuto parsato del messaggio (JSON rappresentazione strutturata)
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? ParsedContent { get; set; }

        /// <summary>
        /// Stato di elaborazione del messaggio
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string ProcessingStatus { get; set; } = "Received"; // Received, Parsed, Processed, Error, Archived

        /// <summary>
        /// Flag indica se il messaggio è stato elaborato con successo
        /// </summary>
        public bool IsProcessedSuccessfully { get; set; } = false;

        /// <summary>
        /// Messaggi di errore durante l'elaborazione
        /// </summary>
        [MaxLength(2000)]
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Identificativo del paziente nel messaggio HL7 (PID-3)
        /// </summary>
        [MaxLength(50)]
        public string? PatientIdentifier { get; set; }

        /// <summary>
        /// Nome del paziente nel messaggio HL7 (PID-5)
        /// </summary>
        [MaxLength(200)]
        public string? PatientName { get; set; }

        /// <summary>
        /// Data di nascita del paziente (PID-7)
        /// </summary>
        public DateTime? PatientBirthDate { get; set; }

        /// <summary>
        /// Sesso del paziente (PID-8)
        /// </summary>
        [MaxLength(1)]
        public string? PatientSex { get; set; }

        /// <summary>
        /// ID dell'ordine o del risultato (per messaggi ORU/ORM)
        /// </summary>
        [MaxLength(50)]
        public string? OrderId { get; set; }

        /// <summary>
        /// ID del risultato osservato (per messaggi ORU)
        /// </summary>
        [MaxLength(50)]
        public string? ObservationId { get; set; }

        /// <summary>
        /// Valore dell'osservazione osservato (per messaggi ORU)
        /// </summary>
        [MaxLength(200)]
        public string? ObservationValue { get; set; }

        /// <summary>
        /// Unità di misura dell'osservazione (per messaggi ORU)
        /// </summary>
        [MaxLength(50)]
        public string? ObservationUnits { get; set; }

        /// <summary>
        /// Stato dell'osservazione (per messaggi ORU)
        /// </summary>
        [MaxLength(10)]
        public string? ObservationStatus { get; set; }

        /// <summary>
        /// Data/ora dell'osservazione (per messaggi ORU)
        /// </summary>
        public DateTime? ObservationDateTime { get; set; }

        /// <summary>
        /// Azienda a cui appartiene il messaggio (multi-tenancy)
        /// </summary>
        [Required]
        public int CompanyId { get; set; }

        /// <summary>
        /// Sede a cui appartiene il messaggio (opzionale)
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Configurazione LIS associata a questo messaggio
        /// </summary>
        public int? LisConfigurationId { get; set; }

        /// <summary>
        /// Visita medica associata (se applicabile)
        /// </summary>
        public int? MedicalVisitId { get; set; }

        /// <summary>
        /// Esame della visita associato (se applicabile)
        /// </summary>
        public int? VisitExamId { get; set; }

        /// <summary>
        /// Data di creazione del record
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Data dell'ultimo aggiornamento
        /// </summary>
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Utente che ha creato il record
        /// </summary>
        [MaxLength(120)]
        public string? CreatedBy { get; set; }

        /// <summary>
        /// Utente che ha effettuato l'ultimo aggiornamento
        /// </summary>
        [MaxLength(120)]
        public string? UpdatedBy { get; set; }

        // Navigazione
        public virtual LisConfiguration? LisConfiguration { get; set; }
        public virtual MedicalVisit? MedicalVisit { get; set; }
        public virtual VisitExam? VisitExam { get; set; }
        public virtual Company Company { get; set; } = default!;
        public virtual Branch? Site { get; set; }
    }
}