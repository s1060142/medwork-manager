using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Services;

/// <summary>
/// Interfaccia per il servizio di firma grafometrica
/// </summary>
public interface IGraphicSignatureService
{
    Task<GraphicSignature> CreateAsync(GraphicSignature signature, CancellationToken ct = default);
    Task<GraphicSignature?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<GraphicSignature?> GetByMedicalVisitIdAsync(int medicalVisitId, CancellationToken ct = default);
    Task<GraphicSignature?> GetByDocumentIdAsync(int documentId, string documentType, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}