using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MedWork.Api.Security;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace MedWork.Api.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _jwtSettings;

    public JwtTokenService(IOptions<JwtSettings> jwtSettings)
    {
        _jwtSettings = jwtSettings.Value;
    }

    private string GetSecretKey()
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET");
        if (!string.IsNullOrEmpty(secret))
        {
            return secret;
        }

        secret = _jwtSettings.SecretKey;
        if (!string.IsNullOrEmpty(secret))
        {
            return secret;
        }

        throw new InvalidOperationException("JWT Secret not configured. Please set JWT_SECRET environment variable or configure Jwt:SecretKey in configuration.");
    }

    // Legacy method for backward compatibility
    public string GenerateToken(string username, string role, int tenantId = 1)
    {
        return GenerateTokenInternal(username, role, tenantId, false);
    }

    public string GenerateRefreshToken(string username, string role, int tenantId = 1)
    {
        return GenerateTokenInternal(username, role, tenantId, true);
    }

    private string GenerateTokenInternal(string username, string role, int tenantId, bool isRefresh)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, username),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Name, username),
            new(ClaimTypes.NameIdentifier, username),
            new(ClaimTypes.Role, role),
            new("tenant_id", tenantId.ToString()),
            new("TenantId", tenantId.ToString()),
            new("type", isRefresh ? "refresh" : "access")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetSecretKey()));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = isRefresh ? DateTime.UtcNow.AddDays(30) : DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiry,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // New method with full claims support
    public string GenerateToken(int userId, string email, List<string> roles, IEnumerable<string> permissions, int tenantId)
    {
        return GenerateTokenInternal(userId, email, roles, permissions, tenantId, false);
    }

    public string GenerateRefreshToken(int userId, string email, List<string> roles, IEnumerable<string> permissions, int tenantId)
    {
        return GenerateTokenInternal(userId, email, roles, permissions, tenantId, true);
    }

    private string GenerateTokenInternal(int userId, string email, List<string> roles, IEnumerable<string> permissions, int tenantId, bool isRefresh)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, email),
            new("tenant_id", tenantId.ToString()),
            new("TenantId", tenantId.ToString()),
            new("type", isRefresh ? "refresh" : "access")
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        foreach (var permission in permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetSecretKey()));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = isRefresh ? DateTime.UtcNow.AddDays(30) : DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiry,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetSecretKey()));

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,
                ValidateLifetime = true,
                ValidIssuer = _jwtSettings.Issuer,
                ValidAudience = _jwtSettings.Audience,
                IssuerSigningKey = key,
                ClockSkew = TimeSpan.Zero,
                RoleClaimType = ClaimTypes.Role,
                NameClaimType = JwtRegisteredClaimNames.Sub
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }

    public int? GetUserIdFromToken(string token)
    {
        var principal = ValidateToken(token);
        if (principal == null) return null;

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    public int? GetTenantIdFromToken(string token)
    {
        var principal = ValidateToken(token);
        if (principal == null) return null;

        var tenantIdClaim = principal.FindFirst("tenant_id")?.Value;
        return int.TryParse(tenantIdClaim, out var tenantId) ? tenantId : null;
    }
}
