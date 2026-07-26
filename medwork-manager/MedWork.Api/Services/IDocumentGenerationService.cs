namespace MedWork.Api.Services;

public interface IDocumentGenerationService
{
    Task<string> GenerateSanitaryPlan(int employeeId, CancellationToken cancellationToken = default);
    Task<string> GenerateAllegato3B(int companyId, CancellationToken cancellationToken = default);
    Task<string> GenerateFitnessJudgment(int medicalVisitId, CancellationToken cancellationToken = default);
}