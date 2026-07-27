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

        var effectiveRole = requestedRole switch
        {
            _ when string.Equals(requestedRole, AppRole.Doctor, StringComparison.OrdinalIgnoreCase) => AppRole.Doctor,
            _ when string.Equals(requestedRole, AppRole.Secretary, StringComparison.OrdinalIgnoreCase) => AppRole.Secretary,
            _ when string.Equals(requestedRole, AppRole.Rspp, StringComparison.OrdinalIgnoreCase) => AppRole.Rspp,
            _ when string.Equals(requestedRole, AppRole.Employer, StringComparison.OrdinalIgnoreCase) => AppRole.Employer,
            _ => AppRole.Admin
        };

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-" + effectiveRole.ToLowerInvariant()),
            new Claim(ClaimTypes.Name, "test-" + effectiveRole.ToLowerInvariant()),
            new Claim(ClaimTypes.Role, effectiveRole),
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
