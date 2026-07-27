using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class PpeValidator : AbstractValidator<Ppe>
{
    public PpeValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Il nome del DPI è obbligatorio")
            .MinimumLength(2).WithMessage("Il nome deve avere almeno 2 caratteri")
            .MaximumLength(120).WithMessage("Il nome non può superare i 120 caratteri");

        RuleFor(x => x.Category)
            .MaximumLength(50).WithMessage("La categoria non può superare i 50 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Category));

        RuleFor(x => x.Standard)
            .MaximumLength(100).WithMessage("La normativa non può superare i 100 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Standard));

        RuleFor(x => x.ProtectionLevel)
            .MaximumLength(100).WithMessage("Il livello di protezione non può superare i 100 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.ProtectionLevel));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("La descrizione non può superare i 500 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.Manufacturer)
            .MaximumLength(100).WithMessage("Il produttore non può superare i 100 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Manufacturer));

        RuleFor(x => x.Model)
            .MaximumLength(100).WithMessage("Il modello non può superare i 100 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Model));
    }
}