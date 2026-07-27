namespace MedWork.Api.Services;

public interface IJwtTokenService
{
    string GenerateToken(string username, string role, int? employeeId = null, int? companyId = null, int? siteId = null);
}
