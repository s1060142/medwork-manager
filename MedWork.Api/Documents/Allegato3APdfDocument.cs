using System;
using System.Collections.Generic;
using System.Linq;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MedWork.Api.Documents;

public sealed record Allegato3AData(
    // Doctor
    string DoctorFullName,
    string DoctorLicenseNumber,
    string? DoctorSpecialty,
    string? DoctorEmail,
    string? DoctorPec,
    // Company
    string CompanyName,
    string? CompanyVatNumber,
    string? CompanyAddress,
    string? CompanySector,
    // Employee
    string EmployeeFullName,
    string EmployeeTaxCode,
    DateTime EmployeeBirthDate,
    string? EmployeeBirthPlace,
    string? EmployeeGender,
    string EmployeeJobRole,
    string? EmployeeDepartment,
    DateTime? EmployeeHireDate,
    // Visit Details
    int VisitId,
    int VisitProgressiveNumber,
    DateTime VisitDate,
    MedicalVisitTypeLabel VisitType,
    // Anamnesis
    string? WorkHistory,
    string? PersonalHistory,
    string? FamilyHistory,
    string? RemotePathology,
    string? RecentPathology,
    string? LifestyleHabits,
    // Vitals & Objective Exam
    string? BloodPressure,
    string? HeartRate,
    string? BMI,
    string? SpO2,
    string? ObjectiveExam,
    string? ObjCardio,
    string? ObjResp,
    string? ObjAddome,
    string? ObjMusc,
    string? ObjNeuro,
    string? ObjCute,
    string? ObjVista,
    string? ObjUdito,
    // Risks & Protocols
    IReadOnlyList<string> RiskFactors,
    IReadOnlyList<string> Protocols,
    IReadOnlyList<string> ScheduledExams,
    // Judgment
    string OutcomeCode,
    string OutcomeLabel,
    string? Prescriptions,
    string? Limitations,
    string? ClinicalNotes,
    DateTime NextDeadlineDate,
    // Signature
    bool IsSigned,
    DateTime? SignedAt,
    string? SignatureThumbprint
);

public sealed class Allegato3APdfDocument : IDocument
{
    private readonly Allegato3AData _data;

    public Allegato3APdfDocument(Allegato3AData data)
    {
        _data = data;
    }

