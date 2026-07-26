namespace MedWork.Api.Services;

public interface IJwtTokenService
{
    string GenerateToken(string username, string role);
}
