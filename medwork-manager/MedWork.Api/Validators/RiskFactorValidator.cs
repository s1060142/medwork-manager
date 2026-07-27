using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class RiskFactorValidator : AbstractValidator<RiskFactor>
{
    public RiskFactorValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Il nome del fattore di rischio è obbligatorio")
            .MinimumLength(2).WithMessage("Il nome deve avere almeno 2 caratteri")
            .MaximumLength(120).WithMessage("Il nome non può superare i 120 caratteri");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("La descrizione è obbligatoria")
            .MinimumLength(10).WithMessage("La descrizione deve avere almeno 10 caratteri")
            .MaximumLength(500).WithMessage("La descrizione non può superare i 500 caratteri");

        RuleFor(x => x.SeverityLevel)
            .InclusiveBetween(1, 5).WithMessage("Il livello di gravità deve essere compreso tra 1 e 5");

        RuleFor(x => x.Allegato3BCategory)
            .MaximumLength(120).WithMessage("La categoria Allegato 3B non può superare i 120 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Allegato3BCategory));
    }
}