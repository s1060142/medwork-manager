using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class AnamnesisValidator : AbstractValidator<Anamnesis>
{
    public AnamnesisValidator()
    {
        RuleFor(x => x.MedicalVisitId)
            .GreaterThan(0).WithMessage("MedicalVisitId deve essere maggiore di 0");

        RuleFor(x => x.WorkHistory)
            .MaximumLength(4000).WithMessage("La storia lavorativa non può superare i 4000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.WorkHistory));

        RuleFor(x => x.PersonalHistory)
            .MaximumLength(4000).WithMessage("La storia personale non può superare i 4000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.PersonalHistory));

        RuleFor(x => x.FamilyHistory)
            .MaximumLength(4000).WithMessage("La storia familiare non può superare i 4000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.FamilyHistory));

        RuleFor(x => x.RemotePathology)
            .MaximumLength(4000).WithMessage("La patologia remota non può superare i 4000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.RemotePathology));

        RuleFor(x => x.RecentPathology)
            .MaximumLength(4000).WithMessage("La patologia recente non può superare i 4000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.RecentPathology));
    }
}