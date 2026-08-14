namespace MedWork.Api.Services;
using Microsoft.EntityFrameworkCore;
using MedWork.Api.Models;

public interface IDeadlineCalculationService
{
    /// <summary>
    /// Calculates the next visit deadline from a visit date, using the employee's active
    /// protocol cadence. Applies age-based reduction for workers >= 50 with high-risk exposure.
    /// Returns null if no protocol is assigned — caller must then require manual input.
    /// </summary>
    Task<DateTime?> CalculateAsync(
        int employeeId,
        DateTime visitDate,
        CancellationToken cancellationToken = default);
}

public sealed class DeadlineCalculationService : IDeadlineCalculationService
{
    private readonly Data.AppDbContext _db;

    public DeadlineCalculationService(Data.AppDbContext db)
    {
        _db = db;
    }

    public async Task<DateTime?> CalculateAsync(
        int employeeId,
        DateTime visitDate,
        CancellationToken cancellationToken = default)
    {
        // 1. Try personal override first
        var protocol = await _db.PersonalProtocols
            .AsNoTracking()
            .Where(pp => pp.EmployeeId == employeeId && pp.IsActive && (pp.ExpiresAt == null || pp.ExpiresAt > visitDate))
            .OrderByDescending(pp => pp.AssignedAt)
            .Select(pp => pp.Protocol)
            .FirstOrDefaultAsync(cancellationToken);

        // 2. FIX: Fallback to JobRole protocol (which affects 95% of employees)
        if (protocol == null)
        {
            protocol = await _db.Employees
                .AsNoTracking()
                .Where(e => e.Id == employeeId)
                .SelectMany(e => _db.Protocols.Where(p => p.JobRoleId == e.JobRoleId && p.IsActive))
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (protocol == null) return null;
        var cadenceDays = protocol.CadenceDays;

        // 3. Apply age-based reduction: if worker >= 50 reduce cadence by 20% (minimum 30 days)
        var employee = await _db.Employees
            .AsNoTracking()
            .Where(e => e.Id == employeeId)
            .Select(e => new { e.BirthDate, e.RiskLevelId })
            .FirstOrDefaultAsync(cancellationToken);

        if (employee is not null)
        {
            var ageAtVisit = (visitDate - employee.BirthDate).Days / 365;
            var isHighRisk = employee.RiskLevelId.HasValue;  // any explicit risk level = high-risk

            if (ageAtVisit >= 50 && isHighRisk)
            {
                // Reduce by 20%, floor at 30 days
                cadenceDays = Math.Max(30, (int)(cadenceDays * 0.80));
            }
        }

        return visitDate.AddDays(cadenceDays);
    }
}
