using System;
using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Models;

namespace MedWork.Api.Services
{
    /// <summary>
    /// Servizio per l'integrazione con sistemi HR (assunzioni, dimissioni, assenze, trasferimenti)
    /// </summary>
    public interface IHrIntegrationService
    {
        /// <summary>
        /// Elabora un evento di assunzione di un nuovo dipendente
        /// </summary>
        Task<Employee> ProcessHireEventAsync(HireEventDto hireEvent);

        /// <summary>
        /// Elabora un evento di dimissione di un dipendente
        /// </summary>
        Task<Employee?> ProcessTerminationEventAsync(TerminationEventDto terminationEvent);

        /// <summary>
        /// Elabora un evento di assenza (fermata, malattia, ecc.) di un dipendente
        /// </summary>
        Task<Employee?> ProcessAbsenceEventAsync(AbsenceEventDto absenceEvent);

        /// <summary>
        /// Elabora un evento di trasferimento (cambio reparto, sede, mansione) di un dipendente
        /// </summary>
        Task<Employee?> ProcessTransferEventAsync(TransferEventDto transferEvent);
    }
}