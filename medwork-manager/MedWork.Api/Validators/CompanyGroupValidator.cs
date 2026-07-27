using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class CompanyGroupValidator : AbstractValidator<CompanyGroup>
{
    public CompanyGroupValidator()
    {
        RuleFor(x => x.Descrizione)
            .NotEmpty().WithMessage("La descrizione è obbligatoria")
            .MaximumLength(200).WithMessage("La descrizione non può superare i 200 caratteri");

        RuleFor(x => x.RagioneSociale)
            .NotEmpty().WithMessage("La ragione sociale è obbligatoria")
            .MaximumLength(200).WithMessage("La ragione sociale non può superare i 200 caratteri");

        RuleFor(x => x.Indirizzo)
            .NotEmpty().WithMessage("L'indirizzo è obbligatorio")
            .MinimumLength(5).WithMessage("L'indirizzo deve avere almeno 5 caratteri")
            .MaximumLength(250).WithMessage("L'indirizzo non può superare i 250 caratteri");

        RuleFor(x => x.Citta)
            .NotEmpty().WithMessage("La città è obbligatoria")
            .MaximumLength(100).WithMessage("La città non può superare i 100 caratteri");

        RuleFor(x => x.Cap)
            .NotEmpty().WithMessage("Il CAP è obbligatorio")
            .MaximumLength(10).WithMessage("Il CAP non può superare i 10 caratteri");

        RuleFor(x => x.Provincia)
            .NotEmpty().WithMessage("La provincia è obbligatoria")
            .MaximumLength(2).WithMessage("La provincia deve essere di 2 caratteri");

        RuleFor(x => x.PartitaIva)
            .NotEmpty().WithMessage("La Partita IVA è obbligatoria")
            .Matches("^[0-9]{11}$").WithMessage("La Partita IVA deve essere di 11 cifre");

        RuleFor(x => x.CodiceFiscale)
            .NotEmpty().WithMessage("Il Codice Fiscale è obbligatorio")
            .Matches("^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$").WithMessage("Il Codice Fiscale non è valido");
    }
}