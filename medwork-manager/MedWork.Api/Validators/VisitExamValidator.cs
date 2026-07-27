using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class VisitExamValidator : AbstractValidator<VisitExam>
{
    public VisitExamValidator()
    {
        RuleFor(x => x.MedicalVisitId)
            .GreaterThan(0).WithMessage("MedicalVisitId deve essere maggiore di 0");

        RuleFor(x => x.ExamTypeId)
            .GreaterThan(0).WithMessage("ExamTypeId deve essere maggiore di 0");

        RuleFor(x => x.Result)
            .NotEmpty().WithMessage("Il risultato dell'esame è obbligatorio")
            .MinimumLength(2).WithMessage("Il risultato deve avere almeno 2 caratteri")
            .MaximumLength(3000).WithMessage("Il risultato non può superare i 3000 caratteri");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Le note non possono superare i 2000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Notes));

        RuleFor(x => x.ReferenceRange)
            .MaximumLength(300).WithMessage("L'intervallo di riferimento non può superare i 300 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.ReferenceRange));
    }
}