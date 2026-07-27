using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class JobRolePpeValidator : AbstractValidator<JobRolePpe>
{
    public JobRolePpeValidator()
    {
        RuleFor(x => x.JobRoleId)
            .GreaterThan(0).WithMessage("JobRoleId deve essere maggiore di 0");

        RuleFor(x => x.PpeId)
            .GreaterThan(0).WithMessage("PpeId deve essere maggiore di 0");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Le note non possono superare i 500 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Notes));
    }
}