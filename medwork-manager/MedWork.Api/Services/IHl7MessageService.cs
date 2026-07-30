using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MedWork.Api.Models;

namespace MedWork.Api.Services
{
    /// <summary>
    /// Interfaccia per il servizio di gestione messaggi HL7/LIS
    /// </summary>
    public interface IHl7MessageService
    {
        /// <summary>
        /// Ottiene tutti i messaggi HL7 per una determinata azienda
        /// </summary>
        Task<IEnumerable<Hl7Message>> GetAllByCompanyIdAsync(int companyId);

        /// <summary>
        /// Ottiene un messaggio HL7 per ID
        /// </summary>
        Task<Hl7Message?> GetByIdAsync(int id);

        /// <summary>
        /// Ottiene i messaggi HL7 non processati per una determinata azienda
        /// </summary>
        Task<IEnumerable<Hl7Message>> GetUnprocessedByCompanyIdAsync(int companyId);

        /// <summary>
        /// Ottiene i messaggi HL7 per una determinata visita medica
        /// </summary>
        Task<IEnumerable<Hl7Message>> GetByMedicalVisitIdAsync(int medicalVisitId);

        /// <summary>
        /// Ottiene i messaggi HL7 per un determinato esame di visita
        /// </summary>
        Task<IEnumerable<Hl7Message>> GetByVisitExamIdAsync(int visitExamId);

        /// <summary>
        /// Crea un nuovo messaggio HL7
        /// </summary>
        Task<Hl7Message> CreateAsync(Hl7Message message);

        /// <summary>
        /// Aggiorna un messaggio HL7 esistente
        /// </summary>
        Task<Hl7Message?> UpdateAsync(int id, Hl7Message message);

        /// <summary>
        /// Marca un messaggio HL7 come processato
        /// </summary>
        Task<bool> MarkAsProcessedAsync(int id, string? processedData = null);

        /// <summary>
        /// Elimina un messaggio HL7
        /// </summary>
        Task<bool> DeleteAsync(int id);

        /// <summary>
        /// Ottiene il conteggio dei messaggi HL7 per stato di elaborazione
        /// </summary>
        Task<Dictionary<string, int>> GetProcessingStatusCountsAsync(int companyId);
    }
}