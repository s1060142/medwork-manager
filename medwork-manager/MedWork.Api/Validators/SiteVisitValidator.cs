using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class SiteVisitValidator : AbstractValidator<SiteVisit>
{
    public SiteVisitValidator()
    {
        RuleFor(x => x.CompanyId)
            .GreaterThan(0).WithMessage("CompanyId deve essere maggiore di 0");

        RuleFor(x => x.StrutturaVisitata)
            .NotEmpty().WithMessage("La struttura visitata è obbligatoria")
            .MaximumLength(250).WithMessage("La struttura non può superare i 250 caratteri");

        RuleFor(x => x.Luogo)
            .NotEmpty().WithMessage("Il luogo è obbligatorio")
            .MaximumLength(250).WithMessage("Il luogo non può superare i 250 caratteri");

        RuleFor(x => x.Medico)
            .NotEmpty().WithMessage("Il medico è obbligatorio")
            .MaximumLength(120).WithMessage("Il medico non può superare i 120 caratteri");

        RuleFor(x => x.Data)
            .NotEmpty().WithMessage("La data è obbligatoria")
            .LessThanOrEqualTo(DateTime.Today).WithMessage("La data non può essere futura");

        RuleFor(x => x.Periodicita)
            .NotEmpty().WithMessage("La periodicità è obbligatoria")
            .MaximumLength(100).WithMessage("La periodicità non può superare i 100 caratteri");

        RuleFor(x => x.Scadenza)
            .GreaterThanOrEqualTo(x => x.Data).WithMessage("La scadenza deve essere successiva alla data")
            .When(x => x.Scadenza.HasValue);

        RuleFor(x => x.CreatedBy)
            .NotEmpty().WithMessage("L'utente creatore è obbligatorio")
            .MaximumLength(120).WithMessage("L'utente non può superare i 120 caratteri");
    }
}