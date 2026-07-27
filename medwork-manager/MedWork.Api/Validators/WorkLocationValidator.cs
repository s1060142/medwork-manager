using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class WorkLocationValidator : AbstractValidator<WorkLocation>
{
    public WorkLocationValidator()
    {
        RuleFor(x => x.CompanyId)
            .GreaterThan(0).WithMessage("CompanyId deve essere maggiore di 0");

        RuleFor(x => x.Descrizione)
            .NotEmpty().WithMessage("La descrizione è obbligatoria")
            .MinimumLength(2).WithMessage("La descrizione deve avere almeno 2 caratteri")
            .MaximumLength(200).WithMessage("La descrizione non può superare i 200 caratteri");

        RuleFor(x => x.Citta)
            .NotEmpty().WithMessage("La città è obbligatoria")
            .MaximumLength(100).WithMessage("La città non può superare i 100 caratteri");

        RuleFor(x => x.Cap)
            .NotEmpty().WithMessage("Il CAP è obbligatorio")
            .MaximumLength(10).WithMessage("Il CAP non può superare i 10 caratteri");

        RuleFor(x => x.Provincia)
            .NotEmpty().WithMessage("La provincia è obbligatoria")
            .MaximumLength(2).WithMessage("La provincia deve essere di 2 caratteri");

        RuleFor(x => x.Attivo)
            .NotNull().WithMessage("Lo stato attivo è obbligatorio");
    }
}