using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class VaccinationValidator : AbstractValidator<Vaccination>
{
    public VaccinationValidator()
    {
        RuleFor(x => x.EmployeeId)
            .GreaterThan(0).WithMessage("EmployeeId deve essere maggiore di 0");

        RuleFor(x => x.VaccineName)
            .NotEmpty().WithMessage("Il nome del vaccino è obbligatorio")
            .MaximumLength(150).WithMessage("Il nome del vaccino non può superare i 150 caratteri");

        RuleFor(x => x.DateAdministered)
            .NotEmpty().WithMessage("La data di somministrazione è obbligatoria")
            .LessThanOrEqualTo(DateTime.Today).WithMessage("La data non può essere futura");

        RuleFor(x => x.NextDueDate)
            .GreaterThanOrEqualTo(x => x.DateAdministered).WithMessage("La prossima scadenza deve essere successiva alla somministrazione")
            .When(x => x.NextDueDate.HasValue);
    }
}