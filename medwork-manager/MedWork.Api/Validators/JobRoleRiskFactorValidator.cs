using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class JobRoleRiskFactorValidator : AbstractValidator<JobRoleRiskFactor>
{
    public JobRoleRiskFactorValidator()
    {
        RuleFor(x => x.JobRoleId)
            .GreaterThan(0).WithMessage("JobRoleId deve essere maggiore di 0");

        RuleFor(x => x.RiskFactorId)
            .GreaterThan(0).WithMessage("RiskFactorId deve essere maggiore di 0");
    }
}