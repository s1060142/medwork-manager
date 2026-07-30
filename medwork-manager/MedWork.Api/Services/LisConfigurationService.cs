using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Services
{
    /// <summary>
    /// Servizio per la gestione delle configurazioni LIS (Laboratory Information System)
    /// </summary>
    public class LisConfigurationService : ILisConfigurationService
    {
        private readonly AppDbContext _dbContext;

        public LisConfigurationService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IEnumerable<LisConfiguration>> GetAllByCompanyIdAsync(int companyId)
        {
            return await _dbContext.LisConfigurations
                .AsNoTracking()
                .Where(x => x.CompanyId == companyId)
                .ToListAsync();
        }

        public async Task<LisConfiguration?> GetByIdAsync(int id)
        {
            return await _dbContext.LisConfigurations
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<LisConfiguration> CreateAsync(LisConfiguration configuration)
        {
            // Set audit fields
            configuration.CreatedAt = DateTime.UtcNow;
            configuration.UpdatedAt = DateTime.UtcNow;

            _dbContext.LisConfigurations.Add(configuration);
            await _dbContext.SaveChangesAsync();

            return configuration;
        }

        public async Task<LisConfiguration?> UpdateAsync(int id, LisConfiguration configuration)
        {
            var existing = await _dbContext.LisConfigurations.FindAsync(id);
            if (existing == null)
            {
                return null;
            }

            // Update fields
            existing.Name = configuration.Name;
            existing.Description = configuration.Description;
            existing.InterfaceType = configuration.InterfaceType;
            existing.Endpoint = configuration.Endpoint;
            existing.CredentialsEncrypted = configuration.CredentialsEncrypted;
            existing.AdditionalSettings = configuration.AdditionalSettings;
            existing.IsAutoSyncEnabled = configuration.IsAutoSyncEnabled;
            existing.SyncIntervalMinutes = configuration.SyncIntervalMinutes;
            existing.LastSuccessfulSync = configuration.LastSuccessfulSync;
            existing.ConnectionStatus = configuration.ConnectionStatus;
            existing.LastErrorMessage = configuration.LastErrorMessage;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = configuration.UpdatedBy;

            await _dbContext.SaveChangesAsync();

            return existing;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _dbContext.LisConfigurations.FindAsync(id);
            if (existing == null)
            {
                return false;
            }

            _dbContext.LisConfigurations.Remove(existing);
            await _dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateConnectionStatusAsync(int id, string status, string? errorMessage = null)
        {
            var existing = await _dbContext.LisConfigurations.FindAsync(id);
            if (existing == null)
            {
                return false;
            }

            existing.ConnectionStatus = status;
            existing.LastErrorMessage = errorMessage;
            existing.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateLastSuccessfulSyncAsync(int id)
        {
            var existing = await _dbContext.LisConfigurations.FindAsync(id);
            if (existing == null)
            {
                return false;
            }

            existing.LastSuccessfulSync = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            return true;
        }
    }
}