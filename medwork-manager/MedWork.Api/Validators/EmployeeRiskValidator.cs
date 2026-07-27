using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class EmployeeRiskValidator : AbstractValidator<EmployeeRisk>
{
    public EmployeeRiskValidator()
    {
        RuleFor(x => x.EmployeeId)
            .GreaterThan(0).WithMessage("EmployeeId deve essere maggiore di 0");

        RuleFor(x => x.RiskFactorId)
            .GreaterThan(0).WithMessage("RiskFactorId deve essere maggiore di 0");
    }
}