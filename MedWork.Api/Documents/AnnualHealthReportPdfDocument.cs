using System;
using System.Collections.Generic;
using System.Linq;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MedWork.Api.Documents;

public sealed record AnnualHealthReportData(
    int CompanyId,
    string CompanyName,
    string? CompanyVatNumber,
    string? CompanyAddress,
    string? CompanySector,
    int ReferenceYear,
    string DoctorFullName,
    string DoctorLicenseNumber,
    string? DoctorSpecialty,
    string? DoctorPec,
    // Aggregated Statistics
    int TotalEmployeesUnderSurveillance,
    int TotalVisitsConducted,
    int PreventiveVisitsCount,
    int PeriodicVisitsCount,
    int RoleChangeVisitsCount,
    int ReturnFromSickLeaveVisitsCount,
    int EmployeeRequestVisitsCount,
    // Judgments breakdown
    int FitCount,
    int FitWithPrescriptionsCount,
    int FitWithLimitationsCount,
    int UnfitCount,
    int PendingCount,
    // Risk Exposures
    IReadOnlyDictionary<string, int> RiskFactorCounts,
    // Clinical Summaries
    int TotalExamsConducted,
    int OccupationalDiseasesReported,
    int WorkInjuriesReported,
    string GeneralObservations,
    string PreventionRecommendations
);

public sealed class AnnualHealthReportPdfDocument : IDocument
{
    private readonly AnnualHealthReportData _data;

    public AnnualHealthReportPdfDocument(AnnualHealthReportData data)
    {
        _data = data;
    }

