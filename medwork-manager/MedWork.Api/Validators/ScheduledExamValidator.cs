using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class ScheduledExamValidator : AbstractValidator<ScheduledExam>
{
    public ScheduledExamValidator()
    {
        RuleFor(x => x.EmployeeId)
            .GreaterThan(0).WithMessage("EmployeeId deve essere maggiore di 0");

        RuleFor(x => x.ExamTypeId)
            .GreaterThan(0).WithMessage("ExamTypeId deve essere maggiore di 0");

        RuleFor(x => x.DueDate)
            .NotEmpty().WithMessage("La data di scadenza è obbligatoria");

        RuleFor(x => x.Status)
            .NotNull().WithMessage("Lo stato è obbligatorio")
            .Must(x => Enum.IsDefined(typeof(ScheduledExamStatus), x))
            .WithMessage("Lo stato deve essere un valore valido (Planned, Completed, Cancelled)");
    }
}