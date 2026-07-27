namespace MedWork.Api.Services;

/// <summary>
/// Servizio di generazione documenti PDF (giudizio di idoneità, piano sanitario, Allegato 3B).
/// </summary>
public interface IDocumentGenerationService
{
    Task<byte[]> GenerateFitnessJudgment(int medicalVisitId, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateSanitaryPlan(int employeeId, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateAllegato3B(int companyId, CancellationToken cancellationToken = default);
}
