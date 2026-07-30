using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MedWork.Api.Models;

namespace MedWork.Api.Services
{
    /// <summary>
    /// Interfaccia per il servizio di configurazione LIS (Laboratory Information System)
    /// </summary>
    public interface ILisConfigurationService
    {
        /// <summary>
        /// Ottiene tutte le configurazioni LIS per una determinata azienda
        /// </summary>
        Task<IEnumerable<LisConfiguration>> GetAllByCompanyIdAsync(int companyId);

        /// <summary>
        /// Ottiene una configurazione LIS per ID
        /// </summary>
        Task<LisConfiguration?> GetByIdAsync(int id);

        /// <summary>
        /// Crea una nuova configurazione LIS
        /// </summary>
        Task<LisConfiguration> CreateAsync(LisConfiguration configuration);

        /// <summary>
        /// Aggiorna una configurazione LIS esistente
        /// </summary>
        Task<LisConfiguration?> UpdateAsync(int id, LisConfiguration configuration);

        /// <summary>
        /// Elimina una configurazione LIS
        /// </summary>
        Task<bool> DeleteAsync(int id);

        /// <summary>
        /// Aggiorna lo stato di connessione di una configurazione LIS
        /// </summary>
        Task<bool> UpdateConnectionStatusAsync(int id, string status, string? errorMessage = null);

        /// <summary>
        /// Aggiorna l timestamp dell'ultimo sync riuscito
        /// </summary>
        Task<bool> UpdateLastSuccessfulSyncAsync(int id);
    }
}