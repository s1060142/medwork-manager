using System.Text;
using System.Xml;
using System.Xml.Schema;
using MedWork.Api.Data;
using MedWork.Api.Documents;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MedWork.Api.Services;

public class DocumentGenerationService : IDocumentGenerationService
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private const decimal DefaultVisitTariff = 80m;

    // Required by QuestPDF licence declaration (community licence = free for revenue < $1M)
    static DocumentGenerationService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public DocumentGenerationService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    private int GetTenantId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var tenantClaim = user?.FindFirst("TenantId")?.Value ?? user?.FindFirst("tenant_id")?.Value;
        if (int.TryParse(tenantClaim, out var tenantId) && tenantId > 0)
        {
            return tenantId;
        }
        throw new UnauthorizedAccessException("Tenant ID non valido nel token.");
    }

    // ── Fitness Judgment PDF (shared helper) ──────────────────────────────────
    private async Task<FitnessJudgmentData> BuildFitnessJudgmentData(int medicalVisitId, CancellationToken cancellationToken = default)
    {
        var tenantId = GetTenantId();

        var visit = await _db.MedicalVisits
            .AsNoTracking()
            .Include(v => v.Doctor)
            .Include(v => v.Employee)
                .ThenInclude(e => e!.Company)
            .FirstOrDefaultAsync(v => v.Id == medicalVisitId && v.TenantId == tenantId, cancellationToken);

        if (visit is null)
        {
            throw new KeyNotFoundException($"Medical visit {medicalVisitId} not found.");
        }

        var progressiveNumber = await _db.MedicalVisits
            .AsNoTracking()
            .Where(v => v.TenantId == visit.TenantId
                     && v.DoctorId == visit.DoctorId
                     && v.VisitDate.Year == visit.VisitDate.Year
                     && v.Id <= medicalVisitId)
            .CountAsync(cancellationToken);

        return new FitnessJudgmentData(
            DoctorFullName: $"Dr. {visit.Doctor!.FirstName} {visit.Doctor.LastName}",
            DoctorLicenseNumber: visit.Doctor.MedicalLicenseNumber,
            DoctorSpecialty: visit.Doctor.Specialty,
            DoctorEmail: visit.Doctor.Email,
            DoctorPec: visit.Doctor.PEC,
            EmployeeFullName: $"{visit.Employee!.FirstName} {visit.Employee.LastName}",
            EmployeeTaxCode: visit.Employee.TaxCode,
            EmployeeJobRole: visit.Employee.JobRole,
            EmployeeBirthDate: visit.Employee.BirthDate,
            CompanyName: visit.Employee.Company?.Name ?? "—",
            CompanyVatNumber: visit.Employee.Company?.VATNumber,
            VisitProgressiveNumber: progressiveNumber,
            VisitDate: visit.VisitDate,
            VisitType: MapVisitType(visit.VisitType),
            OutcomeCode: visit.OutcomeCode ?? "INATTESA",
            OutcomeLabel: visit.Outcome,
            Prescriptions: visit.Prescriptions,
            Limitations: visit.Limitations,
            ClinicalNotes: visit.ClinicalNotes,
            NextDeadlineDate: visit.NextDeadlineDate
        );
    }

    // ── D1: Fitness Judgment PDF ──────────────────────────────────────────────
    public async Task<byte[]> GenerateFitnessJudgment(int medicalVisitId, CancellationToken cancellationToken = default)
    {
        var data = await BuildFitnessJudgmentData(medicalVisitId, cancellationToken);
        var document = new FitnessJudgmentPdfDocument(data);
        return await Task.Run(() => document.GeneratePdf(), cancellationToken);
    }

    // ── Existing download endpoint helper ────────────────────────────────────
    public async Task<byte[]> GenerateFitnessJudgmentPdf(
        int medicalVisitId,
        CancellationToken cancellationToken = default)
    {
        var data = await BuildFitnessJudgmentData(medicalVisitId, cancellationToken);
        var document = new FitnessJudgmentPdfDocument(data);
        return await Task.Run(() => document.GeneratePdf(), cancellationToken);
    }

    // ── D2: Allegato 3B XML ───────────────────────────────────────────────────
    public async Task<byte[]> GenerateAllegato3B(int companyId, CancellationToken cancellationToken = default)
    {
        var tenantId = GetTenantId();

        var company = await _db.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == companyId && c.TenantId == tenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Company {companyId} not found.");

        // Default period: previous calendar year
        var now = DateTime.UtcNow;
        var periodYear = now.Year - 1;
        var yearStart = new DateTime(periodYear, 1, 1);
        var yearEnd = new DateTime(periodYear, 12, 31, 23, 59, 59, 999);

        // Employees of this company (tenant-scoped)
        var employees = await _db.Employees
            .AsNoTracking()
            .Where(e => e.CompanyId == companyId && e.TenantId == tenantId)
            .ToListAsync(cancellationToken);

        var employeeIds = employees.Select(e => e.Id).ToHashSet();

        // Visits in period for these employees
        var visits = await _db.MedicalVisits
            .AsNoTracking()
            .Where(v => employeeIds.Contains(v.EmployeeId)
                     && v.VisitDate >= yearStart
                     && v.VisitDate <= yearEnd)
            .ToListAsync(cancellationToken);

        var visitedEmployeeIds = visits.Select(v => v.EmployeeId).ToHashSet();

        // Gender counts
        var maleTotal = employees.Count(e => e.Gender == "M");
        var femaleTotal = employees.Count(e => e.Gender == "F");
        var maleVisited = employees.Count(e => e.Gender == "M" && visitedEmployeeIds.Contains(e.Id));
        var femaleVisited = employees.Count(e => e.Gender == "F" && visitedEmployeeIds.Contains(e.Id));

        // Outcome classification
        var idoneiIds = new HashSet<int>();
        var parzialiIds = new HashSet<int>();
        var tempInidoneiIds = new HashSet<int>();
        var permInidoneiIds = new HashSet<int>();

        foreach (var g in visits.GroupBy(v => v.EmployeeId))
        {
            var outcomes = g.Select(v => (v.Outcome ?? "").ToLowerInvariant()).ToList();
            if (outcomes.Any(o => o.Contains("idone") && !o.Contains("parzial") && !o.Contains("inidone")))
                idoneiIds.Add(g.Key);
            if (outcomes.Any(o => o.Contains("parzial") || o.Contains("prescr") || o.Contains("limit")))
                parzialiIds.Add(g.Key);
            if (outcomes.Any(o => o.Contains("inidone") && o.Contains("tempor")))
                tempInidoneiIds.Add(g.Key);
            if (outcomes.Any(o => o.Contains("inidone") && o.Contains("perman")))
                permInidoneiIds.Add(g.Key);
        }

        var maleIdonei = employees.Count(e => e.Gender == "M" && idoneiIds.Contains(e.Id));
        var femaleIdonei = employees.Count(e => e.Gender == "F" && idoneiIds.Contains(e.Id));
        var maleParziali = employees.Count(e => e.Gender == "M" && parzialiIds.Contains(e.Id));
        var femaleParziali = employees.Count(e => e.Gender == "F" && parzialiIds.Contains(e.Id));
        var maleTemp = employees.Count(e => e.Gender == "M" && tempInidoneiIds.Contains(e.Id));
        var femaleTemp = employees.Count(e => e.Gender == "F" && tempInidoneiIds.Contains(e.Id));
        var malePerm = employees.Count(e => e.Gender == "M" && permInidoneiIds.Contains(e.Id));
        var femalePerm = employees.Count(e => e.Gender == "F" && permInidoneiIds.Contains(e.Id));

        // Risk factors linked to employees of this company
        var employeeRiskRows = await (from er in _db.EmployeeRisks.AsNoTracking()
                                       join e in _db.Employees.AsNoTracking() on er.EmployeeId equals e.Id
                                       where e.CompanyId == companyId && e.TenantId == tenantId
                                       join rf in _db.RiskFactors.AsNoTracking() on er.RiskFactorId equals rf.Id
                                       select new { er.EmployeeId, rf.Allegato3BCategory, rf.Name, rf.Description })
                                      .ToListAsync(cancellationToken);

        // Build risk section rows (codes 22-42) based on Allegato3BCategory match
        var riskCodeMap = new Dictionary<string, (int Code, string Label)>(StringComparer.OrdinalIgnoreCase)
        {
            ["movimentazione manuale carichi"] = (22, "MOVIMENTAZIONE MANUALE DEI CARICHI"),
            ["sovraccarico biomeccanico arti superiori"] = (23, "SOVRACCARICO BIOMECCANICO ARTI SUPERIORI"),
            ["rischi posturali"] = (24, "RISCHI POSTURALI"),
            ["agenti chimici"] = (25, "AGENTI CHIMICI"),
            ["agenti cancerogeni"] = (26, "AGENTI CANCEROGENI"),
            ["agenti mutageni"] = (27, "AGENTI MUTAGENI"),
            ["amianto"] = (28, "AMIANTO"),
            ["silice"] = (29, "SILICE"),
            ["agenti biologici"] = (30, "AGENTI BIOLOGICI"),
            ["videoterminali"] = (31, "VIDEOTERMINALI"),
            ["vibrazioni corpo intero"] = (32, "VIBRAZIONI CORPO INTERO"),
            ["vibrazioni mano braccio"] = (33, "VIBRAZIONI MANO BRACCIO"),
            ["rumore"] = (34, "RUMORE"),
            ["campi elettromagnetici"] = (35, "CAMPI ELETTROMAGNETICI"),
            ["radiazioni ottiche artificiali"] = (36, "RADIAZIONI OTTICHE ARTIFICIALI"),
            ["radiazioni ultraviolette naturali"] = (37, "RADIAZIONI ULTRAVIOLETTE NATURALI"),
            ["microclima"] = (38, "MICROCLIMA SEVERO"),
            ["infrasuoni/ultrasuoni"] = (39, "INFRASUONI/ULTRASUONI"),
            ["atmosfere iperbariche"] = (40, "ATMOSFERE IPERBARICHE"),
            ["lavoro notturno"] = (41, "LAVORO NOTTURNO > 80 GG/ANNO"),
            ["altri rischi"] = (42, "ALTRI RISCHI EVIDENZIATI DA V.R."),
        };

        var riskRows = new List<string>();
        var matchedCategories = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var row in employeeRiskRows)
        {
            var cat = row.Allegato3BCategory ?? row.Name ?? "";
            if (riskCodeMap.TryGetValue(cat, out var mapped) && matchedCategories.Add(cat))
            {
                var empId = row.EmployeeId;
                var isMale = employees.Any(e => e.Id == empId && e.Gender == "M");
                var isFemale = employees.Any(e => e.Id == empId && e.Gender == "F");
                var totalM = isMale ? 1 : 0;
                var totalF = isFemale ? 1 : 0;
                var visitedM = (isMale && visitedEmployeeIds.Contains(empId)) ? 1 : 0;
                var visitedF = (isFemale && visitedEmployeeIds.Contains(empId)) ? 1 : 0;
                var partialM = (isMale && parzialiIds.Contains(empId)) ? 1 : 0;
                var partialF = (isFemale && parzialiIds.Contains(empId)) ? 1 : 0;
                var fitM = (isMale && idoneiIds.Contains(empId)) ? 1 : 0;
                var fitF = (isFemale && idoneiIds.Contains(empId)) ? 1 : 0;

                riskRows.Add($"<Rischio><Codice>{mapped.Code}</Codice><Descrizione>{System.Security.SecurityElement.Escape(mapped.Label)}</Descrizione><SoggettiM>{totalM}</SoggettiM><SoggettiF>{totalF}</SoggettiF><VisitatiM>{visitedM}</VisitatiM><VisitatiF>{visitedF}</VisitatiF><ParzialiM>{partialM}</ParzialiM><ParzialiF>{partialF}</ParzialiF><IdoneiM>{fitM}</IdoneiM><IdoneiF>{fitF}</IdoneiF></Rischio>");
            }
        }

        // Alcohol/drug monitoring from exam types (look for alcol/tossic in visit exam names)
        var visitExams = await _db.VisitExams
            .AsNoTracking()
            .Where(ve => visitedEmployeeIds.Contains(ve.MedicalVisitId))
            .Include(ve => ve.ExamType)
            .ToListAsync(cancellationToken);

        var alcolIds = new HashSet<int>();
        var drogaIds = new HashSet<int>();
        foreach (var ve in visitExams)
        {
            var name = (ve.ExamType?.Name ?? "").ToLowerInvariant();
            if (name.Contains("alcol") || name.Contains("etil"))
            {
                var visit = visits.FirstOrDefault(v => v.Id == ve.MedicalVisitId);
                if (visit != null) alcolIds.Add(visit.EmployeeId);
            }
            if (name.Contains("tossic") || name.Contains("stupe"))
            {
                var visit = visits.FirstOrDefault(v => v.Id == ve.MedicalVisitId);
                if (visit != null) drogaIds.Add(visit.EmployeeId);
            }
        }

        var alcolM = employees.Count(e => e.Gender == "M" && alcolIds.Contains(e.Id));
        var alcolF = employees.Count(e => e.Gender == "F" && alcolIds.Contains(e.Id));
        var drogaM = employees.Count(e => e.Gender == "M" && drogaIds.Contains(e.Id));
        var drogaF = employees.Count(e => e.Gender == "F" && drogaIds.Contains(e.Id));

        var vat = System.Security.SecurityElement.Escape(company.VATNumber ?? "");
        var companyName = System.Security.SecurityElement.Escape(company.Name);

        var xml = $"""
            <?xml version="1.0" encoding="UTF-8"?>
            <Allegato3B xmlns="http://www.inail.it/schemas/allegato3b/v1">
              <DatiAzienda>
                <AnnoRiferimento>{periodYear}</AnnoRiferimento>
                <RagioneSociale>{companyName}</RagioneSociale>
                <PartitaIVA>{vat}</PartitaIVA>
                <CodiceFiscale>{System.Security.SecurityElement.Escape(company.TaxCode ?? "")}</CodiceFiscale>
                <IndirizzoSedeLegale>{System.Security.SecurityElement.Escape(company.LegalAddress ?? "")}</IndirizzoSedeLegale>
                <INAILPosizione>{System.Security.SecurityElement.Escape(company.INAILPosition ?? "")}</INAILPosizione>
                <INAILPolizza>{System.Security.SecurityElement.Escape(company.INAILPolicyNumber ?? "")}</INAILPolizza>
              </DatiAzienda>
              <DatiLavoratori>
                <LavoratoriOccupati3006M>{maleTotal}</LavoratoriOccupati3006M>
                <LavoratoriOccupati3006F>{femaleTotal}</LavoratoriOccupati3006F>
                <LavoratoriOccupati3112M>{maleTotal}</LavoratoriOccupati3112M>
                <LavoratoriOccupati3112F>{femaleTotal}</LavoratoriOccupati3112F>
                <LavoratoriSottopostiSorveglianzaM>{maleVisited}</LavoratoriSottopostiSorveglianzaM>
                <LavoratoriSottopostiSorveglianzaF>{femaleVisited}</LavoratoriSottopostiSorveglianzaF>
                <LavoratoriIdoneiM>{maleIdonei}</LavoratoriIdoneiM>
                <LavoratoriIdoneiF>{femaleIdonei}</LavoratoriIdoneiF>
                <LavoratoriIdoneitaParzialeM>{maleParziali}</LavoratoriIdoneitaParzialeM>
                <LavoratoriIdoneitaParzialeF>{femaleParziali}</LavoratoriIdoneitaParzialeF>
                <LavoratoriTemporaneamenteInidoneiM>{maleTemp}</LavoratoriTemporaneamenteInidoneiM>
                <LavoratoriTemporaneamenteInidoneiF>{femaleTemp}</LavoratoriTemporaneamenteInidoneiF>
                <LavoratoriPermanentementeInidoneiM>{malePerm}</LavoratoriPermanentementeInidoneiM>
                <LavoratoriPermanentementeInidoneiF>{femalePerm}</LavoratoriPermanentementeInidoneiF>
              </DatiLavoratori>
              <EsposizioneRischi>
                {string.Join("", riskRows)}
              </EsposizioneRischi>
              <AdempimentiArt41>
                <AccertamentiAlcol><ControllatiM>{alcolM}</ControllatiM><ControllatiF>{alcolF}</ControllatiF><InviatiSERTM>0</InviatiSERTM><InviatiSERTF>0</InviatiSERTF><DipendenzaM>0</DipendenzaM><DipendenzaF>0</DipendenzaF></AccertamentiAlcol>
                <AccertamentiSostanze><ControllatiM>{drogaM}</ControllatiM><ControllatiF>{drogaF}</ControllatiF><InviatiSERTM>0</InviatiSERTM><InviatiSERTF>0</InviatiSERTF><DipendenzaM>0</DipendenzaM><DipendenzaF>0</DipendenzaF></AccertamentiSostanze>
              </AdempimentiArt41>
              <Note>{System.Security.SecurityElement.Escape("Dati generati automaticamente da MedWork Manager. Trasmissione a INAIL non implementata.")}</Note>
            </Allegato3B>
            """;

        return Encoding.UTF8.GetBytes(xml);
    }

    // ── Honest well-formedness validation (replaces fake XSD) ─────────────────
    public Task<Allegato3BValidationResult> ValidateAllegato3BXsd(int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            var xmlBytes = GenerateAllegato3B(companyId, cancellationToken).GetAwaiter().GetResult();
            var xmlString = Encoding.UTF8.GetString(xmlBytes);

            // Honest check: verify the XML is well-formed
            var doc = new XmlDocument();
            doc.LoadXml(xmlString);

            return Task.FromResult(new Allegato3BValidationResult(true, Array.Empty<string>()));
        }
        catch (XmlException ex)
        {
            return Task.FromResult(new Allegato3BValidationResult(false, new[] { ex.Message }));
        }
        catch (Exception ex)
        {
            return Task.FromResult(new Allegato3BValidationResult(false, new[] { ex.Message }));
        }
    }

    // ── Honest submit: no simulated INAIL transmission ───────────────────────
    public Task<Allegato3BSubmissionResult> SubmitAllegato3B(int companyId, CancellationToken cancellationToken = default)
    {
        var validation = ValidateAllegato3BXsd(companyId, cancellationToken).GetAwaiter().GetResult();
        if (!validation.IsValid)
            return Task.FromResult(new Allegato3BSubmissionResult(false, null, "XML non valido: " + string.Join("; ", validation.Errors)));

        return Task.FromResult(new Allegato3BSubmissionResult(
            false,
            null,
            "Generazione XML completata. La trasmissione telematica a INAIL non è ancora implementata."));
    }

    // ── D3: Sanitary Plan PDF ─────────────────────────────────────────────────
    public async Task<byte[]> GenerateSanitaryPlan(int employeeId, CancellationToken cancellationToken = default)
    {
        var tenantId = GetTenantId();

        var employee = await _db.Employees
            .AsNoTracking()
            .Include(e => e.Company)
            .Include(e => e.MedicalRecord)
            .FirstOrDefaultAsync(e => e.Id == employeeId && e.TenantId == tenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Employee {employeeId} not found.");

        var visits = await _db.MedicalVisits
            .AsNoTracking()
            .Include(v => v.Doctor)
            .Where(v => v.EmployeeId == employeeId && v.TenantId == tenantId)
            .OrderByDescending(v => v.VisitDate)
            .ToListAsync(cancellationToken);

        var protocols = await _db.PersonalProtocols
            .AsNoTracking()
            .Include(p => p.Protocol)
            .Where(p => p.EmployeeId == employeeId && p.TenantId == tenantId)
            .ToListAsync(cancellationToken);

        var risks = await _db.EmployeeRisks
            .AsNoTracking()
            .Include(r => r.RiskFactor)
            .Where(r => r.EmployeeId == employeeId && r.TenantId == tenantId)
            .ToListAsync(cancellationToken);

        var exams = await _db.ScheduledExams
            .AsNoTracking()
            .Include(s => s.ExamType)
            .Where(s => s.EmployeeId == employeeId && s.TenantId == tenantId)
            .ToListAsync(cancellationToken);

        var document = CreateSanitaryPlanPdf(employee, visits, protocols, risks, exams);
        return await Task.FromResult(document.GeneratePdf());
    }

    private static IDocument CreateSanitaryPlanPdf(
        Employee employee,
        List<MedicalVisit> visits,
        List<PersonalProtocol> protocols,
        List<EmployeeRisk> risks,
        List<ScheduledExam> exams)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                page.Header().Element(ComposeSanitaryPlanHeader);
                page.Content().Element(compose => ComposeSanitaryPlanBody(compose, employee, visits, protocols, risks, exams));
                page.Footer().Element(ComposeSanitaryPlanFooter);
            });
        });
    }

    private static void ComposeSanitaryPlanHeader(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().Text("PIANO SANITARIO INDIVIDUALE")
                .Bold().FontSize(14).FontColor(Colors.Blue.Darken2);
            col.Item().Text("Art. 41, comma 4, D.Lgs. 81/2008 — Sorveglianza sanitaria dei lavoratori")
                .FontSize(9).FontColor(Colors.Grey.Darken1);
            col.Item().PaddingTop(4).LineHorizontal(1).LineColor(Colors.Blue.Darken2);
        });
    }

    private static void ComposeSanitaryPlanBody(
        IContainer container,
        Employee employee,
        List<MedicalVisit> visits,
        List<PersonalProtocol> protocols,
        List<EmployeeRisk> risks,
        List<ScheduledExam> exams)
    {
        container.PaddingTop(10).Column(col =>
        {
            // Section 1: Dati anagrafici
            col.Item().Text("DATI DEL LAVORATORE").Bold().FontSize(11).FontColor(Colors.Blue.Darken2);
            col.Item().PaddingTop(4).Table(table =>
            {
                table.ColumnsDefinition(c =>
                {
                    c.RelativeColumn(1); c.RelativeColumn(2);
                    c.RelativeColumn(1); c.RelativeColumn(2);
                });
                table.Cell().LabelCell("Cognome e Nome"); table.Cell().ValueCell($"{employee.FirstName} {employee.LastName}");
                table.Cell().LabelCell("Codice Fiscale"); table.Cell().ValueCell(employee.TaxCode);
                table.Cell().LabelCell("Mansione"); table.Cell().ValueCell(employee.JobRole);
                table.Cell().LabelCell("Azienda"); table.Cell().ValueCell(employee.Company?.Name ?? "—");
            });

            // Section 2: Rischi
            col.Item().PaddingTop(12).Text("RISCHI LAVORATIVI ASSOCIATI").Bold().FontSize(11).FontColor(Colors.Blue.Darken2);
            col.Item().PaddingTop(4).Table(table =>
            {
                table.ColumnsDefinition(c => { c.RelativeColumn(3); c.RelativeColumn(2); });
                table.Cell().LabelCell("Fattore di rischio"); table.Cell().LabelCell("Categoria Allegato 3B");
                foreach (var r in risks)
                {
                    table.Cell().ValueCell(r.RiskFactor?.Name ?? "—");
                    table.Cell().ValueCell(r.RiskFactor?.Allegato3BCategory ?? "—");
                }
                if (!risks.Any())
                {
                    table.Cell().ValueCell("Nessun rischio registrato"); table.Cell().ValueCell("");
                }
            });

            // Section 3: Protocolli personali
            col.Item().PaddingTop(12).Text("PROTOCOLLI DI SORVEGLIANZA").Bold().FontSize(11).FontColor(Colors.Blue.Darken2);
            col.Item().PaddingTop(4).Table(table =>
            {
                table.ColumnsDefinition(c => { c.RelativeColumn(2); c.RelativeColumn(1); c.RelativeColumn(2); });
                table.Cell().LabelCell("Protocollo"); table.Cell().LabelCell("Cadenza (gg)"); table.Cell().LabelCell("Riferimento");
                foreach (var p in protocols)
                {
                    table.Cell().ValueCell(p.Protocol?.Name ?? "—");
                    table.Cell().ValueCell(p.Protocol != null ? p.Protocol.CadenceDays.ToString() : "—");
                    table.Cell().ValueCell(p.Protocol?.LawReference ?? "—");
                }
                if (!protocols.Any())
                {
                    table.Cell().ValueCell("Nessun protocollo assegnato"); table.Cell().ValueCell(""); table.Cell().ValueCell("");
                }
            });

            // Section 4: Esami programmati
            col.Item().PaddingTop(12).Text("ESAMI PROGRAMMATI").Bold().FontSize(11).FontColor(Colors.Blue.Darken2);
            col.Item().PaddingTop(4).Table(table =>
            {
                table.ColumnsDefinition(c => { c.RelativeColumn(2); c.RelativeColumn(1); c.RelativeColumn(2); });
                table.Cell().LabelCell("Esame"); table.Cell().LabelCell("Scadenza"); table.Cell().LabelCell("Stato");
                foreach (var s in exams)
                {
                    table.Cell().ValueCell(s.ExamType?.Name ?? "—");
                    table.Cell().ValueCell(s.DueDate.ToString("dd/MM/yyyy"));
                    table.Cell().ValueCell(s.Status.ToString());
                }
                if (!exams.Any())
                {
                    table.Cell().ValueCell("Nessun esame programmato"); table.Cell().ValueCell(""); table.Cell().ValueCell("");
                }
            });

            // Section 5: Storico visite
            col.Item().PaddingTop(12).Text("STORICO VISITE MEDICHE").Bold().FontSize(11).FontColor(Colors.Blue.Darken2);
            col.Item().PaddingTop(4).Table(table =>
            {
                table.ColumnsDefinition(c =>
                {
                    c.RelativeColumn(1); c.RelativeColumn(1); c.RelativeColumn(2); c.RelativeColumn(1);
                });
                table.Cell().LabelCell("Data"); table.Cell().LabelCell("Tipo"); table.Cell().LabelCell("Esito"); table.Cell().LabelCell("Prossima scadenza");
                foreach (var v in visits.Take(10))
                {
                    table.Cell().ValueCell(v.VisitDate.ToString("dd/MM/yyyy"));
                    table.Cell().ValueCell(MapVisitType(v.VisitType).ToString());
                    table.Cell().ValueCell(v.Outcome ?? "—");
                    table.Cell().ValueCell(v.NextDeadlineDate.ToString("dd/MM/yyyy"));
                }
                if (!visits.Any())
                {
                    table.Cell().ValueCell("—"); table.Cell().ValueCell("—"); table.Cell().ValueCell("Nessuna visita"); table.Cell().ValueCell("—");
                }
            });
        });
    }

    private static void ComposeSanitaryPlanFooter(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Text(text =>
            {
                text.Span("MedWork Manager — Piano sanitario generato il ").FontSize(7).FontColor(Colors.Grey.Medium);
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

    // ── Helpers ──────────────────────────────────────────────────────────────
    private static MedicalVisitTypeLabel MapVisitType(MedWork.Api.Models.MedicalVisitType type) => type switch
    {
        MedWork.Api.Models.MedicalVisitType.Preventive => MedicalVisitTypeLabel.Preventiva,
        MedWork.Api.Models.MedicalVisitType.Periodic => MedicalVisitTypeLabel.Periodica,
        MedWork.Api.Models.MedicalVisitType.RoleChange => MedicalVisitTypeLabel.CambioMansione,
        MedWork.Api.Models.MedicalVisitType.EmployeeRequest => MedicalVisitTypeLabel.RichiestaLavoratore,
        MedWork.Api.Models.MedicalVisitType.EndOfRelationship => MedicalVisitTypeLabel.CessazioneRapporto,
        _ => MedicalVisitTypeLabel.Periodica
    };
}
