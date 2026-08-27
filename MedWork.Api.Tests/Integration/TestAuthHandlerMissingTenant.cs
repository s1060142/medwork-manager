using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace MedWork.Api.Tests.Integration;

public class TestAuthHandlerMissingTenant : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "TestAuthMissingTenant";

    public TestAuthHandlerMissingTenant(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var requestedRole = Request.Headers.TryGetValue("X-Test-Role", out var roleHeader)
            ? roleHeader.ToString()
            : "Admin";

        var effectiveRole = string.Equals(requestedRole, "Doctor", StringComparison.OrdinalIgnoreCase)
            ? "Doctor"
            : "Admin";

        var claims = new[]
        {
            new Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "test-admin"),
            new Claim(System.Security.Claims.ClaimTypes.Name, "test-admin"),
            new Claim(System.Security.Claims.ClaimTypes.Role, effectiveRole),
            // Note: No TenantId claim
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}