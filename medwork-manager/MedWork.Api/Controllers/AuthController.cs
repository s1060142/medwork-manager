using MedWork.Api.Contracts.Auth;
using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IJwtTokenService _jwtTokenService;
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;

    public AuthController(IJwtTokenService jwtTokenService, AppDbContext dbContext, IPasswordHasher passwordHasher)
    {
        _jwtTokenService = jwtTokenService;
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("login")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("login")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Unauthorized();
        }

        // Ricerca l'utente su DB (password non in chiaro, ma hash Argon2id).
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        // Verifica l'hash SOLO se l'utente esiste ed è attivo (evita timing attack rivelando esistenza).
        if (user is null || !user.IsActive || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized();
        }

        // Aggiorna last login (nello stesso scope richiesta).
        var tracked = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == user!.Id);
        if (tracked is not null)
        {
            tracked.LastLoginAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
        }

        int? employeeId = null;
        int? companyId = null;
        int? siteId = null;

        // Portale Lavoratori: collega il login all'anagrafica dipendente via codice fiscale.
        if (user.Role == AppRole.Worker && !string.IsNullOrWhiteSpace(user.TaxCode))
        {
            var worker = await _dbContext.Employees
                .Where(e => e.TaxCode == user.TaxCode)
                .Select(e => new { e.Id, e.CompanyId, e.BranchId })
                .FirstOrDefaultAsync();
            if (worker is not null)
            {
                employeeId = worker.Id;
                companyId = worker.CompanyId;
                siteId = worker.BranchId;
            }
        }
        // Portale Aziende: collega il login all'azienda via codice fiscale/PIVA.
        else if ((user.Role == AppRole.Employer || user.Role == AppRole.Rspp) && !string.IsNullOrWhiteSpace(user.TaxCode))
        {
            companyId = await _dbContext.Companies
                .Where(c => c.VATNumber == user.TaxCode)
                .Select(c => c.Id)
                .FirstOrDefaultAsync();
        }

        var token = _jwtTokenService.GenerateToken(user.Username, user.Role, employeeId, companyId, siteId);
        return Ok(new LoginResponse
        {
            AccessToken = token,
            Role = user.Role
        });
    }

    /// <summary>
    /// Rinnova il token corrente mantenendo tutti i claim (ruolo, employeeId, companyId, siteId).
    /// Il frontend lo chiama prima della scadenza per sessioni lunghe senza re-login.
    /// </summary>
    [HttpPost("refresh")]
    [Authorize]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    public IActionResult Refresh()
    {
        var username = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue("unique_name");
        var roleRaw = User.FindFirstValue(ClaimTypes.Role);

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(roleRaw))
        {
            return Unauthorized();
        }

        int? ParseClaim(string name)
            => int.TryParse(User.FindFirstValue(name), out var v) && v > 0 ? v : null;

        var token = _jwtTokenService.GenerateToken(
            username,
            roleRaw,
            ParseClaim("employeeId"),
            ParseClaim("companyId"),
            ParseClaim("siteId"));

        return Ok(new LoginResponse { AccessToken = token, Role = roleRaw });
    }
}
