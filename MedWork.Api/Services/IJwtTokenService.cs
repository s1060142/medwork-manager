namespace MedWork.Api.Services;

using System.Security.Claims;

public interface IJwtTokenService
{
    string GenerateToken(string username, string role, int tenantId = 1);
    string GenerateToken(int userId, string email, List<string> roles, IEnumerable<string> permissions, int tenantId);
    ClaimsPrincipal? ValidateToken(string token);
    int? GetUserIdFromToken(string token);
    int? GetTenantIdFromToken(string token);
}
