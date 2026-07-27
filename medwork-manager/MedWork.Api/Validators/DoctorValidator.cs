using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class DoctorValidator : AbstractValidator<Doctor>
{
    public DoctorValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Il nome è obbligatorio")
            .MinimumLength(2).WithMessage("Il nome deve avere almeno 2 caratteri")
            .MaximumLength(120).WithMessage("Il nome non può superare i 120 caratteri");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Il cognome è obbligatorio")
            .MinimumLength(2).WithMessage("Il cognome deve avere almeno 2 caratteri")
            .MaximumLength(120).WithMessage("Il cognome non può superare i 120 caratteri");

        RuleFor(x => x.MedicalLicenseNumber)
            .NotEmpty().WithMessage("Il numero di iscrizione all'albo è obbligatorio")
            .MinimumLength(4).WithMessage("Il numero di iscrizione deve avere almeno 4 caratteri")
            .MaximumLength(50).WithMessage("Il numero di iscrizione non può superare i 50 caratteri");

        RuleFor(x => x.Specialty)
            .MaximumLength(120).WithMessage("La specializzazione non può superare i 120 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Specialty));

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Formato email non valido")
            .MaximumLength(150).WithMessage("L'email non può superare i 150 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}