using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class InjuryValidator : AbstractValidator<Injury>
{
    public InjuryValidator()
    {
        RuleFor(x => x.EmployeeId)
            .GreaterThan(0).WithMessage("EmployeeId deve essere maggiore di 0");

        RuleFor(x => x.CompanyId)
            .GreaterThan(0).WithMessage("CompanyId deve essere maggiore di 0");

        RuleFor(x => x.InjuryDate)
            .NotEmpty().WithMessage("La data dell'infortunio è obbligatoria")
            .LessThanOrEqualTo(DateTime.Today).WithMessage("La data dell'infortunio non può essere futura");

        RuleFor(x => x.ReportDate)
            .NotEmpty().WithMessage("La data della denuncia è obbligatoria")
            .GreaterThanOrEqualTo(x => x.InjuryDate).WithMessage("La data della denuncia deve essere successiva o uguale alla data dell'infortunio");

        RuleFor(x => x.InjuryType)
            .NotEmpty().WithMessage("Il tipo di infortunio è obbligatorio")
            .Must(x => new[] { "Lieve", "Grave", "Mortale", "In itinere" }.Contains(x))
            .WithMessage("Il tipo deve essere: Lieve, Grave, Mortale o In itinere");

        RuleFor(x => x.BodyPart)
            .NotEmpty().WithMessage("La parte del corpo colpita è obbligatoria")
            .MaximumLength(120).WithMessage("La parte del corpo non può superare i 120 caratteri");

        RuleFor(x => x.InjuryNature)
            .MaximumLength(120).WithMessage("La natura dell'infortunio non può superare i 120 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.InjuryNature));

        RuleFor(x => x.Cause)
            .NotEmpty().WithMessage("La causa è obbligatoria")
            .MaximumLength(500).WithMessage("La causa non può superare i 500 caratteri");

        RuleFor(x => x.Location)
            .MaximumLength(250).WithMessage("La località non può superare i 250 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Location));

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("La descrizione non può superare i 2000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.DaysLost)
            .GreaterThanOrEqualTo(0).WithMessage("I giorni persi non possono essere negativi");

        RuleFor(x => x.ReturnToWorkDate)
            .GreaterThanOrEqualTo(x => x.InjuryDate).WithMessage("La data di rientro deve essere successiva alla data dell'infortunio")
            .When(x => x.ReturnToWorkDate.HasValue);

        RuleFor(x => x.InailReportNumber)
            .MaximumLength(100).WithMessage("Il numero di denuncia INAIL non può superare i 100 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.InailReportNumber));

        RuleFor(x => x.InailReportDate)
            .GreaterThanOrEqualTo(x => x.ReportDate).WithMessage("La data di denuncia INAIL deve essere successiva alla data della denuncia")
            .When(x => x.InailReportDate.HasValue);

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Lo stato è obbligatorio")
            .Must(x => new[] { "Aperto", "In corso", "Chiuso", "Contestato" }.Contains(x))
            .WithMessage("Lo stato deve essere: Aperto, In corso, Chiuso o Contestato");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Le note non possono superare i 2000 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Notes));

        RuleFor(x => x.CreatedBy)
            .NotEmpty().WithMessage("L'utente creatore è obbligatorio")
            .MaximumLength(120).WithMessage("L'utente non può superare i 120 caratteri");
    }
}