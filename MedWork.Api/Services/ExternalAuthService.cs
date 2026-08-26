using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;

namespace MedWork.Api.Services;

public class ExternalAuthService : IExternalAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IUserService _userService;
    private readonly SPIDAuthOptions _spidOptions;
    private readonly CIEAuthOptions _cieOptions;
    private readonly KeycloakAuthOptions _keycloakOptions;
    private readonly HttpClient _httpClient;

    public ExternalAuthService(
        AppDbContext dbContext,
        IUserService userService,
        IOptions<SPIDAuthOptions> spidOptions,
        IOptions<CIEAuthOptions> cieOptions,
        IOptions<KeycloakAuthOptions> keycloakOptions,
        HttpClient httpClient)
    {
        _dbContext = dbContext;
        _userService = userService;
        _spidOptions = spidOptions.Value;
        _cieOptions = cieOptions.Value;
        _keycloakOptions = keycloakOptions.Value;
        _httpClient = httpClient;
    }

    public async Task<ExternalAuthResult?> AuthenticateWithSPIDAsync(string assertion, string provider)
    {
        if (!_spidOptions.AllowedProviders.Contains(provider))
            return null;

        try
        {
            // In a real implementation, you would validate the SAML assertion
            // This requires a SAML library like ITfoxtec.Identity.Saml2
            // For now, we'll parse the assertion as a JWT-like token for demonstration

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(assertion);

            var claims = jsonToken.Claims.ToDictionary(c => c.Type, c => c.Value);

            return new ExternalAuthResult
            {
                ExternalId = claims.GetValueOrDefault("sub", claims.GetValueOrDefault("nameid", string.Empty)),
                Provider = $"spid:{provider}",
                Email = claims.GetValueOrDefault("email", string.Empty),
                FirstName = claims.GetValueOrDefault("given_name", claims.GetValueOrDefault("first_name", string.Empty)),
                LastName = claims.GetValueOrDefault("family_name", claims.GetValueOrDefault("last_name", string.Empty)),
                FiscalCode = claims.GetValueOrDefault("fiscal_code", claims.GetValueOrDefault("cf", string.Empty)),
                Claims = claims.ToDictionary(k => k.Key, v => (object)v.Value)
            };
        }
        catch
        {
            return null;
        }
    }

    public async Task<ExternalAuthResult?> AuthenticateWithCIEAsync(string authorizationCode, string provider)
    {
        try
        {
            // Exchange authorization code for tokens
            var tokenRequest = new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = authorizationCode,
                ["redirect_uri"] = _cieOptions.RedirectUri,
                ["client_id"] = _cieOptions.ClientId,
                ["client_secret"] = _cieOptions.ClientSecret
            };

            var tokenResponse = await _httpClient.PostAsync(_cieOptions.TokenEndpoint, new FormUrlEncodedContent(tokenRequest));
            if (!tokenResponse.IsSuccessStatusCode)
                return null;

            var tokenContent = await tokenResponse.Content.ReadAsStringAsync();
            var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenContent);

            var accessToken = tokenData.GetProperty("access_token").GetString();
            if (string.IsNullOrEmpty(accessToken))
                return null;

            // Get user info
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            var userInfoResponse = await _httpClient.GetAsync(_cieOptions.UserInfoEndpoint);
            if (!userInfoResponse.IsSuccessStatusCode)
                return null;

            var userInfoContent = await userInfoResponse.Content.ReadAsStringAsync();
            var userInfo = JsonSerializer.Deserialize<JsonElement>(userInfoContent);

            return new ExternalAuthResult
            {
                ExternalId = userInfo.GetProperty("sub").GetString() ?? string.Empty,
                Provider = "cie",
                Email = userInfo.GetProperty("email").GetString() ?? string.Empty,
                FirstName = userInfo.GetProperty("given_name").GetString() ?? string.Empty,
                LastName = userInfo.GetProperty("family_name").GetString() ?? string.Empty,
                FiscalCode = userInfo.GetProperty("fiscal_code").GetString(),
                Claims = JsonSerializer.Deserialize<Dictionary<string, object>>(userInfoContent) ?? new()
            };
        }
        catch
        {
            return null;
        }
    }

    public async Task<ExternalAuthResult?> AuthenticateWithKeycloakAsync(string token, string provider)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        try
        {
            var handler = new JwtSecurityTokenHandler();

            // Resolve Keycloak signing keys (JWKS) from the realm certs endpoint.
            var authority = (_keycloakOptions.Authority ?? string.Empty).TrimEnd('/');
            var realm = _keycloakOptions.Realm ?? string.Empty;
            var jwksUri = $"{authority}/realms/{realm}/protocol/openid-connect/certs";
            var jwksJson = await _httpClient.GetStringAsync(jwksUri);
            var signingKeys = new JsonWebKeySet(jwksJson).GetSigningKeys();

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = signingKeys,
                ValidateIssuer = true,
                ValidIssuers = _keycloakOptions.ValidIssuers,
                ValidateAudience = true,
                ValidAudience = _keycloakOptions.ClientId,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1),
                RequireSignedTokens = true
            };

            // Cryptographically validate the token; throws on invalid signature,
            // issuer, audience or expiration.
            var principal = handler.ValidateToken(token, validationParameters, out _);

            var email = principal.FindFirst("email")?.Value
                        ?? principal.FindFirst(ClaimTypes.Email)?.Value
                        ?? string.Empty;
            var sub = principal.FindFirst("sub")?.Value ?? string.Empty;
            var givenName = principal.FindFirst("given_name")?.Value
                            ?? principal.FindFirst(ClaimTypes.GivenName)?.Value
                            ?? string.Empty;
            var familyName = principal.FindFirst("family_name")?.Value
                             ?? principal.FindFirst(ClaimTypes.Surname)?.Value
                             ?? string.Empty;

            return new ExternalAuthResult
            {
                ExternalId = sub,
                Provider = $"keycloak:{provider}",
                Email = email,
                FirstName = givenName,
                LastName = familyName,
                Claims = principal.Claims.ToDictionary(c => c.Type, c => (object)c.Value)
            };
        }
        catch
        {
            return null;
        }
    }

    public async Task<User?> GetOrCreateExternalUserAsync(int tenantId, ExternalAuthResult result)
    {
        // Try to find existing user by external ID
        var user = await _userService.GetByExternalIdAsync(tenantId, result.ExternalId, result.Provider);
        if (user != null)
        {
            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userService.UpdateAsync(user);
            return user;
        }

        // Try to find by email
        user = await _userService.GetByEmailAsync(tenantId, result.Email);
        if (user != null)
        {
            // Link external identity
            user.ExternalId = result.ExternalId;
            user.ExternalProvider = result.Provider;
            user.LastLoginAt = DateTime.UtcNow;
            await _userService.UpdateAsync(user);
            return user;
        }

        // Create new user
        // Note: For external auth, we don't set a password
        var newUser = new User
        {
            TenantId = tenantId,
            Email = result.Email,
            FirstName = result.FirstName,
            LastName = result.LastName,
            ExternalId = result.ExternalId,
            ExternalProvider = result.Provider,
            EmailConfirmed = true,
            IsActive = true,
            LastLoginAt = DateTime.UtcNow
        };

        // Create with a random password (not used for external auth)
        var randomPassword = Guid.NewGuid().ToString("N");
        return await _userService.CreateAsync(newUser, randomPassword);
    }
}