using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class PersonalProtocolValidator : AbstractValidator<PersonalProtocol>
{
    public PersonalProtocolValidator()
    {
        RuleFor(x => x.EmployeeId)
            .GreaterThan(0).WithMessage("EmployeeId deve essere maggiore di 0");

        RuleFor(x => x.ProtocolId)
            .GreaterThan(0).WithMessage("ProtocolId deve essere maggiore di 0");

        RuleFor(x => x.AssignedAt)
            .NotEmpty().WithMessage("La data di assegnazione è obbligatoria")
            .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("La data di assegnazione non può essere futura");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Le note non possono superare i 1000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Notes));
    }
}