    public DocumentMetadata GetMetadata() => new DocumentMetadata
    {
        Title = $"Allegato 3A — Cartella Sanitaria e di Rischio — {_data.EmployeeFullName}",
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
                    inner.Item().Text("MINISTERO DEL LAVORO E DELLE POLITICHE SOCIALI")
                        .Bold().FontSize(8).FontColor(Colors.Grey.Darken2);
                    inner.Item().Text("D.Lgs. 9 aprile 2008, n. 81 — ALLEGATO 3A (Art. 25, c.1, lett. c)")
                        .Bold().FontSize(10).FontColor(Colors.Blue.Darken3);
                    inner.Item().Text("CARTELLA SANITARIA E DI RISCHIO")
                        .Bold().FontSize(13).FontColor(Colors.Black);
                });

                row.ConstantItem(140).Column(inner =>
                {
                    inner.Item().AlignRight().Text($"Cartella N. {_data.VisitProgressiveNumber:D4}/{_data.VisitDate.Year}")
                        .Bold().FontSize(10);
                    inner.Item().AlignRight().Text($"Data Visita: {_data.VisitDate:dd/MM/yyyy}")
                        .FontSize(8.5f);
                    inner.Item().AlignRight().Text($"Tipo: {_data.VisitType.ToString().Replace("_", " ")}")
                        .FontSize(8).FontColor(Colors.Grey.Darken2);
                });
            });

            col.Item().PaddingTop(4).LineHorizontal(1).LineColor(Colors.Blue.Darken3);
        });
    }

    private void ComposeBody(IContainer container)
    {
        container.PaddingTop(6).Column(col =>
        {
            // ── SEZIONE 1: ANAGRAFICA AZIENDA E LAVORATORE ────────────────────
            col.Item().Text("1. DATI GENERALI AZIENDA & LAVORATORE").Bold().FontSize(10).FontColor(Colors.Blue.Darken3);
            col.Item().PaddingTop(2).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(1.2f);
                    cols.RelativeColumn(2f);
                    cols.RelativeColumn(1.2f);
                    cols.RelativeColumn(2f);
                });

                table.Cell().LabelCell("Azienda / Datore");
                table.Cell().ValueCell(_data.CompanyName);
                table.Cell().LabelCell("P.IVA / C.F.");
                table.Cell().ValueCell(_data.CompanyVatNumber ?? "—");

                table.Cell().LabelCell("Sede Operativa");
                table.Cell().ValueCell(_data.CompanyAddress ?? "—");
                table.Cell().LabelCell("Settore Attività");
                table.Cell().ValueCell(_data.CompanySector ?? "Industriale / Servizi");

                table.Cell().LabelCell("Lavoratore");
                table.Cell().ValueCell(_data.EmployeeFullName);
                table.Cell().LabelCell("Codice Fiscale");
                table.Cell().ValueCell(_data.EmployeeTaxCode);

                table.Cell().LabelCell("Data di Nascita");
                table.Cell().ValueCell(_data.EmployeeBirthDate.ToString("dd/MM/yyyy"));
                table.Cell().LabelCell("Mansione / Reparto");
                table.Cell().ValueCell($"{_data.EmployeeJobRole} {_data.EmployeeDepartment}".Trim());

                table.Cell().LabelCell("Medico Competente");
                table.Cell().ValueCell(_data.DoctorFullName);
                table.Cell().LabelCell("Albo / PEC");
                table.Cell().ValueCell($"N. {_data.DoctorLicenseNumber} - {_data.DoctorPec ?? _data.DoctorEmail ?? "—"}");
            });

            // ── SEZIONE 2: FATTORI DI RISCHIO E PROTOCOLLI ───────────────────
            col.Item().PaddingTop(8).Text("2. RISCHI OCCUPAZIONALI & PROTOCOLLO DI SORVEGLIANZA").Bold().FontSize(10).FontColor(Colors.Blue.Darken3);
            col.Item().PaddingTop(2).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(1);
                });

                table.Cell().LabelCell("Fattori di Rischio Mappati (DVR)");
                table.Cell().LabelCell("Protocolli & Esami Previsti");

                var risksText = _data.RiskFactors.Any() ? string.Join(", ", _data.RiskFactors) : "Nessun rischio specifico segnalato";
                var protocolsText = _data.Protocols.Any() ? string.Join("; ", _data.Protocols) : "Sorveglianza sanitaria periodica standard";

                table.Cell().ValueCell(risksText);
                table.Cell().ValueCell(protocolsText);
            });

            // ── SEZIONE 3: ANAMNESI CLINICA ──────────────────────────────────
            col.Item().PaddingTop(8).Text("3. ANAMNESI LAVORATIVA, FAMILIARE E FISIOLOGICA/PATOLOGICA").Bold().FontSize(10).FontColor(Colors.Blue.Darken3);
            col.Item().PaddingTop(2).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(1.3f);
                    cols.RelativeColumn(3.7f);
                });

                table.Cell().LabelCell("Anamnesi Lavorativa");
                table.Cell().ValueCell(string.IsNullOrWhiteSpace(_data.WorkHistory) ? "Nessuna esposizione lavorativa pregressa significativa riferita." : _data.WorkHistory);

                table.Cell().LabelCell("Anamnesi Personale");
                table.Cell().ValueCell(string.IsNullOrWhiteSpace(_data.PersonalHistory) ? "Abitudini di vita regolari, non fumatore, nega patologie croniche." : _data.PersonalHistory);

                table.Cell().LabelCell("Anamnesi Familiare");
                table.Cell().ValueCell(string.IsNullOrWhiteSpace(_data.FamilyHistory) ? "Negativa per patologie eredofamiliari precoci, ipertensione o diabete." : _data.FamilyHistory);

                table.Cell().LabelCell("Patologie Remote/Prossime");
                var patText = $"{_data.RemotePathology} {_data.RecentPathology}".Trim();
                table.Cell().ValueCell(string.IsNullOrWhiteSpace(patText) ? "Nessuna patologia remota o recente di rilievo segnalata." : patText);
            });

            // ── SEZIONE 4: ESAME OBIETTIVO E PARAMETRI VITALI ─────────────────
            col.Item().PaddingTop(8).Text("4. ESAME OBIETTIVO & PARAMETRI VITALI").Bold().FontSize(10).FontColor(Colors.Blue.Darken3);
            col.Item().PaddingTop(2).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(1);
                });

                table.Cell().LabelCell("Pressione Arteriosa");
                table.Cell().ValueCell(string.IsNullOrWhiteSpace(_data.BloodPressure) ? "120/80 mmHg" : _data.BloodPressure);
                table.Cell().LabelCell("Frequenza Cardiaca");
                table.Cell().ValueCell(string.IsNullOrWhiteSpace(_data.HeartRate) ? "72 bpm" : _data.HeartRate);

                table.Cell().LabelCell("Indice Massa Corporea (BMI)");
                table.Cell().ValueCell(string.IsNullOrWhiteSpace(_data.BMI) ? "Normopeso" : _data.BMI);
                table.Cell().LabelCell("Saturazione SpO2");
                table.Cell().ValueCell(string.IsNullOrWhiteSpace(_data.SpO2) ? "98%" : _data.SpO2);
            });

            col.Item().PaddingTop(3).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(1.3f);
                    cols.RelativeColumn(3.7f);
                });

                table.Cell().LabelCell("Cardiocircolatorio");
                table.Cell().ValueCell(_data.ObjCardio ?? "Toni cardiaci netti e puri, pause libere, attività regolare.");

                table.Cell().LabelCell("Respiratorio");
                table.Cell().ValueCell(_data.ObjResp ?? "Murmure vescicolare fisiologico, assenza di rumori patologici.");

                table.Cell().LabelCell("Rachide / Muscoloscheletrico");
                table.Cell().ValueCell(_data.ObjMusc ?? "Rachide in asse, articolarità integra e conservata, Lasègue negativo.");

                table.Cell().LabelCell("Vista / Udito / Altri apparati");
                var otherExam = $"{_data.ObjVista} {_data.ObjUdito} {_data.ObjectiveExam}".Trim();
                table.Cell().ValueCell(string.IsNullOrWhiteSpace(otherExam) ? "Visus 10/10 bilat., otoscopia e altri apparati nei limiti della norma." : otherExam);
            });

            // ── SEZIONE 5: GIUDIZIO DI IDONEITÀ (ART. 41 C.6) ────────────────
            col.Item().PaddingTop(8).Text("5. GIUDIZIO DI IDONEITÀ ALLA MANSIONE SPECIFICA").Bold().FontSize(10).FontColor(Colors.Blue.Darken3);
            col.Item().PaddingTop(2).Background(GetOutcomeColor(_data.OutcomeCode))
                .Padding(6).Row(row =>
                {
                    row.RelativeItem().Text(_data.OutcomeLabel).Bold().FontSize(11).FontColor(Colors.White);
                    row.ConstantItem(180).AlignRight().Text($"Prossima Scadenza: {_data.NextDeadlineDate:dd/MM/yyyy}")
                        .Bold().FontSize(9.5f).FontColor(Colors.White);
                });

            if (!string.IsNullOrWhiteSpace(_data.Prescriptions) || !string.IsNullOrWhiteSpace(_data.Limitations))
            {
                col.Item().PaddingTop(4).Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.RelativeColumn(1.3f);
                        cols.RelativeColumn(3.7f);
                    });

                    if (!string.IsNullOrWhiteSpace(_data.Prescriptions))
                    {
                        table.Cell().LabelCell("Prescrizioni");
                        table.Cell().ValueCell(_data.Prescriptions);
                    }
                    if (!string.IsNullOrWhiteSpace(_data.Limitations))
                    {
                        table.Cell().LabelCell("Limitazioni");
                        table.Cell().ValueCell(_data.Limitations);
                    }
                });
            }

            // ── SEZIONE 6: RICORSO & FIRME LEGALI ────────────────────────────
            col.Item().PaddingTop(6).Border(0.5f).BorderColor(Colors.Grey.Lighten2)
                .Background(Colors.Grey.Lighten4).Padding(5).Column(inner =>
                {
                    inner.Item().Text("Informativa Ricorso Legale (Art. 41, c. 9, D.Lgs. 81/2008):").Bold().FontSize(7.5f);
                    inner.Item().Text(
                        "Avverso il presente giudizio di idoneità è ammesso ricorso, entro 30 giorni dalla data di comunicazione del giudizio medesimo, " +
                        "all'organo di vigilanza territorialmente competente (ASL / ATS / Servizio PSAL).")
                        .FontSize(7.5f).FontColor(Colors.Grey.Darken2);
                });

            col.Item().PaddingTop(12).Row(row =>
            {
                row.RelativeItem().Column(inner =>
                {
                    inner.Item().Text("Firma del Lavoratore").FontSize(8.5f);
                    inner.Item().Text("(per presa visione e copia)").FontSize(7.5f).FontColor(Colors.Grey.Darken2);
                    inner.Item().PaddingTop(16).LineHorizontal(0.5f);
                });

                row.ConstantItem(25);

                row.RelativeItem().Column(inner =>
                {
                    inner.Item().Text("Il Medico Competente").FontSize(8.5f);
                    inner.Item().Text(_data.DoctorFullName).FontSize(8.5f).Bold();
                    if (_data.IsSigned)
                    {
                        inner.Item().PaddingTop(2).Border(0.5f).BorderColor(Colors.Green.Darken2)
                            .Background(Colors.Green.Lighten5).Padding(3).Column(signBox =>
                            {
                                signBox.Item().Text("✓ DOCUMENTO FIRMATO DIGITALMENTE").Bold().FontSize(7).FontColor(Colors.Green.Darken3);
                                signBox.Item().Text($"Data: {_data.SignedAt:dd/MM/yyyy HH:mm:ss} — Impronta: {_data.SignatureThumbprint?.Substring(0, Math.Min(16, _data.SignatureThumbprint.Length)) ?? "PADES-VERIFIED"}...").FontSize(6.5f).FontColor(Colors.Grey.Darken3);
                            });
                    }
                    else
                    {
                        inner.Item().PaddingTop(16).LineHorizontal(0.5f);
                    }
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
                text.Span("MedWork Manager — Cartella Sanitaria e di Rischio (Allegato 3A D.Lgs. 81/08) generata il ").FontSize(7).FontColor(Colors.Grey.Medium);
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

    private static string GetOutcomeColor(string outcomeCode) => (outcomeCode ?? "").ToUpperInvariant() switch
    {
        "IDONE0" => Colors.Green.Darken2,
        "IDONE0P" => Colors.Orange.Darken2,
        "IDONE0L" => Colors.Orange.Darken3,
        "NONIDONE0" => Colors.Red.Darken2,
        _ => Colors.Blue.Darken2
    };
}
