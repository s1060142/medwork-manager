using System.Security.Claims;
using System.Text.Encodings.Web;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace MedWork.Api.Tests.Integration;

public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "TestAuth";

    public TestAuthHandler(
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
            : AppRole.Admin;

        var tenantId = Request.Headers.TryGetValue("X-Test-Tenant-Id", out var tenantHeader)
            ? tenantHeader.ToString()
            : "1";

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user"),
            new Claim(ClaimTypes.Name, "test-user"),
            new Claim(ClaimTypes.Role, requestedRole),
            new Claim("tenant_id", tenantId),
            new Claim("TenantId", tenantId),
        };

        if (Request.Headers.TryGetValue("X-Test-Company-Id", out var companyHeader))
        {
            claims.Add(new Claim("CompanyId", companyHeader.ToString()));
            claims.Add(new Claim("company_id", companyHeader.ToString()));
        }

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
