namespace MedWork.Api.Services;

public interface IPersonalProtocolAssignmentService
{
    Task AssignDefaultsForEmployeeAsync(int employeeId, CancellationToken cancellationToken = default);
}