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

    public SignatureController(ISignatureService signature) => _signature = signature;

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
}
