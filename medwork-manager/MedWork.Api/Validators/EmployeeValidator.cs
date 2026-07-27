using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class EmployeeValidator : AbstractValidator<Employee>
{
    public EmployeeValidator()
    {
        RuleFor(x => x.CompanyId)
            .GreaterThan(0).WithMessage("CompanyId deve essere maggiore di 0");

        RuleFor(x => x.BranchId)
            .GreaterThan(0).WithMessage("BranchId deve essere maggiore di 0");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Il nome è obbligatorio")
            .MinimumLength(2).WithMessage("Il nome deve avere almeno 2 caratteri")
            .MaximumLength(120).WithMessage("Il nome non può superare i 120 caratteri");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Il cognome è obbligatorio")
            .MinimumLength(2).WithMessage("Il cognome deve avere almeno 2 caratteri")
            .MaximumLength(120).WithMessage("Il cognome non può superare i 120 caratteri");

        RuleFor(x => x.TaxCode)
            .NotEmpty().WithMessage("Il codice fiscale è obbligatorio")
            .Matches("^[A-Z0-9]{16}$").WithMessage("Il codice fiscale deve essere di 16 caratteri alfanumerici maiuscoli");

        RuleFor(x => x.JobRole)
            .NotEmpty().WithMessage("La mansione è obbligatoria")
            .MinimumLength(2).WithMessage("La mansione deve avere almeno 2 caratteri")
            .MaximumLength(120).WithMessage("La mansione non può superare i 120 caratteri");

        RuleFor(x => x.BirthDate)
            .NotEmpty().WithMessage("La data di nascita è obbligatoria")
            .LessThan(DateTime.Today).WithMessage("La data di nascita deve essere nel passato");

        RuleFor(x => x.Gender)
            .NotEmpty().WithMessage("Il genere è obbligatorio")
            .Matches("^[MF]$").WithMessage("Il genere deve essere 'M' o 'F'");

        RuleFor(x => x.BirthCity)
            .NotEmpty().WithMessage("La città di nascita è obbligatoria")
            .MinimumLength(2).WithMessage("La città di nascita deve avere almeno 2 caratteri")
            .MaximumLength(120).WithMessage("La città di nascita non può superare i 120 caratteri");

        RuleFor(x => x.BirthCityCode)
            .NotEmpty().WithMessage("Il codice catastale di nascita è obbligatorio")
            .Matches("^[A-Z][0-9]{3}$").WithMessage("Il codice catastale deve essere nel formato: 1 lettera + 3 cifre");

        RuleFor(x => x.PersonalEmail)
            .EmailAddress().WithMessage("Formato email non valido")
            .MaximumLength(150).WithMessage("L'email non può superare i 150 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.PersonalEmail));

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(30).WithMessage("Il telefono non può superare i 30 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.JobRoleId)
            .GreaterThan(0).WithMessage("JobRoleId deve essere maggiore di 0")
            .When(x => x.JobRoleId.HasValue);
    }
}