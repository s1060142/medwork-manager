using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/phrase-templates")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class PhraseTemplatesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public PhraseTemplatesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>List phrase templates with optional fuzzy search by text/category/tags.</summary>
    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] string? category,
        [FromQuery] bool favouritesOnly = false,
        [FromQuery] int? doctorId = null)
    {
        var tenantId = GetTenantId();
        var query = _dbContext.PhraseTemplates.AsNoTracking().Where(x => x.TenantId == tenantId);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(x => x.Category == category);

        if (favouritesOnly)
            query = query.Where(x => x.IsFavourite);

        if (doctorId.HasValue)
            query = query.Where(x => x.DoctorId == doctorId.Value || x.DoctorId == null);

        var all = await query.ToListAsync();

        if (!string.IsNullOrWhiteSpace(q))
            all = FuzzyRank(all, q).ToList();

        return Ok(all);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PhraseTemplate request)
    {
        request.TenantId = GetTenantId();
        _dbContext.PhraseTemplates.Add(request);
        await _dbContext.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PhraseTemplate request)
    {
        var entity = await _dbContext.PhraseTemplates.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == GetTenantId());
        if (entity is null) return NotFound();

        entity.Category = request.Category;
        entity.Text = request.Text;
        entity.Tags = request.Tags;
        entity.IsFavourite = request.IsFavourite;
        entity.DoctorId = request.DoctorId;
        await _dbContext.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _dbContext.PhraseTemplates.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == GetTenantId());
        if (entity is null) return NotFound();

        _dbContext.PhraseTemplates.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    // Lightweight fuzzy ranking: exact contains > prefix > token overlap > Levenshtein distance.
    private static IEnumerable<PhraseTemplate> FuzzyRank(IEnumerable<PhraseTemplate> source, string query)
    {
        var q = query.Trim().ToLowerInvariant();
        return source
            .Select(p => new { p, score = Score(p, q) })
            .Where(x => x.score > 0)
            .OrderByDescending(x => x.score)
            .Select(x => x.p);
    }

    private static int Score(PhraseTemplate p, string q)
    {
        var text = (p.Text ?? string.Empty).ToLowerInvariant();
        var cat = (p.Category ?? string.Empty).ToLowerInvariant();
        var tags = (p.Tags ?? string.Empty).ToLowerInvariant();

        if (text == q || cat == q) return 100;
        if (text.Contains(q) || cat.Contains(q) || tags.Contains(q)) return 70;

        var qTokens = q.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (qTokens.Any(t => text.Contains(t) || tags.Contains(t))) return 50;

        return Levenshtein(text, q) <= Math.Max(2, q.Length / 3) ? 30 : 0;
    }

    private static int Levenshtein(string a, string b)
    {
        a = a ?? string.Empty;
        b = b ?? string.Empty;
        var m = a.Length;
        var n = b.Length;
        var d = new int[m + 1, n + 1];
        for (var i = 0; i <= m; i++) d[i, 0] = i;
        for (var j = 0; j <= n; j++) d[0, j] = j;
        for (var i = 1; i <= m; i++)
            for (var j = 1; j <= n; j++)
            {
                var cost = a[i - 1] == b[j - 1] ? 0 : 1;
                d[i, j] = Math.Min(Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1), d[i - 1, j - 1] + cost);
            }
        return d[m, n];
    }

    private int GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value;
        if (int.TryParse(tenantClaim, out var tenantId))
        {
            return tenantId;
        }
        throw new UnauthorizedAccessException("Tenant ID non valido nel token.");
    }
}
