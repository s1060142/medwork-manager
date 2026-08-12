using MedWork.Api.Models;

namespace MedWork.Api.Services;

public interface IExternalAuthService
{
    Task<ExternalAuthResult?> AuthenticateWithSPIDAsync(string assertion, string provider);
    Task<ExternalAuthResult?> AuthenticateWithCIEAsync(string assertion, string provider);
    Task<ExternalAuthResult?> AuthenticateWithKeycloakAsync(string token, string provider);
    Task<User?> GetOrCreateExternalUserAsync(int tenantId, ExternalAuthResult result);
}

public class ExternalAuthResult
{
    public string ExternalId { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? FiscalCode { get; set; }
    public Dictionary<string, object> Claims { get; set; } = new();
}

public class SPIDAuthOptions
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

public class CIEAuthOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    public string AuthorizationEndpoint { get; set; } = "https://idserver.cie.gov.it/authorize";
    public string TokenEndpoint { get; set; } = "https://idserver.cie.gov.it/token";
    public string UserInfoEndpoint { get; set; } = "https://idserver.cie.gov.it/userinfo";
    public List<string> Scopes { get; set; } = new() { "openid", "profile", "email", "fiscal_code" };
}

public class KeycloakAuthOptions
{
    public string Authority { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Realm { get; set; } = string.Empty;
    public List<string> ValidIssuers { get; set; } = new();
}