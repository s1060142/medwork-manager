using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class ProtocolValidator : AbstractValidator<Protocol>
{
    public ProtocolValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Il nome del protocollo è obbligatorio")
            .MinimumLength(2).WithMessage("Il nome deve avere almeno 2 caratteri")
            .MaximumLength(160).WithMessage("Il nome non può superare i 160 caratteri");

        RuleFor(x => x.LawReference)
            .NotEmpty().WithMessage("Il riferimento normativo è obbligatorio")
            .MinimumLength(2).WithMessage("Il riferimento normativo deve avere almeno 2 caratteri")
            .MaximumLength(30).WithMessage("Il riferimento normativo non può superare i 30 caratteri");

        RuleFor(x => x.CadenceDays)
            .InclusiveBetween(1, 3650).WithMessage("La cadenza deve essere compresa tra 1 e 3650 giorni");

        RuleFor(x => x.Objective)
            .MaximumLength(1000).WithMessage("L'obiettivo non può superare i 1000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Objective));

        RuleFor(x => x.JobRoleId)
            .GreaterThan(0).WithMessage("JobRoleId deve essere maggiore di 0")
            .When(x => x.JobRoleId.HasValue);
    }
}