using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class MedicalRecordValidator : AbstractValidator<MedicalRecord>
{
    public MedicalRecordValidator()
    {
        RuleFor(x => x.EmployeeId)
            .GreaterThan(0).WithMessage("EmployeeId deve essere maggiore di 0");

        RuleFor(x => x.MedicalHistory)
            .NotEmpty().WithMessage("L'anamnesi è obbligatoria")
            .MinimumLength(20).WithMessage("L'anamnesi deve avere almeno 20 caratteri")
            .MaximumLength(4000).WithMessage("L'anamnesi non può superare i 4000 caratteri");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Le note non possono superare i 2000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Notes));

        RuleFor(x => x.CurrentTherapies)
            .MaximumLength(2000).WithMessage("Le terapie in corso non possono superare i 2000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.CurrentTherapies));
    }
}