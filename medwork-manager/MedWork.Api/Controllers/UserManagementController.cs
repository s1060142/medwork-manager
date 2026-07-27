using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

public record UserSummary(int Id, string Username, string Role, bool IsActive, string? Email, DateTime CreatedAtUtc, DateTime? LastLoginAtUtc, bool MustChangePassword);
public record CreateUserRequest(string Username, string Password, string Role, string? Email, string? TaxCode);
public record UpdateUserRequest(string? Role, string? Email, string? TaxCode, bool? IsActive);
public record ChangePasswordRequest(string NewPassword);

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = AppRole.Admin)]
public class UserManagementController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;

    public UserManagementController(AppDbContext dbContext, IPasswordHasher passwordHasher)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserSummary>>> List()
    {
        var users = await _dbContext.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .Select(u => new UserSummary(
                u.Id, u.Username, u.Role, u.IsActive, u.Email,
                u.CreatedAtUtc, u.LastLoginAtUtc, u.MustChangePassword))
            .ToListAsync();
        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<UserSummary>> Create([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username e password obbligatori." });
        }

        var username = request.Username.Trim();
        if (await _dbContext.Users.AnyAsync(u => u.Username == username))
        {
            return Conflict(new { message = $"L'utente '{username}' esiste già." });
        }

        var allowedRoles = new[] { AppRole.Admin, AppRole.Doctor, AppRole.Secretary, AppRole.Rspp, AppRole.Employer, AppRole.Worker };
        if (!allowedRoles.Contains(request.Role))
        {
            return BadRequest(new { message = "Ruolo non valido." });
        }

        var user = new AppUser
        {
            Username = username,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = request.Role,
            Email = request.Email,
            TaxCode = request.TaxCode,
            IsActive = true,
            MustChangePassword = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.Id },
            new UserSummary(user.Id, user.Username, user.Role, user.IsActive, user.Email,
                user.CreatedAtUtc, user.LastLoginAtUtc, user.MustChangePassword));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserSummary>> GetById(int id)
    {
        var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();
        return Ok(new UserSummary(user.Id, user.Username, user.Role, user.IsActive, user.Email,
            user.CreatedAtUtc, user.LastLoginAtUtc, user.MustChangePassword));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();

        if (request.Role is not null) user.Role = request.Role;
        if (request.Email is not null) user.Email = request.Email;
        if (request.TaxCode is not null) user.TaxCode = request.TaxCode;
        if (request.IsActive is not null) user.IsActive = request.IsActive.Value;

        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/change-password")]
    public async Task<ActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
        {
            return BadRequest(new { message = "La password deve essere di almeno 8 caratteri." });
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.MustChangePassword = false;
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Deactivate(int id)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();

        // Disattivazione (soft-delete): l'account non logga più, ma lo storico resta.
        user.IsActive = false;
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}
