namespace MedWork.Api.Services;

public class DocumentGenerationService : IDocumentGenerationService
{
    public Task<string> GenerateSanitaryPlan(int employeeId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"STUB: GenerateSanitaryPlan for employee {employeeId}");
    }

    public Task<string> GenerateAllegato3B(int companyId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"STUB: GenerateAllegato3B for company {companyId}");
    }

    public Task<string> GenerateFitnessJudgment(int medicalVisitId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"STUB: GenerateFitnessJudgment for visit {medicalVisitId}");
    }
}