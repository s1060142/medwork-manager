namespace MedWork.Api.Contracts.Auth;

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int TenantId { get; set; }
    public string TenantSlug { get; set; } = string.Empty;
    public int UserId { get; set; }
    public int ExpiresIn { get; set; }
}
