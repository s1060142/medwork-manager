using System.Xml;
using System.Xml.Schema;
using MedWork.Api.Data;
using MedWork.Api.Documents;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace MedWork.Api.Services;

public class DocumentGenerationService : IDocumentGenerationService
{
    private readonly AppDbContext _db;

    // Required by QuestPDF licence declaration (community licence = free for revenue < $1M)
    static DocumentGenerationService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public DocumentGenerationService(AppDbContext db)
    {
        _db = db;
    }

    // ── STUB methods kept for backward compat ───────────────────────────────
    public Task<string> GenerateSanitaryPlan(int employeeId, CancellationToken cancellationToken = default)
        => Task.FromResult($"STUB: GenerateSanitaryPlan for employee {employeeId}");

    public Task<string> GenerateAllegato3B(int companyId, CancellationToken cancellationToken = default)
        => Task.FromResult($"STUB: GenerateAllegato3B for company {companyId}");

    public Task<string> GenerateFitnessJudgment(int medicalVisitId, CancellationToken cancellationToken = default)
        => Task.FromResult($"STUB: GenerateFitnessJudgment for visit {medicalVisitId}");

    // ── Real PDF ─────────────────────────────────────────────────────────────
    public async Task<byte[]> GenerateFitnessJudgmentPdf(
        int medicalVisitId,
        CancellationToken cancellationToken = default)
    {
        var visit = await _db.MedicalVisits
            .AsNoTracking()
            .Include(v => v.Doctor)
            .Include(v => v.Employee)
                .ThenInclude(e => e!.Company)
            .FirstOrDefaultAsync(v => v.Id == medicalVisitId, cancellationToken)
            ?? throw new KeyNotFoundException($"Medical visit {medicalVisitId} not found.");

        // Count visits for this doctor+tenant to build progressive number
        var progressiveNumber = await _db.MedicalVisits
            .AsNoTracking()
            .Where(v => v.TenantId == visit.TenantId
                     && v.DoctorId == visit.DoctorId
                     && v.VisitDate.Year == visit.VisitDate.Year
                     && v.Id <= medicalVisitId)
            .CountAsync(cancellationToken);

        var data = new FitnessJudgmentData(
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
            Prescriptions: null,   // will come from VisitJudgment entity in a later sprint
            Limitations: null,
            ClinicalNotes: visit.ClinicalNotes,
            NextDeadlineDate: visit.NextDeadlineDate
        );

        var document = new FitnessJudgmentPdfDocument(data);
        return document.GeneratePdf();
    }

    // ── Allegato 3B (unchanged) ───────────────────────────────────────────────
    public Task<Allegato3BValidationResult> ValidateAllegato3BXsd(int companyId, CancellationToken cancellationToken = default)
    {
        var xml = BuildAllegato3BXml(companyId);
        var errors = new List<string>();
        try
        {
            var schemaSet = new XmlSchemaSet();
            schemaSet.Add("allegato3b.xsd", XmlReader.Create(new System.IO.StringReader(Allegato3BSchema)));
            var settings = new XmlReaderSettings { Schemas = schemaSet, ValidationType = ValidationType.Schema };
            using var reader = XmlReader.Create(new System.IO.StringReader(xml), settings);
            while (reader.Read()) { }
        }
        catch (XmlSchemaValidationException ex) { errors.Add(ex.Message); }
        catch (XmlException ex) { errors.Add(ex.Message); }

        return Task.FromResult(new Allegato3BValidationResult(errors.Count == 0, errors));
    }

    public Task<Allegato3BSubmissionResult> SubmitAllegato3B(int companyId, CancellationToken cancellationToken = default)
    {
        var validation = ValidateAllegato3BXsd(companyId, cancellationToken).GetAwaiter().GetResult();
        if (!validation.IsValid)
            return Task.FromResult(new Allegato3BSubmissionResult(false, null, "Validation failed: " + string.Join("; ", validation.Errors)));

        var receiptId = "INAIL-" + Guid.NewGuid().ToString("N")[..12].ToUpperInvariant();
        return Task.FromResult(new Allegato3BSubmissionResult(true, receiptId, "Submitted to INAIL (simulated)."));
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

    private static string BuildAllegato3BXml(int companyId) =>
        $"""
        <Allegato3B xmlns="allegato3b.xsd">
          <IdentificativoAzienda>{companyId}</IdentificativoAzienda>
          <DataInvio>{DateTime.UtcNow:yyyy-MM-dd}</DataInvio>
          <Sede>SED0001</Sede>
          <Lavoratori>0</Lavoratori>
          <Esito>OK</Esito>
        </Allegato3B>
        """;

    private const string Allegato3BSchema = """
        <?xml version="1.0" encoding="utf-8"?>
        <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="allegato3b.xsd" xmlns:tns="allegato3b.xsd" elementFormDefault="qualified">
          <xs:element name="Allegato3B">
            <xs:complexType>
              <xs:sequence>
                <xs:element name="IdentificativoAzienda" type="xs:int" />
                <xs:element name="DataInvio" type="xs:date" />
                <xs:element name="Sede" type="xs:string" />
                <xs:element name="Lavoratori" type="xs:int" />
                <xs:element name="Esito" type="xs:string" />
              </xs:sequence>
            </xs:complexType>
          </xs:element>
        </xs:schema>
        """;
}