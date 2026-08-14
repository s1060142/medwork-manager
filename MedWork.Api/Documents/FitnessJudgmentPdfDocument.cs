using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MedWork.Api.Documents;

public sealed record FitnessJudgmentData(
    // Doctor
    string DoctorFullName,
    string DoctorLicenseNumber,
    string? DoctorSpecialty,
    string? DoctorEmail,
    string? DoctorPec,
    // Employee
    string EmployeeFullName,
    string EmployeeTaxCode,
    string EmployeeJobRole,
    DateTime EmployeeBirthDate,
    // Company
    string CompanyName,
    string? CompanyVatNumber,
    // Visit
    int VisitProgressiveNumber,
    DateTime VisitDate,
    MedicalVisitTypeLabel VisitType,
    string OutcomeCode,
    string OutcomeLabel,
    string? Prescriptions,
    string? Limitations,
    string? ClinicalNotes,
    DateTime NextDeadlineDate
);

public enum MedicalVisitTypeLabel
{
    Preventiva,
    Periodica,
    CambioMansione,
    RichiestaLavoratore,
    CessazioneRapporto,
    Straordinaria
}

public sealed class FitnessJudgmentPdfDocument : IDocument
{
    private readonly FitnessJudgmentData _data;

    public FitnessJudgmentPdfDocument(FitnessJudgmentData data)
    {
        _data = data;
    }

