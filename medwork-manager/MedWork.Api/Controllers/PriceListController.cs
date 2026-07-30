using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

/// <summary>
/// Controller gestione Listini Prezzi (Price List)
/// </summary>
[ApiController]
[Route("api/price-lists")]
[Authorize]
public class PriceListController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<PriceListController> _logger;

    public PriceListController(AppDbContext db, ILogger<PriceListController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private int GetCompanyIdFromClaims()
    {
        var claim = User.FindFirst("companyId")?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    [HttpGet]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> GetList([FromQuery] int? companyId, [FromQuery] string? type, CancellationToken ct = default)
    {
        var cid = companyId ?? GetCompanyIdFromClaims();
        if (cid <= 0) return BadRequest("CompanyId richiesto");

        IQueryable<PriceList> query = _db.PriceLists.Where(pl => pl.CompanyId == cid);
        
        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(pl => pl.Type == type);
        }

        var priceLists = await query
            .Include(pl => pl.Company)
            .OrderBy(pl => pl.Name)
            .ToListAsync(ct);

        return Ok(priceLists);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
    {
        var priceList = await _db.PriceLists
            .Include(pl => pl.Company)
            .FirstOrDefaultAsync(pl => pl.Id == id, ct);
        
        if (priceList == null) return NotFound();
        
        var cid = GetCompanyIdFromClaims();
        if (priceList.CompanyId != cid && !User.IsInRole(AppRole.Admin))
            return Forbid();

        return Ok(priceList);
    }

    [HttpPost]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> Create([FromBody] PriceList priceList, CancellationToken ct = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        priceList.CompanyId = GetCompanyIdFromClaims();
        priceList.CreatedAt = DateTime.UtcNow;

        var created = await _db.PriceLists.AddAsync(priceList, ct);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = priceList.Id }, priceList);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor + "," + AppRole.Secretary)]
    public async Task<IActionResult> Update(int id, [FromBody] PriceList priceList, CancellationToken ct = default)
    {
        if (id != priceList.Id) return BadRequest("Id mismatch");
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var existing = await _db.PriceLists.FindAsync([id], ct);
        if (existing == null) return NotFound();

        priceList.CompanyId = existing.CompanyId;
        priceList.CreatedAt = existing.CreatedAt;

        _db.Entry(existing).CurrentValues.SetValues(priceList);
        await _db.SaveChangesAsync(ct);

        return Ok(priceList);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = AppRole.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var priceList = await _db.PriceLists.FindAsync([id], ct);
        if (priceList == null) return NotFound();

        _db.PriceLists.Remove(priceList);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }
}