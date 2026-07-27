using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class JobRoleValidator : AbstractValidator<JobRole>
{
    public JobRoleValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Il nome della mansione è obbligatorio")
            .MinimumLength(2).WithMessage("Il nome deve avere almeno 2 caratteri")
            .MaximumLength(120).WithMessage("Il nome non può superare i 120 caratteri");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("La descrizione non può superare i 500 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));
    }
}