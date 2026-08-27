using MedWork.Api.Contracts.Auth;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ITenantService _tenantService;
    private readonly IUserService _userService;
    private readonly IExternalAuthService _externalAuthService;
    private readonly INotificationService _notificationService;

    public AuthController(
        IJwtTokenService jwtTokenService,
        ITenantService tenantService,
        IUserService userService,
        IExternalAuthService externalAuthService,
        INotificationService notificationService)
    {
        _jwtTokenService = jwtTokenService;
        _tenantService = tenantService;
        _userService = userService;
        _externalAuthService = externalAuthService;
        _notificationService = notificationService;
    }

    [HttpPost("login")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrEmpty(request.TenantSlug))
        {
            return Unauthorized(new { error = "Tenant slug is required." });
        }

        var tenant = await _tenantService.GetBySlugAsync(request.TenantSlug);
        if (tenant == null)
        {
            return Unauthorized(new { error = "Invalid tenant." });
        }

        var user = await _userService.GetByEmailAsync(tenant.Id, request.Username);
        if (user == null || !user.IsActive || !await _userService.ValidatePasswordAsync(tenant.Id, request.Username, request.Password))
        {
            return Unauthorized(new { error = "Invalid credentials." });
        }

        var permissions = await _userService.GetUserPermissionsAsync(user.Id);
        var roles = (await _userService.GetByIdAsync(user.Id))?.UserRoles.Select(ur => ur.Role?.Name).Where(r => r != null).ToList() ?? new List<string>();

        var token = _jwtTokenService.GenerateToken(user.Id, user.Email, roles, permissions, tenant.Id);
        return Ok(new LoginResponse
        {
            AccessToken = token,
            Role = roles.FirstOrDefault() ?? "User",
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug,
            UserId = user.Id,
            ExpiresIn = 3600
        });
    }

    [HttpPost("external/spid")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> SpidLogin([FromBody] ExternalLoginRequest request)
    {
        var result = await _externalAuthService.AuthenticateWithSPIDAsync(request.Assertion, request.Provider);
        if (result == null)
            return Unauthorized(new { error = "Invalid SPID assertion" });

        var tenant = await _tenantService.GetBySlugAsync(request.TenantSlug);
        if (tenant == null)
            return Unauthorized(new { error = "Invalid tenant" });

        var user = await _externalAuthService.GetOrCreateExternalUserAsync(tenant.Id, result);
        if (user == null)
            return Unauthorized(new { error = "Failed to create user" });

        var permissions = await _userService.GetUserPermissionsAsync(user.Id);
        var roles = (await _userService.GetByIdAsync(user.Id))?.UserRoles.Select(ur => ur.Role?.Name).Where(r => r != null).ToList() ?? new List<string>();

        var token = _jwtTokenService.GenerateToken(user.Id, user.Email, roles, permissions, tenant.Id);
        return Ok(new LoginResponse
        {
            AccessToken = token,
            Role = roles.FirstOrDefault() ?? "User",
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug,
            UserId = user.Id,
            ExpiresIn = 3600
        });
    }

    [HttpPost("external/cie")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> CieLogin([FromBody] CieLoginRequest request)
    {
        var result = await _externalAuthService.AuthenticateWithCIEAsync(request.Code, request.Provider);
        if (result == null)
            return Unauthorized(new { error = "Invalid CIE authorization code" });

        var tenant = await _tenantService.GetBySlugAsync(request.TenantSlug);
        if (tenant == null)
            return Unauthorized(new { error = "Invalid tenant" });

        var user = await _externalAuthService.GetOrCreateExternalUserAsync(tenant.Id, result);
        if (user == null)
            return Unauthorized(new { error = "Failed to create user" });

        var permissions = await _userService.GetUserPermissionsAsync(user.Id);
        var roles = (await _userService.GetByIdAsync(user.Id))?.UserRoles.Select(ur => ur.Role?.Name).Where(r => r != null).ToList() ?? new List<string>();

        var token = _jwtTokenService.GenerateToken(user.Id, user.Email, roles, permissions, tenant.Id);
        return Ok(new LoginResponse
        {
            AccessToken = token,
            Role = roles.FirstOrDefault() ?? "User",
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug,
            UserId = user.Id,
            ExpiresIn = 3600
        });
    }

    [HttpPost("external/keycloak")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> KeycloakLogin([FromBody] KeycloakLoginRequest request)
    {
        var result = await _externalAuthService.AuthenticateWithKeycloakAsync(request.Token, request.Provider);
        if (result == null)
            return Unauthorized(new { error = "Invalid Keycloak token" });

        var tenant = await _tenantService.GetBySlugAsync(request.TenantSlug);
        if (tenant == null)
            return Unauthorized(new { error = "Invalid tenant" });

        var user = await _externalAuthService.GetOrCreateExternalUserAsync(tenant.Id, result);
        if (user == null)
            return Unauthorized(new { error = "Failed to create user" });

        var permissions = await _userService.GetUserPermissionsAsync(user.Id);
        var roles = (await _userService.GetByIdAsync(user.Id))?.UserRoles.Select(ur => ur.Role?.Name).Where(r => r != null).ToList() ?? new List<string>();

        var token = _jwtTokenService.GenerateToken(user.Id, user.Email, roles, permissions, tenant.Id);
        return Ok(new LoginResponse
        {
            AccessToken = token,
            Role = roles.FirstOrDefault() ?? "User",
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug,
            UserId = user.Id,
            ExpiresIn = 3600
        });
    }

    [HttpGet("me")]
    [ProducesResponseType<UserInfoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserInfoResponse>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var user = await _userService.GetByIdAsync(userId);
        if (user == null)
            return Unauthorized();

        var permissions = await _userService.GetUserPermissionsAsync(userId);
        var roles = user.UserRoles.Select(ur => ur.Role?.Name).Where(r => r != null).ToList();

        var tenantIdClaim = User.FindFirst("tenant_id")?.Value;
        int.TryParse(tenantIdClaim, out var tenantId);

        var tenant = tenantId > 0 ? await _tenantService.GetByIdAsync(tenantId) : null;

        return Ok(new UserInfoResponse
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles,
            Permissions = permissions.ToList(),
            TenantId = tenantId,
            TenantName = tenant?.Name,
            TenantSlug = tenant?.Slug
        });
    }

    [HttpPost("refresh")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> RefreshToken()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var user = await _userService.GetByIdAsync(userId);
        if (user == null || !user.IsActive)
            return Unauthorized();

        var tenantIdClaim = User.FindFirst("tenant_id")?.Value;
        int.TryParse(tenantIdClaim, out var tenantId);

        var permissions = await _userService.GetUserPermissionsAsync(userId);
        var roles = user.UserRoles.Select(ur => ur.Role?.Name).Where(r => r != null).ToList();

        var token = _jwtTokenService.GenerateToken(user.Id, user.Email, roles, permissions, tenantId);
        return Ok(new LoginResponse
        {
            AccessToken = token,
            Role = roles.FirstOrDefault() ?? "User",
            TenantId = tenantId,
            UserId = user.Id,
            ExpiresIn = 3600
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // In a stateless JWT setup, logout is handled client-side
        // For future: implement token blacklist/revocation list
        return Ok(new { message = "Logged out successfully" });
    }
}

public class ExternalLoginRequest
{
    public string TenantSlug { get; set; } = string.Empty;
    public string Assertion { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
}

public class CieLoginRequest
{
    public string TenantSlug { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Provider { get; set; } = "cie";
}

public class KeycloakLoginRequest
{
    public string TenantSlug { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Provider { get; set; } = "keycloak";
}

public class UserInfoResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
    public int TenantId { get; set; }
    public string? TenantName { get; set; }
    public string? TenantSlug { get; set; }
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
}