using System;
using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Models;

namespace MedWork.Api.Services
{
    /// <summary>
    /// Servizio per l'integrazione con sistemi di gestione della sicurezza e dei rischi
    /// </summary>
    public interface ISafetyRiskManagementService
    {
        /// <summary>
        /// Registra un incidente o un infortunio sul lavoro
        /// </summary>
        Task<Injury> RecordWorkplaceIncidentAsync(IncidentReportDto incidentReport);

        /// <summary>
        /// Valuta e aggiorna la valutazione del rischio per una mansione o un'attività
        /// </summary>
        Task<RiskAssessment> UpdateRiskAssessmentAsync(RiskAssessmentUpdateDto riskAssessmentUpdate);

        /// <summary>
        /// Registra un near-miss o un quasi incidente
        /// </summary>
        Task<Injury> RecordNearMissAsync(NearMissReportDto nearMissReport);

        /// <summary>
        /// Ottiene le statistiche di sicurezza per un'azienda o un reparto
        /// </summary>
        Task<SafetyStatisticsDto> GetSafetyStatisticsAsync(int companyId, int? departmentId = null, DateTime? startDate = null, DateTime? endDate = null);

        /// <summary>
        /// Esporta il registro degli infortuni in formato CSV o Excel
        /// </summary>
        Task<byte[]> ExportInjuryRegisterAsync(int companyId, DateTime startDate, DateTime endDate, string format = "csv");
    }
}