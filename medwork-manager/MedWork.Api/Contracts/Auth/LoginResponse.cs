namespace MedWork.Api.Contracts.Auth;

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
