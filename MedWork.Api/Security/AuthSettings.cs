namespace MedWork.Api.Security;

public class AuthSettings
{
    public List<AuthUser> Users { get; set; } = new();
    public JwtSettings Jwt { get; set; } = new();
    public SPIDAuthSettings SPID { get; set; } = new();
    public CIEAuthSettings CIE { get; set; } = new();
    public KeycloakAuthSettings Keycloak { get; set; } = new();
}

public class AuthUser
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int TenantId { get; set; } = 1;
}

public class SPIDAuthSettings
{
    public string EntityId { get; set; } = string.Empty;
    public string AssertionConsumerServiceUrl { get; set; } = string.Empty;
    public string SingleLogoutServiceUrl { get; set; } = string.Empty;
    public string CertificatePath { get; set; } = string.Empty;
    public string CertificatePassword { get; set; } = string.Empty;
    public List<string> AllowedProviders { get; set; } = new();
    public bool ForceAuthn { get; set; } = false;
    public bool AllowCreate { get; set; } = true;
}

public class CIEAuthSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    public string AuthorizationEndpoint { get; set; } = "https://idserver.cie.gov.it/authorize";
    public string TokenEndpoint { get; set; } = "https://idserver.cie.gov.it/token";
    public string UserInfoEndpoint { get; set; } = "https://idserver.cie.gov.it/userinfo";
    public List<string> Scopes { get; set; } = new() { "openid", "profile", "email", "fiscal_code" };
}

public class KeycloakAuthSettings
{
    public string Authority { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Realm { get; set; } = string.Empty;
    public List<string> ValidIssuers { get; set; } = new();
}