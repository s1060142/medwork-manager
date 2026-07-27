using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class CompanyContactValidator : AbstractValidator<CompanyContact>
{
    public CompanyContactValidator()
    {
        RuleFor(x => x.CompanyId)
            .GreaterThan(0).WithMessage("CompanyId deve essere maggiore di 0");

        RuleFor(x => x.Ruolo)
            .NotEmpty().WithMessage("Il ruolo è obbligatorio")
            .MaximumLength(120).WithMessage("Il ruolo non può superare i 120 caratteri");

        RuleFor(x => x.Nominativo)
            .NotEmpty().WithMessage("Il nominativo è obbligatorio")
            .MinimumLength(2).WithMessage("Il nominativo deve avere almeno 2 caratteri")
            .MaximumLength(120).WithMessage("Il nominativo non può superare i 120 caratteri");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email è obbligatoria")
            .EmailAddress().WithMessage("Formato email non valido")
            .MaximumLength(150).WithMessage("L'email non può superare i 150 caratteri");

        RuleFor(x => x.Telefono)
            .NotEmpty().WithMessage("Il telefono è obbligatorio")
            .MaximumLength(30).WithMessage("Il telefono non può superare i 30 caratteri");
    }
}