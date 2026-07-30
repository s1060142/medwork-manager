using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedWork.Api.Models
{
    /// <summary>
    /// Configurazione per l'integrazione con sistemi LIS (Laboratory Information System)
    /// </summary>
    public class LisConfiguration
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Nome descrittivo della configurazione LIS
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = default!;

        /// <summary>
        /// Descrizione della configurazione
        /// </summary>
        [MaxLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// Tipo di interfaccia LIS (HL7 v2.x, REST API, file-based, ecc.)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string InterfaceType { get; set; } = default!; // e.g., "HL7v2", "REST", "FILE"

        /// <summary>
        /// Endpoint o percorso di connessione al sistema LIS
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string Endpoint { get; set; } = default!;

        /// <summary>
        /// Credenziali di autenticazione (JSON criptato)
        /// </summary>
        [MaxLength(2000)]
        public string? CredentialsEncrypted { get; set; }

        /// <summary>
        /// Configurazione aggiuntiva specifica per il tipo di interfaccia (JSON)
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? AdditionalSettings { get; set; }

        /// <summary>
        /// Flag per abilitare/disabilitare la sincronizzazione automatica
        /// </summary>
        public bool IsAutoSyncEnabled { get; set; } = false;

        /// <summary>
        /// Intervallo di sincronizzazione in minuti (se abilitato)
        /// </summary>
        public int SyncIntervalMinutes { get; set; } = 60;

        /// <summary>
        /// Ultima volta che la sincronizzazione è stata eseguita con successo
        /// </summary>
        public DateTime? LastSuccessfulSync { get; set; }

        /// <summary>
        /// Stato attuale della connessione LIS
        /// </summary>
        [MaxLength(50)]
        public string ConnectionStatus { get; set; } = "Disconnected"; // Connected, Disconnected, Error

        /// <summary>
        /// Messaggio di errore dell'ultima operazione
        /// </"
        [MaxLength(1000)]
        public string? LastErrorMessage { get; set; }

        /// <summary>
        /// Azienda a cui appartiene questa configurazione (multi-tenancy)
        /// </summary>
        [Required]
        public int CompanyId { get; set; }

        /// <summary>
        /// Sede a cui appartiene questa configurazione (opzionale, per sedi multiple)
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Data di creazione
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
        public virtual Company Company { get; set; } = default!;
        public virtual Branch? Site { get; set; }
    }
}