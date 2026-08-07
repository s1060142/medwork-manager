namespace MedWork.Api.Security;

public class AuthSettings
{
    public List<AuthUser> Users { get; set; } = new();
}

public class AuthUser
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
