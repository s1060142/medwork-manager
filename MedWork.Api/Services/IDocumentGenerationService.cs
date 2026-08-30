namespace MedWork.Api.Services;

public interface IDocumentGenerationService
{
    Task<byte[]> GenerateSanitaryPlan(int employeeId, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateAllegato3B(int companyId, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateFitnessJudgment(int medicalVisitId, CancellationToken cancellationToken = default);

    // FASE 1 - Allegato 3B INAIL: XSD validation + telematic submission.
    Task<Allegato3BValidationResult> ValidateAllegato3BXsd(int companyId, CancellationToken cancellationToken = default);
    Task<Allegato3BSubmissionResult> SubmitAllegato3B(int companyId, CancellationToken cancellationToken = default);

    Task<byte[]> GenerateFitnessJudgmentPdf(int medicalVisitId, CancellationToken cancellationToken = default);
}

public sealed record Allegato3BValidationResult(bool IsValid, IReadOnlyList<string> Errors);
public sealed record Allegato3BSubmissionResult(bool Success, string? ReceiptId, string Message);