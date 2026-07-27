using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class BranchValidator : AbstractValidator<Branch>
{
    public BranchValidator()
    {
        RuleFor(x => x.CompanyId)
            .GreaterThan(0).WithMessage("CompanyId deve essere maggiore di 0");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("L'indirizzo è obbligatorio")
            .MinimumLength(5).WithMessage("L'indirizzo deve avere almeno 5 caratteri")
            .MaximumLength(250).WithMessage("L'indirizzo non può superare i 250 caratteri");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("La città è obbligatoria")
            .MinimumLength(2).WithMessage("La città deve avere almeno 2 caratteri")
            .MaximumLength(100).WithMessage("La città non può superare i 100 caratteri");

        RuleFor(x => x.Province)
            .MaximumLength(100).WithMessage("La provincia non può superare i 100 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Province));

        RuleFor(x => x.PostalCode)
            .MaximumLength(10).WithMessage("Il CAP non può superare i 10 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.PostalCode));
    }
}