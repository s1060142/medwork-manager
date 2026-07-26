using System.ComponentModel.DataAnnotations;
using MedWork.Api.Models;

namespace MedWork.Api.Tests;

public class EntityValidationTests
{
    public static IEnumerable<object[]> ValidEntities()
    {
        yield return new object[]
        {
            new Company
            {
                Name = "Acme Industria S.p.A.",
                VATNumber = "IT01234567890",
                ContactEmail = "hr@acme.it",
                ContactPhone = "+39 02 1234567"
            }
        };

        yield return new object[]
        {
            new Branch
            {
                CompanyId = 1,
                Address = "Via Roma 10",
                City = "Milano",
                Province = "MI",
                PostalCode = "20100"
            }
        };

        yield return new object[]
        {
            new Employee
            {
                CompanyId = 1,
                BranchId = 1,
                FirstName = "Mario",
                LastName = "Rossi",
                TaxCode = "RSSMRA80A01F205X",
                JobRole = "Operatore linea",
                BirthDate = new DateTime(1980, 1, 1),
                Gender = "M",
                BirthCity = "Milano",
                BirthCityCode = "F205",
                PersonalEmail = "mario.rossi@email.it",
                PhoneNumber = "+39 333 1234567"
            }
        };

        yield return new object[]
        {
            new Doctor
            {
                FirstName = "Laura",
                LastName = "Bianchi",
                MedicalLicenseNumber = "MED-LOM-98765",
                Specialty = "Medicina del Lavoro",
                Email = "medico@medwork.it"
            }
        };

        yield return new object[]
        {
            new RiskFactor
            {
                Name = "Rumore",
                Description = "Esposizione continuativa a livelli elevati di rumore in produzione.",
                SeverityLevel = 3
            }
        };

        yield return new object[]
        {
            new EmployeeRisk
            {
                EmployeeId = 1,
                RiskFactorId = 1
            }
        };

        yield return new object[]
        {
            new MedicalRecord
            {
                EmployeeId = 1,
                MedicalHistory = "Anamnesi lavorativa e clinica rilevante, nessuna controindicazione significativa.",
                Notes = "Controllo annuale.",
                CurrentTherapies = "Nessuna"
            }
        };

        yield return new object[]
        {
            new MedicalVisit
            {
                EmployeeId = 1,
                DoctorId = 1,
                VisitDate = new DateTime(2026, 3, 1),
                NextDeadlineDate = new DateTime(2026, 9, 1),
                Outcome = "Idoneo con prescrizioni",
                ClinicalNotes = "Uso DPI raccomandato",
                VisitType = MedicalVisitType.Periodic
            }
        };

        yield return new object[]
        {
            new ExamType
            {
                Name = "Spirometria",
                Category = "Funzionale Respiratorio"
            }
        };

        yield return new object[]
        {
            new VisitExam
            {
                MedicalVisitId = 1,
                ExamTypeId = 1,
                Result = "Valori nella norma",
                ReferenceRange = "FEV1 > 80%",
                Notes = "Nessuna anomalia"
            }
        };
    }

    [Theory]
    [MemberData(nameof(ValidEntities))]
    public void Entity_With_Valid_Data_Passes_Validation(object entity)
    {
        var validationResults = Validate(entity);

        Assert.True(validationResults.Count == 0, $"Validation errors: {string.Join(" | ", validationResults.Select(r => r.ErrorMessage))}");
    }

    [Fact]
    public void MedicalVisit_With_Deadline_Before_Visit_Fails_Validation()
    {
        var invalidVisit = new MedicalVisit
        {
            EmployeeId = 1,
            DoctorId = 1,
            VisitDate = new DateTime(2026, 3, 10),
            NextDeadlineDate = new DateTime(2026, 3, 9),
            Outcome = "Idoneo"
        };

        var validationResults = Validate(invalidVisit);

        Assert.Contains(validationResults, result =>
            result.MemberNames.Contains(nameof(MedicalVisit.NextDeadlineDate)) &&
            result.ErrorMessage is not null &&
            result.ErrorMessage.Contains("greater than or equal", StringComparison.OrdinalIgnoreCase));
    }

    private static List<ValidationResult> Validate(object entity)
    {
        var context = new ValidationContext(entity);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(entity, context, results, validateAllProperties: true);
        return results;
    }
}
