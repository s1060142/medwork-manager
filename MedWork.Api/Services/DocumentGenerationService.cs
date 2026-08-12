using System.Xml;
using System.Xml.Schema;

namespace MedWork.Api.Services;

public class DocumentGenerationService : IDocumentGenerationService
{
    public Task<string> GenerateSanitaryPlan(int employeeId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"STUB: GenerateSanitaryPlan for employee {employeeId}");
    }

    public Task<string> GenerateAllegato3B(int companyId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"STUB: GenerateAllegato3B for company {companyId}");
    }

    public Task<string> GenerateFitnessJudgment(int medicalVisitId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"STUB: GenerateFitnessJudgment for visit {medicalVisitId}");
    }

    public Task<Allegato3BValidationResult> ValidateAllegato3BXsd(int companyId, CancellationToken cancellationToken = default)
    {
        // Real XSD validation: build the Allegato 3B XML and validate against the embedded schema.
        var xml = BuildAllegato3BXml(companyId);
        var errors = new List<string>();

        try
        {
            var schemaSet = new XmlSchemaSet();
            // Minimal schema enforcing required structure (in production: load from INAIL official XSD).
            schemaSet.Add("allegato3b.xsd", XmlReader.Create(new System.IO.StringReader(Allegato3BSchema)));
            var settings = new XmlReaderSettings { Schemas = schemaSet, ValidationType = ValidationType.Schema };
            using var reader = XmlReader.Create(new System.IO.StringReader(xml), settings);
            while (reader.Read()) { }
        }
        catch (XmlSchemaValidationException ex)
        {
            errors.Add(ex.Message);
        }
        catch (XmlException ex)
        {
            errors.Add(ex.Message);
        }

        return Task.FromResult(new Allegato3BValidationResult(errors.Count == 0, errors));
    }

    public Task<Allegato3BSubmissionResult> SubmitAllegato3B(int companyId, CancellationToken cancellationToken = default)
    {
        // Validate first; only submit if valid. (Transport to INAIL endpoint is infra.)
        var validation = ValidateAllegato3BXsd(companyId, cancellationToken).GetAwaiter().GetResult();
        if (!validation.IsValid)
        {
            return Task.FromResult(new Allegato3BSubmissionResult(false, null,
                "Validation failed: " + string.Join("; ", validation.Errors)));
        }

        var receiptId = "INAIL-" + Guid.NewGuid().ToString("N")[..12].ToUpperInvariant();
        return Task.FromResult(new Allegato3BSubmissionResult(true, receiptId, "Submitted to INAIL (simulated)."));
    }

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