using FluentValidation;
using MedWork.Api.Models;

namespace MedWork.Api.Validators;

public class AttachmentValidator : AbstractValidator<Attachment>
{
    public AttachmentValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Il titolo è obbligatorio")
            .MinimumLength(2).WithMessage("Il titolo deve avere almeno 2 caratteri")
            .MaximumLength(250).WithMessage("Il titolo non può superare i 250 caratteri");

        RuleFor(x => x.Category)
            .MaximumLength(100).WithMessage("La categoria non può superare i 100 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Category));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("La descrizione non può superare i 500 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("Il nome del file è obbligatorio")
            .MaximumLength(500).WithMessage("Il nome del file non può superare i 500 caratteri");

        RuleFor(x => x.ContentType)
            .NotEmpty().WithMessage("Il ContentType è obbligatorio")
            .MaximumLength(100).WithMessage("Il ContentType non può superare i 100 caratteri");

        RuleFor(x => x.FileSize)
            .GreaterThan(0).WithMessage("La dimensione del file deve essere maggiore di 0");

        RuleFor(x => x.StoragePath)
            .NotEmpty().WithMessage("Il percorso di storage è obbligatorio")
            .MaximumLength(500).WithMessage("Il percorso di storage non può superare i 500 caratteri");

        RuleFor(x => x.Checksum)
            .MaximumLength(100).WithMessage("Il checksum non può superare i 100 caratteri")
            .When(x => !string.IsNullOrWhiteSpace(x.Checksum));

        RuleFor(x => x.UploadedBy)
            .NotEmpty().WithMessage("L'utente che carica è obbligatorio")
            .MaximumLength(120).WithMessage("L'utente non può superare i 120 caratteri");

        RuleFor(x => x.ExpiresAt)
            .GreaterThan(x => x.UploadedAt).WithMessage("La data di scadenza deve essere successiva alla data di caricamento")
            .When(x => x.ExpiresAt.HasValue);

        // At least one reference must be set
        RuleFor(x => x)
            .Must(x => x.EmployeeId.HasValue || x.CompanyId.HasValue || x.MedicalVisitId.HasValue || 
                       x.RiskFactorId.HasValue || x.SiteVisitId.HasValue)
            .WithMessage("Almeno un riferimento (Lavoratore, Azienda, Visita Medica, Fattore di Rischio, Sopralluogo) deve essere specificato");
    }
}