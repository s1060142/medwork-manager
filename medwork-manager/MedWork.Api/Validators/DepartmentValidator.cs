using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class DepartmentValidator : AbstractValidator<Department>
{
    public DepartmentValidator()
    {
        RuleFor(x => x.CompanyId)
            .GreaterThan(0).WithMessage("CompanyId deve essere maggiore di 0");

        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Il nome del reparto è obbligatorio")
            .MinimumLength(2).WithMessage("Il nome deve avere almeno 2 caratteri")
            .MaximumLength(120).WithMessage("Il nome non può superare i 120 caratteri");

        RuleFor(x => x.Referente)
            .NotEmpty().WithMessage("Il referente è obbligatorio")
            .MaximumLength(120).WithMessage("Il referente non può superare i 120 caratteri");

        RuleFor(x => x.EmailReferente)
            .NotEmpty().WithMessage("L'email del referente è obbligatoria")
            .EmailAddress().WithMessage("Formato email non valido")
            .MaximumLength(150).WithMessage("L'email non può superare i 150 caratteri");
    }
}