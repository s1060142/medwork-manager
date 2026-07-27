using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class EmployeePpeValidator : AbstractValidator<EmployeePpe>
{
    public EmployeePpeValidator()
    {
        RuleFor(x => x.EmployeeId)
            .GreaterThan(0).WithMessage("EmployeeId deve essere maggiore di 0");

        RuleFor(x => x.PpeId)
            .GreaterThan(0).WithMessage("PpeId deve essere maggiore di 0");

        RuleFor(x => x.AssignedDate)
            .NotEmpty().WithMessage("La data di assegnazione è obbligatoria")
            .LessThanOrEqualTo(DateTime.Today).WithMessage("La data di assegnazione non può essere futura");

        RuleFor(x => x.ExpiryDate)
            .GreaterThan(x => x.AssignedDate).WithMessage("La data di scadenza deve essere successiva alla data di assegnazione")
            .When(x => x.ExpiryDate.HasValue);

        RuleFor(x => x.Size)
            .MaximumLength(50).WithMessage("La taglia non può superare i 50 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Size));

        RuleFor(x => x.SerialNumber)
            .MaximumLength(100).WithMessage("Il numero di serie non può superare i 100 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.SerialNumber));

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Le note non possono superare i 500 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Notes));
    }
}