using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class MedicalVisitValidator : AbstractValidator<MedicalVisit>
{
    public MedicalVisitValidator()
    {
        RuleFor(x => x.EmployeeId)
            .GreaterThan(0).WithMessage("EmployeeId deve essere maggiore di 0");

        RuleFor(x => x.DoctorId)
            .GreaterThan(0).WithMessage("DoctorId deve essere maggiore di 0");

        RuleFor(x => x.VisitDate)
            .NotEmpty().WithMessage("La data della visita è obbligatoria")
            .LessThanOrEqualTo(DateTime.Today).WithMessage("La data della visita non può essere futura");

        RuleFor(x => x.NextDeadlineDate)
            .NotEmpty().WithMessage("La data di prossima scadenza è obbligatoria")
            .GreaterThanOrEqualTo(x => x.VisitDate).WithMessage("La data di scadenza deve essere successiva o uguale alla data della visita");

        RuleFor(x => x.Outcome)
            .NotEmpty().WithMessage("L'esito della visita è obbligatorio")
            .MinimumLength(3).WithMessage("L'esito deve avere almeno 3 caratteri")
            .MaximumLength(250).WithMessage("L'esito non può superare i 250 caratteri");

        RuleFor(x => x.ClinicalNotes)
            .MaximumLength(4000).WithMessage("Le note cliniche non possono superare i 4000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.ClinicalNotes));

        RuleFor(x => x.TargetOrgans)
            .MaximumLength(2000).WithMessage("Gli organi bersaglio non possono superare i 2000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.TargetOrgans));

        RuleFor(x => x.ObjectiveExam)
            .MaximumLength(4000).WithMessage("L'esame obiettivo non può superare i 4000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.ObjectiveExam));
    }
}