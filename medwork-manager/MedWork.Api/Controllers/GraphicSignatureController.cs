using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GraphicSignatureController : ControllerBase
{
    private readonly IGraphicSignatureService _graphicSignatureService;
    private readonly ILogger<GraphicSignatureController> _logger;

    public GraphicSignatureController(IGraphicSignatureService graphicSignatureService, ILogger<GraphicSignatureController> logger)
    {
        _graphicSignatureService = graphicSignatureService;
        _logger = logger;
    }

    // GET: api/graphic-signatures/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<GraphicSignature>> GetById(int id, CancellationToken ct)
    {
        var signature = await _graphicSignatureService.GetByIdAsync(id, ct);
        if (signature == null)
        {
            return NotFound();
        }

        return Ok(signature);
    }

    // GET: api/graphic-signatures/visit/{visitId}
    [HttpGet("visit/{visitId:int}")]
    public async Task<ActionResult<GraphicSignature>> GetByMedicalVisitId(int visitId, CancellationToken ct)
    {
        var signature = await _graphicSignatureService.GetByMedicalVisitIdAsync(visitId, ct);
        if (signature == null)
        {
            return NotFound();
        }

        return Ok(signature);
    }

    // GET: api/graphic-signatures/document/{documentId}/{documentType}
    [HttpGet("document/{documentId:int}/{documentType}")]
    public async Task<ActionResult<GraphicSignature>> GetByDocumentId(int documentId, string documentType, CancellationToken ct)
    {
        var signature = await _graphicSignatureService.GetByDocumentIdAsync(documentId, documentType, ct);
        if (signature == null)
        {
            return NotFound();
        }

        return Ok(signature);
    }

    // POST: api/graphic-signatures
    [HttpPost]
    public async Task<ActionResult<GraphicSignature>> Create([FromBody] GraphicSignature signature, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Ensure the company ID is set from the current context (if available)
        // In a real application, you might get this from the user's claims or tenant resolver.
        // For now, we assume the client sends it or we set it from a service.
        // We'll leave it as is, but note that the service expects CompanyId to be set.

        var createdSignature = await _graphicSignatureService.CreateAsync(signature, ct);
        return CreatedAtAction(nameof(GetById), new { id = createdSignature.Id }, createdSignature);
    }

    // DELETE: api/graphic-signatures/{id}
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id, CancellationToken ct)
    {
        var result = await _graphicSignatureService.DeleteAsync(id, ct);
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }
}