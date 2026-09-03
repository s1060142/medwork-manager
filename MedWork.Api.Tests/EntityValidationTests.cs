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
                TenantId = 1,
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
                TenantId = 1,
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
                TenantId = 1,
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
                TenantId = 1,
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
                TenantId = 1,
                Name = "Rumore",
                Description = "Esposizione continuativa a livelli elevati di rumore in produzione.",
                SeverityLevel = 3
            }
        };

        yield return new object[]
        {
            new EmployeeRisk
            {
                TenantId = 1,
                EmployeeId = 1,
                RiskFactorId = 1
            }
        };

        yield return new object[]
        {
            new MedicalRecord
            {
                TenantId = 1,
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
                TenantId = 1,
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
                TenantId = 1,
                Name = "Spirometria",
                Category = "Funzionale Respiratorio"
            }
        };

        yield return new object[]
        {
            new VisitExam
            {
                TenantId = 1,
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

    [Theory]
    [InlineData("+39 02 1234567")]
    [InlineData("+39 02/1234567")]
    [InlineData("02-1234-5678")]
    [InlineData("02.123.4567")]
    [InlineData("+39 333 123 4567")]
    [InlineData("(02) 1234567")]
    [InlineData(null)]
    [InlineData("")]
    public void Company_With_Realistic_ContactPhone_Fax_Passes_Validation(string? phone)
    {
        var company = new Company
        {
            TenantId = 1,
            Name = "Acme Industria S.p.A.",
            VATNumber = "IT01234567890",
            ContactEmail = "hr@acme.it",
            ContactPhone = phone,
            Fax = phone
        };

        var validationResults = Validate(company);

        Assert.True(validationResults.Count == 0, $"Validation errors: {string.Join(" | ", validationResults.Select(r => r.ErrorMessage))}");
    }

    [Fact]
    public void Company_With_Invalid_Fax_Characters_Fails_Validation()
    {
        var company = new Company
        {
            TenantId = 1,
            Name = "Acme Industria S.p.A.",
            VATNumber = "IT01234567890",
            // 's' (lettera) non è ammesso nel nuovo pattern: solo cifre, +, spazi, -, ., (, ), /
            Fax = "fax: 02 1234567"
        };

        var validationResults = Validate(company);

        Assert.Contains(validationResults, r => r.MemberNames.Contains(nameof(Company.Fax)));
    }

    [Fact]
    public void MedicalVisit_With_Deadline_Before_Visit_Fails_Validation()
    {
        var invalidVisit = new MedicalVisit
        {
            TenantId = 1,
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

    [Fact]
    public void Entity_Validation_Succeeds_When_TenantId_Is_Zero_From_Client_Binding()
    {
        var company = new Company
        {
            TenantId = 0, // Bound from client without tenantId
            Name = "Azienda Test S.r.l.",
            VATNumber = "12345678901"
        };
        var contact = new CompanyContact
        {
            TenantId = 0,
            CompanyId = 1,
            Role = "RSPP",
            FullName = "Mario Bianchi"
        };
        var dept = new Department
        {
            TenantId = 0,
            CompanyId = 1,
            Name = "Amministrazione"
        };
        var location = new WorkLocation
        {
            TenantId = 0,
            CompanyId = 1,
            Name = "Sede Operativa"
        };

        Assert.Empty(Validate(company));
        Assert.Empty(Validate(contact));
        Assert.Empty(Validate(dept));
        Assert.Empty(Validate(location));
    }

    [Fact]
    public void CompanyContact_Requires_Role_And_FullName()
    {
        var invalidContact = new CompanyContact
        {
            CompanyId = 1,
            Role = "",
            FullName = ""
        };

        var results = Validate(invalidContact);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CompanyContact.Role)));
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CompanyContact.FullName)));
    }

    [Fact]
    public void Employee_Aliases_Map_Properly()
    {
        var employee = new Employee
        {
            FirstName = "Luca",
            LastName = "Verdi",
            TaxCode = "VRDLCU80A01F205X",
            JobRole = "Operaio",
            Nazionalita = "Italiana",
            MedicoCarante = "Dott. Mario Rossi"
        };

        Assert.Equal("Italiana", employee.Nationality);
        Assert.Equal("Dott. Mario Rossi", employee.MedicoCurante);
        Assert.Equal("Italiana", employee.Nazionalita);
        Assert.Equal("Dott. Mario Rossi", employee.MedicoCarante);
    }

    private static List<ValidationResult> Validate(object entity)
    {
        var context = new ValidationContext(entity);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(entity, context, results, validateAllProperties: true);
        return results;
    }
}
