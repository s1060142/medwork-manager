using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Services;

public class PersonalProtocolAssignmentService : IPersonalProtocolAssignmentService
{
    private readonly AppDbContext _dbContext;

    public PersonalProtocolAssignmentService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AssignDefaultsForEmployeeAsync(int employeeId, CancellationToken cancellationToken = default)
    {
        var employee = await _dbContext.Employees
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == employeeId, cancellationToken);

        if (employee is null)
        {
            return;
        }

        int? roleId = employee.JobRoleId;

        if (!roleId.HasValue && !string.IsNullOrWhiteSpace(employee.JobRole))
        {
            roleId = await _dbContext.JobRoles
                .AsNoTracking()
                .Where(x => x.Name.ToLower() == employee.JobRole.ToLower())
                .Select(x => (int?)x.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (!roleId.HasValue)
        {
            return;
        }

        var protocolIds = await _dbContext.Protocols
            .AsNoTracking()
            .Where(x => x.JobRoleId == roleId.Value)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        if (protocolIds.Count == 0)
        {
            return;
        }

        var existingIds = await _dbContext.PersonalProtocols
            .AsNoTracking()
            .Where(x => x.EmployeeId == employeeId)
            .Select(x => x.ProtocolId)
            .ToListAsync(cancellationToken);

        var toInsert = protocolIds
            .Where(protocolId => !existingIds.Contains(protocolId))
            .Select(protocolId => new PersonalProtocol
            {
                EmployeeId = employeeId,
                ProtocolId = protocolId,
                AssignedAt = DateTime.UtcNow,
                IsOverride = false,
                Notes = "Auto-assigned by job role"
            })
            .ToList();

        if (toInsert.Count == 0)
        {
            return;
        }

        _dbContext.PersonalProtocols.AddRange(toInsert);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}