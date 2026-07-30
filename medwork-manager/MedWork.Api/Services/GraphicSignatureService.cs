using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Services;

/// <summary>
/// Servizio per la gestione delle firme grafometriche
/// </summary>
public class GraphicSignatureService : IGraphicSignatureService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<GraphicSignatureService> _logger;
    private readonly IAuditService _auditService;

    public GraphicSignatureService(
        AppDbContext dbContext,
        ILogger<GraphicSignatureService> logger,
        IAuditService auditService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _auditService = auditService;
    }

    public async Task<GraphicSignature> CreateAsync(GraphicSignature signature, CancellationToken ct = default)
    {
        // Ensure the signature has a company (should be set by the caller via context)
        if (signature.CompanyId == 0)
        {
            throw new InvalidOperationException("CompanyId must be set for the signature.");
        }

        signature.CreatedAt = DateTime.UtcNow;
        signature.UpdatedAt = DateTime.UtcNow;
        _dbContext.GraphicSignatures.Add(signature);
        await _dbContext.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            "GraphicSignature",
            "Create",
            signature.Id,
            $"Firma grafometrica creata per documento {signature.DocumentType} ID {signature.DocumentId ?? 0}",
            ct);

        return signature;
    }

    public async Task<GraphicSignature?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _dbContext.GraphicSignatures
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == id, ct);
    }

    public async Task<GraphicSignature?> GetByMedicalVisitIdAsync(int medicalVisitId, CancellationToken ct = default)
    {
        return await _dbContext.GraphicSignatures
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.MedicalVisitId == medicalVisitId, ct);
    }

    public async Task<GraphicSignature?> GetByDocumentIdAsync(int documentId, string documentType, CancellationToken ct = default)
    {
        return await _dbContext.GraphicSignatures
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.DocumentId == documentId && g.DocumentType == documentType, ct);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var signature = await _dbContext.GraphicSignatures.FindAsync(new object[] { id }, ct);
        if (signature == null)
        {
            return false;
        }

        _dbContext.GraphicSignatures.Remove(signature);
        await _dbContext.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            "GraphicSignature",
            "Delete",
            id,
            $"Firma grafometrica eliminata ID {id}",
            ct);

        return true;
    }
}