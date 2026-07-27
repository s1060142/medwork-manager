using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class NotificationLogValidator : AbstractValidator<NotificationLog>
{
    public NotificationLogValidator()
    {
        RuleFor(x => x.EmployeeId)
            .GreaterThan(0).WithMessage("EmployeeId deve essere maggiore di 0");

        RuleFor(x => x.Channel)
            .NotNull().WithMessage("Il canale è obbligatorio")
            .Must(x => Enum.IsDefined(typeof(NotificationChannel), x))
            .WithMessage("Il canale deve essere Sms o Email");

        RuleFor(x => x.SentDate)
            .NotEmpty().WithMessage("La data di invio è obbligatoria")
            .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("La data non può essere futura");

        RuleFor(x => x.MessageText)
            .NotEmpty().WithMessage("Il testo del messaggio è obbligatorio")
            .MinimumLength(2).WithMessage("Il messaggio deve avere almeno 2 caratteri")
            .MaximumLength(2000).WithMessage("Il messaggio non può superare i 2000 caratteri");
    }
}