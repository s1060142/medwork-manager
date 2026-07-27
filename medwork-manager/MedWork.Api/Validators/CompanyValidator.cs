using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class CompanyValidator : AbstractValidator<Company>
{
    public CompanyValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Il nome dell'azienda è obbligatorio")
            .MinimumLength(2).WithMessage("Il nome deve avere almeno 2 caratteri")
            .MaximumLength(200).WithMessage("Il nome non può superare i 200 caratteri");

        RuleFor(x => x.VATNumber)
            .NotEmpty().WithMessage("La Partita IVA è obbligatoria")
            .Matches("^[A-Z]{2}[0-9]{11}$|^[0-9]{11}$").WithMessage("La Partita IVA deve essere nel formato IT + 11 cifre o solo 11 cifre");

        RuleFor(x => x.ContactEmail)
            .EmailAddress().WithMessage("Formato email non valido")
            .MaximumLength(150).WithMessage("L'email non può superare i 150 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactEmail));

        RuleFor(x => x.ContactPhone)
            .MaximumLength(30).WithMessage("Il telefono non può superare i 30 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPhone));
    }
}