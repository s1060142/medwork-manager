using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

/// <summary>
/// FASE 1 - Firma grafometrica: verifies the integrity / authenticity of a signed medical
/// document (PDF) using a detached signature and content hash.
/// </summary>
[ApiController]
[Route("api/signatures")]
[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]
public class SignatureController : ControllerBase
{
    private readonly ISignatureService _signature;
    private readonly AppDbContext _dbContext;

    public SignatureController(ISignatureService signature, AppDbContext dbContext)
    {
        _signature = signature;
        _dbContext = dbContext;
    }

    public sealed record VerifyRequest(string ContentHash, string SignatureBase64, string PublicKeyBase64);

    [HttpPost("verify")]
    public IActionResult Verify([FromBody] VerifyRequest request)
    {
        try
        {
            var signature = Convert.FromBase64String(request.SignatureBase64);
            var publicKey = Convert.FromBase64String(request.PublicKeyBase64);
            // The document bytes are expected to be re-fetched server-side by hash; here we trust
            // the client supplied the matching document. In prod, load from document store by hash.
            var isValid = _signature.Verify(Convert.FromHexString(request.ContentHash), signature, publicKey);
            return Ok(new { isValid });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("hash-sample")]
    public IActionResult HashSample()
    {
        // Helper endpoint: demonstrates hash generation for a sample payload.
        var sample = System.Text.Encoding.UTF8.GetBytes("MedWork document content");
        return Ok(new { hash = _signature.ContentHash(sample) });
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var tenantId = GetTenantId();
        var items = await _signature.ListAsync(tenantId, cancellationToken);
        var result = items.Select(s => new
        {
            s.Id,
            s.Signer,
            s.Hash,
            s.DocumentId,
            s.Timestamp
        });
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SignatureCreateDto dto, CancellationToken cancellationToken)
    {
        var tenantId = GetTenantId();
        var entity = await _signature.CreateAsync(tenantId, dto.Signer, dto.Hash, dto.DocumentId, cancellationToken);
        return Ok(new
        {
            entity.Id,
            entity.Signer,
            entity.Hash,
            entity.DocumentId,
            entity.Timestamp
        });
    }

    public record SignatureCreateDto(string Signer, string Hash, string? DocumentId);

    private int GetTenantId()
    {
        var claim = User.FindFirst("TenantId")?.Value;
        if (int.TryParse(claim, out var id) && id > 0)
            return id;
        throw new UnauthorizedAccessException("Tenant non specificato");
    }
}
