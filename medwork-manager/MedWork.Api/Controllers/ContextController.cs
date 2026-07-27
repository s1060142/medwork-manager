using MedWork.Api.Contracts.Auth;
using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Authorize]
public class ContextController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IJwtTokenService _jwtTokenService;

    public ContextController(AppDbContext dbContext, IJwtTokenService jwtTokenService)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
    }

    [HttpGet("contexts")]
    [ProducesResponseType<UserContextsResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<UserContextsResponse>> GetUserContexts()
    {
        var username = User.Identity?.Name;
        var role = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
        var employeeIdClaim = User.Claims.FirstOrDefault(c => c.Type == "employeeId")?.Value;
        var companyIdClaim = User.Claims.FirstOrDefault(c => c.Type == "companyId")?.Value;

        var response = new UserContextsResponse
        {
            Username = username ?? string.Empty,
            Role = role ?? string.Empty
        };

        // Get accessible contexts based on role
        if (role == AppRole.Admin || role == AppRole.Doctor || role == AppRole.Secretary || role == AppRole.Rspp)
        {
            // Internal staff: can access all companies they are associated with
            // For now, return all companies as contexts
            // Use IgnoreQueryFilters to bypass global query filters (company/site scoping)
            var companies = await _dbContext.Companies
                .IgnoreQueryFilters()
                .Select(c => new ContextItem
                {
                    Id = c.Id,
                    Name = c.Name,
                    Type = "Company",
                    IsDefault = companyIdClaim != null && int.Parse(companyIdClaim) == c.Id
                })
                .ToListAsync();

            // Also include branches for each company
            foreach (var company in companies)
            {
                var branches = await _dbContext.Branches
                    .IgnoreQueryFilters()
                    .Where(b => b.CompanyId == company.Id)
                    .Select(b => new ContextItem
                    {
                        Id = b.Id,
                        Name = $"{b.City} - {b.Address}",
                        Type = "Branch",
                        ParentId = company.Id,
                        Address = b.Address,
                        City = b.City,
                        IsDefault = false
                    })
                    .ToListAsync();

                // Insert branches after their company
                var insertIndex = response.Contexts.Count;
                response.Contexts.Add(company);
                response.Contexts.InsertRange(insertIndex + 1, branches);
            }
        }
        else if (role == AppRole.Employer || role == AppRole.Rspp)
        {
            // Company portal: only their company
            if (int.TryParse(companyIdClaim, out var companyId))
            {
                var company = await _dbContext.Companies
                    .Where(c => c.Id == companyId)
                    .Select(c => new ContextItem
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Type = "Company",
                        IsDefault = true
                    })
                    .FirstOrDefaultAsync();

                if (company != null)
                {
                    response.Contexts.Add(company);

                    // Add branches
                    var branches = await _dbContext.Branches
                        .IgnoreQueryFilters()
                        .Where(b => b.CompanyId == companyId)
                        .Select(b => new ContextItem
                        {
                            Id = b.Id,
                            Name = $"{b.City} - {b.Address}",
                            Type = "Branch",
                            ParentId = companyId,
                            Address = b.Address,
                            City = b.City,
                            IsDefault = false
                        })
                        .ToListAsync();

                    response.Contexts.AddRange(branches);
                }
            }
        }
        else if (role == AppRole.Worker)
        {
            // Worker portal: their company + branch
            if (int.TryParse(employeeIdClaim, out var employeeId))
            {
                var employee = await _dbContext.Employees
                    .Include(e => e.Company)
                    .Include(e => e.Branch)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee != null)
                {
                    var company = new ContextItem
                    {
                        Id = employee.CompanyId,
                        Name = employee.Company?.Name ?? string.Empty,
                        Type = "Company",
                        IsDefault = true
                    };
                    response.Contexts.Add(company);

                    if (employee.Branch != null)
                    {
                        response.Contexts.Add(new ContextItem
                        {
                            Id = employee.Branch.Id,
                            Name = $"{employee.Branch.City} - {employee.Branch.Address}",
                            Type = "Branch",
                            ParentId = employee.CompanyId,
                            Address = employee.Branch.Address,
                            City = employee.Branch.City,
                            IsDefault = false
                        });
                    }
                }
            }
        }

        // Set selected context (first by default, or the one marked as default)
        response.SelectedContext = response.Contexts.FirstOrDefault(c => c.IsDefault) ?? response.Contexts.FirstOrDefault();

        return Ok(response);
    }

    [HttpPost("select-context")]
    [ProducesResponseType<SelectContextResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SelectContextResponse>> SelectContext([FromBody] SelectContextRequest request)
    {
        var username = User.Identity?.Name;
        var role = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(role))
        {
            return BadRequest(new SelectContextResponse
            {
                Success = false,
                Message = "Utente non autenticato"
            });
        }

        int? newEmployeeId = null;
        int? newCompanyId = null;
        int? newSiteId = null;

        if (request.ContextType == "Company")
        {
            // Verify access to this company
            var hasAccess = await VerifyCompanyAccess(request.ContextId, role, User);
            if (!hasAccess)
            {
                return BadRequest(new SelectContextResponse
                {
                    Success = false,
                    Message = "Accesso negato a questa azienda"
                });
            }
            newCompanyId = request.ContextId;
        }
        else if (request.ContextType == "Branch")
        {
            // Verify access to this branch (via company).
            // IgnoreQueryFilters: the current JWT context (companyId/siteId) would otherwise
            // hide branches of OTHER companies, making cross-company switching impossible.
            var branch = await _dbContext.Branches
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(b => b.Id == request.ContextId);
            if (branch == null)
            {
                return BadRequest(new SelectContextResponse
                {
                    Success = false,
                    Message = "Sede non trovata"
                });
            }

            var hasAccess = await VerifyCompanyAccess(branch.CompanyId, role, User);
            if (!hasAccess)
            {
                return BadRequest(new SelectContextResponse
                {
                    Success = false,
                    Message = "Accesso negato a questa sede"
                });
            }
            newCompanyId = branch.CompanyId;
            newSiteId = branch.Id;
        }
        else
        {
            return BadRequest(new SelectContextResponse
            {
                Success = false,
                Message = "Tipo contesto non valido. Usa 'Company' o 'Branch'"
            });
        }

        // Generate new token with updated context
        var token = _jwtTokenService.GenerateToken(username, role, newEmployeeId, newCompanyId, newSiteId);

        return Ok(new SelectContextResponse
        {
            Success = true,
            Message = "Contesto aggiornato con successo",
            AccessToken = token
        });
    }

    private async Task<bool> VerifyCompanyAccess(int companyId, string role, System.Security.Claims.ClaimsPrincipal user)
    {
        // Admin/Doctor/Secretary/Rspp (internal): can access all companies (for now)
        if (role == AppRole.Admin || role == AppRole.Doctor || role == AppRole.Secretary || role == AppRole.Rspp)
        {
            return true;
        }

        // Employer/Rspp/Worker: check if linked to this company
        var companyIdClaim = user.Claims.FirstOrDefault(c => c.Type == "companyId")?.Value;
        if (int.TryParse(companyIdClaim, out var currentCompanyId))
        {
            return currentCompanyId == companyId;
        }

        // Worker: check via employee
        var employeeIdClaim = user.Claims.FirstOrDefault(c => c.Type == "employeeId")?.Value;
        if (int.TryParse(employeeIdClaim, out var employeeId))
        {
            var employee = await _dbContext.Employees.FindAsync(employeeId);
            return employee?.CompanyId == companyId;
        }

        return false;
    }
}