    public DocumentMetadata GetMetadata() => new DocumentMetadata
    {
        Title = $"Giudizio di Idoneità — {_data.EmployeeFullName}",
        Author = _data.DoctorFullName,
        CreationDate = DateTime.UtcNow
    };

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(40);
            page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeBody);
            page.Footer().Element(ComposeFooter);
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(inner =>
                {
                    inner.Item().Text(_data.DoctorFullName)
                        .Bold().FontSize(13);
                    inner.Item().Text($"Medico Competente — Iscritto Albo n. {_data.DoctorLicenseNumber}")
                        .FontSize(9).FontColor(Colors.Grey.Darken2);
                    if (!string.IsNullOrWhiteSpace(_data.DoctorSpecialty))
                        inner.Item().Text(_data.DoctorSpecialty).FontSize(9);
                    if (!string.IsNullOrWhiteSpace(_data.DoctorEmail))
                        inner.Item().Text(_data.DoctorEmail).FontSize(9);
                    if (!string.IsNullOrWhiteSpace(_data.DoctorPec))
                        inner.Item().Text($"PEC: {_data.DoctorPec}").FontSize(9);
                });

                row.ConstantItem(120).Column(inner =>
                {
                    inner.Item().AlignRight().Text($"N. {_data.VisitProgressiveNumber:D4}/{_data.VisitDate.Year}")
                        .Bold().FontSize(11);
                    inner.Item().AlignRight().Text($"Data: {_data.VisitDate:dd/MM/yyyy}")
                        .FontSize(9);
                });
            });

            col.Item().PaddingTop(6).LineHorizontal(1).LineColor(Colors.Grey.Darken1);

            col.Item().PaddingTop(4).AlignCenter()
                .Text("GIUDIZIO DI IDONEITÀ ALLA MANSIONE SPECIFICA")
                .Bold().FontSize(12).FontColor(Colors.Black);
            col.Item().AlignCenter()
                .Text("(art. 41, comma 6-bis, D.Lgs. 81/2008 e s.m.i.)")
                .FontSize(8).FontColor(Colors.Grey.Darken2);

            col.Item().PaddingTop(4).LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
        });
    }

    private void ComposeBody(IContainer container)
    {
        container.PaddingTop(10).Column(col =>
        {
            // Section 1: Lavoratore
            col.Item().Text("DATI DEL LAVORATORE").Bold().FontSize(10);
            col.Item().PaddingTop(4).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(2);
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(2);
                });

                table.Cell().LabelCell("Cognome e Nome");
                table.Cell().ValueCell(_data.EmployeeFullName);
                table.Cell().LabelCell("Codice Fiscale");
                table.Cell().ValueCell(_data.EmployeeTaxCode);

                table.Cell().LabelCell("Data di nascita");
                table.Cell().ValueCell(_data.EmployeeBirthDate.ToString("dd/MM/yyyy"));
                table.Cell().LabelCell("Mansione");
                table.Cell().ValueCell(_data.EmployeeJobRole);
            });

            // Section 2: Azienda
            col.Item().PaddingTop(10).Text("DATI AZIENDA").Bold().FontSize(10);
            col.Item().PaddingTop(4).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(2);
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(2);
                });

                table.Cell().LabelCell("Ragione Sociale");
                table.Cell().ValueCell(_data.CompanyName);
                table.Cell().LabelCell("P. IVA");
                table.Cell().ValueCell(_data.CompanyVatNumber ?? "—");

                table.Cell().LabelCell("Tipo visita");
                table.Cell().ValueCell(_data.VisitType.ToString().Replace("_", " "));
                table.Cell().LabelCell("");
                table.Cell().ValueCell("");
            });

            // Section 3: Giudizio
            col.Item().PaddingTop(10).Text("GIUDIZIO").Bold().FontSize(10);
            col.Item().PaddingTop(4).Background(GetOutcomeColor(_data.OutcomeCode))
                .Padding(8).Text(_data.OutcomeLabel)
                .Bold().FontSize(12).FontColor(Colors.White);

            // Section 4: Prescrizioni
            if (!string.IsNullOrWhiteSpace(_data.Prescriptions))
            {
                col.Item().PaddingTop(10).Text("PRESCRIZIONI").Bold().FontSize(10);
                col.Item().PaddingTop(4).Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Padding(6).Text(_data.Prescriptions).FontSize(10);
            }

            // Section 5: Limitazioni
            if (!string.IsNullOrWhiteSpace(_data.Limitations))
            {
                col.Item().PaddingTop(8).Text("LIMITAZIONI").Bold().FontSize(10);
                col.Item().PaddingTop(4).Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Padding(6).Text(_data.Limitations).FontSize(10);
            }

            // Section 6: Note cliniche
            if (!string.IsNullOrWhiteSpace(_data.ClinicalNotes))
            {
                col.Item().PaddingTop(8).Text("NOTE CLINICHE").Bold().FontSize(10);
                col.Item().PaddingTop(4).Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Padding(6).Text(_data.ClinicalNotes).FontSize(10);
            }

            // Section 7: Prossima visita
            col.Item().PaddingTop(10).Text("PROSSIMA VISITA").Bold().FontSize(10);
            col.Item().PaddingTop(4).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(3);
                });

                table.Cell().LabelCell("Entro il");
                table.Cell().ValueCell(_data.NextDeadlineDate.ToString("dd/MM/yyyy"));
            });

            // Section 8: Comunicazione legale
            col.Item().PaddingTop(16).Border(0.5f).BorderColor(Colors.Grey.Lighten2)
                .Background(Colors.Grey.Lighten4).Padding(8).Column(inner =>
                {
                    inner.Item().Text("Comunicazione ai sensi dell'art. 41, c. 6-bis, D.Lgs. 81/08:").Bold().FontSize(8);
                    inner.Item().PaddingTop(2).Text(
                        "Il lavoratore e il datore di lavoro sono informati del presente giudizio. " +
                        "Il lavoratore può presentare ricorso avverso il giudizio, entro 30 giorni dalla data di comunicazione, " +
                        "all'organo di vigilanza territorialmente competente (art. 41, c. 9, D.Lgs. 81/2008).")
                        .FontSize(8).FontColor(Colors.Grey.Darken2);
                });

            // Section 9: Firma
            col.Item().PaddingTop(24).Row(row =>
            {
                row.RelativeItem().Column(inner =>
                {
                    inner.Item().Text("Firma del lavoratore").FontSize(9);
                    inner.Item().PaddingTop(2).Text("(per ricevuta copia)").FontSize(8).FontColor(Colors.Grey.Darken2);
                    inner.Item().PaddingTop(20).LineHorizontal(0.5f);
                });

                row.ConstantItem(20);

                row.RelativeItem().Column(inner =>
                {
                    inner.Item().Text("Il Medico Competente").FontSize(9);
                    inner.Item().PaddingTop(2).Text(_data.DoctorFullName).FontSize(9).Bold();
                    inner.Item().PaddingTop(20).LineHorizontal(0.5f);
                });
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Text(text =>
            {
                text.Span("MedWork Manager — Documento generato il ").FontSize(7).FontColor(Colors.Grey.Medium);
                text.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm")).FontSize(7).FontColor(Colors.Grey.Medium);
            });
            row.ConstantItem(50).AlignRight().Text(text =>
            {
                text.Span("Pag. ").FontSize(7).FontColor(Colors.Grey.Medium);
                text.CurrentPageNumber().FontSize(7).FontColor(Colors.Grey.Medium);
                text.Span(" / ").FontSize(7).FontColor(Colors.Grey.Medium);
                text.TotalPages().FontSize(7).FontColor(Colors.Grey.Medium);
            });
        });
    }

    private static string GetOutcomeColor(string outcomeCode) => outcomeCode.ToUpperInvariant() switch
    {
        "IDONE0" => Colors.Green.Darken2,
        "IDONE0P" => Colors.Orange.Darken2,
        "IDONE0L" => Colors.Orange.Darken3,
        "NONIDONE0" => Colors.Red.Darken2,
        _ => Colors.Blue.Darken2
    };
}

// Extension methods for table cell styling
internal static class TableCellExtensions
{
    public static void LabelCell(this IContainer container, string label)
    {
        container.Background(Colors.Grey.Lighten3).Padding(4)
            .Text(label).FontSize(9).FontColor(Colors.Grey.Darken3).Bold();
    }

    public static void ValueCell(this IContainer container, string value)
    {
        container.Border(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4)
            .Text(value).FontSize(10);
    }
}