    public DocumentMetadata GetMetadata() => new DocumentMetadata
    {
        Title = $"Relazione Sanitaria Annuale Art. 40 — {_data.CompanyName} ({_data.ReferenceYear})",
        Author = _data.DoctorFullName,
        CreationDate = DateTime.UtcNow
    };

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(35);
            page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial"));

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
                    inner.Item().Text("RELAZIONE SANITARIA ANNUALE SULL'ATTIVITÀ DI SORVEGLIANZA SANITARIA")
                        .Bold().FontSize(12).FontColor(Colors.Blue.Darken3);
                    inner.Item().Text("Art. 40 e Art. 35, D.Lgs. 9 aprile 2008, n. 81 — Riunione Periodica di Prevenzione")
                        .Bold().FontSize(8.5f).FontColor(Colors.Grey.Darken2);
                });

                row.ConstantItem(140).Column(inner =>
                {
                    inner.Item().AlignRight().Text($"Anno {_data.ReferenceYear}").Bold().FontSize(13).FontColor(Colors.Blue.Darken2);
                    inner.Item().AlignRight().Text($"Data: {DateTime.Now:dd/MM/yyyy}").FontSize(8.5f);
                });
            });

            col.Item().PaddingTop(4).LineHorizontal(1).LineColor(Colors.Blue.Darken3);
        });
    }

    private void ComposeBody(IContainer container)
    {
        container.PaddingTop(6).Column(col =>
        {
            // ── DATI AZIENDA & MEDICO ─────────────────────────────────────────
            col.Item().Text("1. INQUADRAMENTO AZIENDALE & MEDICO COMPETENTE").Bold().FontSize(10).FontColor(Colors.Blue.Darken3);
            col.Item().PaddingTop(2).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(1.2f);
                    cols.RelativeColumn(2f);
                    cols.RelativeColumn(1.2f);
                    cols.RelativeColumn(2f);
                });

                table.Cell().LabelCell("Ragione Sociale");
                table.Cell().ValueCell(_data.CompanyName);
                table.Cell().LabelCell("P.IVA / Cod. Fisc.");
                table.Cell().ValueCell(_data.CompanyVatNumber ?? "—");

                table.Cell().LabelCell("Sede Operativa");
                table.Cell().ValueCell(_data.CompanyAddress ?? "—");
                table.Cell().LabelCell("Settore Attività");
                table.Cell().ValueCell(_data.CompanySector ?? "Commercio / Manifattura");

                table.Cell().LabelCell("Medico Competente");
                table.Cell().ValueCell(_data.DoctorFullName);
                table.Cell().LabelCell("Albo Professionale");
                table.Cell().ValueCell($"N. {_data.DoctorLicenseNumber} ({_data.DoctorSpecialty ?? "Medicina del Lavoro"})");
            });

            // ── DATI ORGANICO & ATTIVITÀ DI VISITA ───────────────────────────
            col.Item().PaddingTop(8).Text("2. ORGANICO SOTTOPOSTO A SORVEGLIANZA & VISITE EFFETTUATE").Bold().FontSize(10).FontColor(Colors.Blue.Darken3);
            col.Item().PaddingTop(2).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(2);
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(2);
                    cols.RelativeColumn(1);
                });

                table.Cell().LabelCell("Lavoratori in Sorveglianza");
                table.Cell().ValueCell(_data.TotalEmployeesUnderSurveillance.ToString());
                table.Cell().LabelCell("Totale Visite Eseguite");
                table.Cell().ValueCell(_data.TotalVisitsConducted.ToString());

                table.Cell().LabelCell("• Visite Preventive (art. 41 c.2 a)");
                table.Cell().ValueCell(_data.PreventiveVisitsCount.ToString());
                table.Cell().LabelCell("• Visite Periodiche (art. 41 c.2 b)");
                table.Cell().ValueCell(_data.PeriodicVisitsCount.ToString());

                table.Cell().LabelCell("• Cambio Mansione (art. 41 c.2 d)");
                table.Cell().ValueCell(_data.RoleChangeVisitsCount.ToString());
                table.Cell().LabelCell("• Rientro da Malattia >60gg");
                table.Cell().ValueCell(_data.ReturnFromSickLeaveVisitsCount.ToString());

                table.Cell().LabelCell("• Su Richiesta Lavoratore");
                table.Cell().ValueCell(_data.EmployeeRequestVisitsCount.ToString());
                table.Cell().LabelCell("• Esami Strumentali Totali");
                table.Cell().ValueCell(_data.TotalExamsConducted.ToString());
            });

            // ── DISTRIBUZIONE DEI GIUDIZI DI IDONEITÀ ─────────────────────────
            col.Item().PaddingTop(8).Text("3. DISTRIBUZIONE DEI GIUDIZI DI IDONEITÀ (ART. 41 C.6)").Bold().FontSize(10).FontColor(Colors.Blue.Darken3);
            col.Item().PaddingTop(2).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(3);
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(1.2f);
                });

                table.Cell().LabelCell("Tipologia Giudizio");
                table.Cell().LabelCell("N. Casi");
                table.Cell().LabelCell("Percentuale %");

                var tot = Math.Max(1, _data.TotalVisitsConducted);
                var fitPct = (_data.FitCount * 100.0) / tot;
                var prescPct = (_data.FitWithPrescriptionsCount * 100.0) / tot;
                var limitPct = (_data.FitWithLimitationsCount * 100.0) / tot;
                var unfitPct = (_data.UnfitCount * 100.0) / tot;
                var pendPct = (_data.PendingCount * 100.0) / tot;

                table.Cell().ValueCell("Idonei alla mansione specifica (piena idoneità)");
                table.Cell().ValueCell(_data.FitCount.ToString());
                table.Cell().ValueCell($"{fitPct:F1} %");

                table.Cell().ValueCell("Idonei con prescrizioni (es. uso DPI obbligatori, pause)");
                table.Cell().ValueCell(_data.FitWithPrescriptionsCount.ToString());
                table.Cell().ValueCell($"{prescPct:F1} %");

                table.Cell().ValueCell("Idonei con limitazioni (es. no carichi >10kg, no lavoro notturno)");
                table.Cell().ValueCell(_data.FitWithLimitationsCount.ToString());
                table.Cell().ValueCell($"{limitPct:F1} %");

                table.Cell().ValueCell("Inidonei temporanei o permanenti");
                table.Cell().ValueCell(_data.UnfitCount.ToString());
                table.Cell().ValueCell($"{unfitPct:F1} %");

                table.Cell().ValueCell("In attesa di approfondimento diagnostico specialistico");
                table.Cell().ValueCell(_data.PendingCount.ToString());
                table.Cell().ValueCell($"{pendPct:F1} %");
            });

            // ── FATTORI DI RISCHIO E MALATTIE PROFESSIONALI ──────────────────
            col.Item().PaddingTop(8).Text("4. ESPOSIZIONE A FATTORI DI RISCHIO & INFORTUNI").Bold().FontSize(10).FontColor(Colors.Blue.Darken3);
            col.Item().PaddingTop(2).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(3);
                    cols.RelativeColumn(1.5f);
                });

                table.Cell().LabelCell("Fattore di Rischio Lavorativo (D.Lgs. 81/08)");
                table.Cell().LabelCell("Lavoratori Esposti");

                if (_data.RiskFactorCounts != null && _data.RiskFactorCounts.Any())
                {
                    foreach (var kv in _data.RiskFactorCounts)
                    {
                        table.Cell().ValueCell(kv.Key);
                        table.Cell().ValueCell(kv.Value.ToString());
                    }
                }
                else
                {
                    table.Cell().ValueCell("Agenti Fisici (Rumore/Vibrazioni), Ergonomici (VDT/MMC), Chimici");
                    table.Cell().ValueCell($"{_data.TotalEmployeesUnderSurveillance}");
                }

                table.Cell().LabelCell("Infortuni sul Lavoro Registrati nell'Anno");
                table.Cell().ValueCell(_data.WorkInjuriesReported.ToString());

                table.Cell().LabelCell("Malattie Professionali Segnalate / Denunciate");
                table.Cell().ValueCell(_data.OccupationalDiseasesReported.ToString());
            });

            // ── CONCLUSIONI E PROPOSTE DI MIGLIORAMENTO ───────────────────────
            col.Item().PaddingTop(8).Text("5. VALUTAZIONE DI EFFICACIA DELLA PREVENZIONE & PROPOSTE").Bold().FontSize(10).FontColor(Colors.Blue.Darken3);
            col.Item().PaddingTop(2).Border(0.5f).BorderColor(Colors.Grey.Lighten1)
                .Background(Colors.Grey.Lighten5).Padding(6).Column(inner =>
                {
                    inner.Item().Text(_data.GeneralObservations).FontSize(8.5f);
                    inner.Item().PaddingTop(4).Text("Proposte di miglioramento e azioni preventive raccomandate:").Bold().FontSize(8.5f);
                    inner.Item().Text(_data.PreventionRecommendations).FontSize(8.5f);
                });

            // ── FIRMA FINALE ──────────────────────────────────────────────────
            col.Item().PaddingTop(16).Row(row =>
            {
                row.RelativeItem().Column(inner =>
                {
                    inner.Item().Text($"Luogo e Data: {_data.CompanyAddress ?? "Sede Aziendale"}, {DateTime.Now:dd/MM/yyyy}").FontSize(8.5f);
                    inner.Item().Text("Documento presentato ai sensi dell'Art. 40 D.Lgs. 81/08").FontSize(7.5f).FontColor(Colors.Grey.Darken2);
                });

                row.ConstantItem(20);

                row.RelativeItem().Column(inner =>
                {
                    inner.Item().Text("Il Medico Competente").FontSize(8.5f);
                    inner.Item().Text(_data.DoctorFullName).FontSize(9).Bold();
                    inner.Item().PaddingTop(15).LineHorizontal(0.5f);
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
                text.Span($"MedWork Manager — Relazione Sanitaria Annuale ({_data.CompanyName} - Anno {_data.ReferenceYear}) generata il ").FontSize(7).FontColor(Colors.Grey.Medium);
                text.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm")).FontSize(7).FontColor(Colors.Grey.Medium);
            });
            row.ConstantItem(60).AlignRight().Text(text =>
            {
                text.Span("Pag. ").FontSize(7).FontColor(Colors.Grey.Medium);
                text.CurrentPageNumber().FontSize(7).FontColor(Colors.Grey.Medium);
                text.Span(" / ").FontSize(7).FontColor(Colors.Grey.Medium);
                text.TotalPages().FontSize(7).FontColor(Colors.Grey.Medium);
            });
        });
    }
}
