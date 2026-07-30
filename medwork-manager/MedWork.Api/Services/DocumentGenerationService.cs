using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Text;

namespace MedWork.Api.Services;

/// <summary>
/// Generazione documenti PDF reali (QuestPDF).
/// Produce: Giudizio di idoneità, Piano sanitario individuale, Allegato 3B (riepilogo aziendale).
/// Tutti i PDF sono in italiano, con font embeddato (funzionano su qualsiasi OS, incluso headless/Docker).
/// </summary>
public class DocumentGenerationService : IDocumentGenerationService
{
    private readonly AppDbContext _dbContext;

    public DocumentGenerationService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<byte[]> GenerateFitnessJudgment(int medicalVisitId, CancellationToken cancellationToken = default)
    {
        var visit = await _dbContext.MedicalVisits
            .AsNoTracking()
            .Include(x => x.Employee).ThenInclude(x => x.Company)
            .Include(x => x.Doctor)
            .Include(x => x.Exams).ThenInclude(x => x.ExamType)
            .FirstOrDefaultAsync(x => x.Id == medicalVisitId, cancellationToken);

        if (visit is null)
        {
            throw new KeyNotFoundException($"Visita medica {medicalVisitId} non trovata.");
        }

        // Get signature for this visit
        var signatureBase64 = await GetSignatureBase64ByMedicalVisitId(visit.Id, cancellationToken);

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .Text("GIUDIZIO DI IDONEITÀ ALLA MANSIONE")
                    .SemiBold().FontSize(16);

                page.Content().PaddingTop(10).Column(col =>
                {
                    col.Item().Text($"Lavoratore: {visit.Employee?.FirstName} {visit.Employee?.LastName}");
                    col.Item().Text($"Codice Fiscale: {visit.Employee?.TaxCode}");
                    col.Item().Text($"Azienda: {visit.Employee?.Company?.Name}");
                    col.Item().Text($"Mansione: {visit.Employee?.JobRole}");
                    col.Item().Text($"Data visita: {visit.VisitDate:dd/MM/yyyy}");
                    col.Item().Text($"Tipo visita: {visit.VisitType}");

                    col.Item().PaddingTop(8).Text("Esito").SemiBold().FontSize(12);
                    col.Item().Text(visit.Outcome);

                    col.Item().PaddingTop(8).Text("Note cliniche").SemiBold().FontSize(12);
                    col.Item().Text(string.IsNullOrWhiteSpace(visit.ClinicalNotes) ? "(nessuna)" : visit.ClinicalNotes);

                    col.Item().PaddingTop(8).Text("Esami eseguiti").SemiBold().FontSize(12);
                    if (visit.Exams.Any())
                    {
                        foreach (var e in visit.Exams.OrderBy(x => x.Id))
                        {
                            col.Item().Text($"- {e.ExamType?.Name}: {e.Result}");
                        }
                    }
                    else
                    {
                        col.Item().Text("(nessun esame associato)");
                    }
                });

                page.Footer().Column(foot =>
                {
                    var docName = visit.Doctor is null ? "Medico Competente" : $"{visit.Doctor.FirstName} {visit.Doctor.LastName}";
                    foot.Item().Text($"Medico competente: {docName} ({visit.Doctor?.MedicalLicenseNumber})");

                    if (!string.IsNullOrEmpty(signatureBase64))
                                        {
                                            try
                                            {
                                                var imageBytes = Convert.FromBase64String(signatureBase64);
                                                foot.Item().Width(200, QuestPDF.Infrastructure.Unit.Point).Image(imageBytes);
                                            }
                                            catch
                                            {
                                                // If there's an error in the image data, fall back to the text line
                                                foot.Item().Text($"Firma: ____________________________   Data: {DateTime.UtcNow:dd/MM/yyyy}");
                                            }
                                        }
                    else
                    {
                        foot.Item().Text($"Firma: ____________________________   Data: {DateTime.UtcNow:dd/MM/yyyy}");
                    }
                });
            });
        });

        return doc.GeneratePdf();
    }

    public async Task<byte[]> GenerateSanitaryPlan(int employeeId, CancellationToken cancellationToken = default)
    {
        var employee = await _dbContext.Employees
            .AsNoTracking()
            .Include(x => x.Company)
            .Include(x => x.EmployeeRisks).ThenInclude(x => x.RiskFactor)
            .Include(x => x.PersonalProtocols).ThenInclude(x => x.Protocol)
            .Include(x => x.MedicalVisits).ThenInclude(x => x.Exams).ThenInclude(x => x.ExamType)
            .FirstOrDefaultAsync(x => x.Id == employeeId, cancellationToken);

        if (employee is null)
        {
            throw new KeyNotFoundException($"Lavoratore {employeeId} non trovato.");
        }

        // We don't have a single medical visit for the sanitary plan, so we won't show a signature here.
        // The sanitary plan is a cumulative document, so signature might not be appropriate.
        // If we want to show a signature, we would need to decide which visit's signature to show.
        // For now, we leave it without a signature.

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .Text("PIANO SANITARIO INDIVIDUALE (D.Lgs 81/08)")
                    .SemiBold().FontSize(16);

                page.Content().PaddingTop(10).Column(col =>
                {
                    col.Item().Text($"Lavoratore: {employee.FirstName} {employee.LastName}");
                    col.Item().Text($"Codice Fiscale: {employee.TaxCode}");
                    col.Item().Text($"Azienda: {employee.Company?.Name}");
                    col.Item().Text($"Mansione: {employee.JobRole}");
                    col.Item().Text($"Data di nascita: {employee.BirthDate:dd/MM/yyyy}");

                    col.Item().PaddingTop(8).Text("Fattori di rischio associati").SemiBold().FontSize(12);
                    if (employee.EmployeeRisks.Any())
                    {
                        foreach (var r in employee.EmployeeRisks)
                        {
                            col.Item().Text($"- {r.RiskFactor?.Name} ({r.RiskFactor?.Allegato3BCategory})");
                        }
                    }
                    else
                    {
                        col.Item().Text("(nessuno)");
                    }

                    col.Item().PaddingTop(8).Text("Protocolli sanitari personali").SemiBold().FontSize(12);
                    if (employee.PersonalProtocols.Any())
                    {
                        foreach (var p in employee.PersonalProtocols)
                        {
                            col.Item().Text($"- {p.Protocol?.Name} | Cadenza: {p.Protocol?.CadenceDays} gg | Rif.: {p.Protocol?.LawReference}");
                        }
                    }
                    else
                    {
                        col.Item().Text("(nessuno)");
                    }

                    col.Item().PaddingTop(8).Text("Storico visite").SemiBold().FontSize(12);
                    if (employee.MedicalVisits.Any())
                    {
                        foreach (var v in employee.MedicalVisits.OrderBy(x => x.VisitDate))
                        {
                            col.Item().Text($"- {v.VisitDate:dd/MM/yyyy} [{v.VisitType}] Esito: {v.Outcome}");
                        }
                    }
                    else
                    {
                        col.Item().Text("(nessuna visita registrata)");
                    }
                });

                page.Footer().Column(foot =>
                {
                    // For sanitary plan, we don't have a specific doctor; show generic label
                    foot.Item().Text($"Medico competente: ");
                    foot.Item().Text($"Firma: ____________________________   Data: {DateTime.UtcNow:dd/MM/yyyy}");
                });
            });
        });

        return doc.GeneratePdf();
    }

    public async Task<byte[]> GenerateAllegato3B(int companyId, CancellationToken cancellationToken = default)
    {
        var company = await _dbContext.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == companyId, cancellationToken);

        if (company is null)
        {
            throw new KeyNotFoundException($"Azienda {companyId} non trovata.");
        }

        var risks = await _dbContext.RiskFactors
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .Text("ALLEGATO 3B - DATI AGGREGATI DI RISCHIO")
                    .SemiBold().FontSize(16);

                page.Content().PaddingTop(10).Column(col =>
                {
                    col.Item().Text($"Azienda: {company.Name}");
                    col.Item().Text($"Partita IVA: {company.VATNumber}");
                    col.Item().Text($"Data stampa: {DateTime.UtcNow:dd/MM/yyyy}");

                    col.Item().PaddingTop(8).Text("Fattori di rischio aziendali").SemiBold().FontSize(12);
                    if (risks.Any())
                    {
                        foreach (var r in risks)
                        {
                            col.Item().Text($"- {r.Name} | Categoria: {r.Allegato3BCategory} | Livello: {r.SeverityLevel}");
                        }
                    }
                    else
                    {
                        col.Item().Text("(nessun rischio definito)");
                    }
                });

                page.Footer().Column(foot =>
                {
                    foot.Item().Text($"Firma: ____________________________   Data: {DateTime.UtcNow:dd/MM/yyyy}");
                });
            });
        });

        return doc.GeneratePdf();
    }

    private async Task<string?> GetSignatureBase64ByMedicalVisitId(int medicalVisitId, CancellationToken cancellationToken)
    {
        var signature = await _dbContext.GraphicSignatures
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.MedicalVisitId == medicalVisitId, cancellationToken);

        return signature?.SignatureData;
    }
}