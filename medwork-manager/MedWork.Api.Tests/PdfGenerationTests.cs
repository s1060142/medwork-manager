using System.Text;
using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Services;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Infrastructure;

namespace MedWork.Api.Tests;

/// <summary>
/// Implementazione fittizia di IFieldEncryptionService per i test (round-trip identità),
/// così il DbContext InMemory non dipende da DataProtection.
/// </summary>
internal sealed class TestFieldEncryptionService : IFieldEncryptionService
{
    public string Encrypt(string value) => value;
    public string Decrypt(string value) => value;
}

/// <summary>
/// Verifica che la generazione PDF produca un file PDF valido (%PDF header),
/// esercitando il codice reale di QuestPDF su dati seedati in memoria.
/// </summary>
public class PdfGenerationTests
{
    static PdfGenerationTests()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private static AppDbContext CreateSeededContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("PdfTest-" + Guid.NewGuid())
            .Options;
        var ctx = new AppDbContext(options, new TestFieldEncryptionService());

        var company = new Company { Name = "Acme Industria S.p.A.", VATNumber = "IT01234567890" };
        var employee = new Employee
        {
            Id = 1,
            CompanyId = 1,
            BranchId = 1,
            FirstName = "Mario",
            LastName = "Rossi",
            TaxCode = "RSSMRA80A01F205X",
            JobRole = "Operatore Linea",
            BirthDate = new DateTime(1980, 1, 1),
            Gender = "M",
            BirthCity = "Milano",
            BirthCityCode = "F205"
        };
        employee.Company = company;
        var doctor = new Doctor { Id = 1, FirstName = "Laura", LastName = "Bianchi", MedicalLicenseNumber = "MED-LOM-98765" };
        var examType = new ExamType { Id = 1, Name = "Spirometria" };
        var visit = new MedicalVisit
        {
            Id = 1,
            EmployeeId = 1,
            DoctorId = 1,
            VisitDate = new DateTime(2026, 1, 10),
            NextDeadlineDate = new DateTime(2027, 1, 10),
            Outcome = "Idoneo con prescrizioni",
            ClinicalNotes = "Visita demo",
            VisitType = MedicalVisitType.Periodic
        };
        visit.Employee = employee;
        visit.Doctor = doctor;
        visit.VisitExams = new List<VisitExam>
        {
            new() { ExamTypeId = 1, Result = "Funzionalità regolare" }
        };
        visit.VisitExams.First().ExamType = examType;

        ctx.Companies.Add(company);
        ctx.Employees.Add(employee);
        ctx.Doctors.Add(doctor);
        ctx.ExamTypes.Add(examType);
        ctx.MedicalVisits.Add(visit);
        ctx.SaveChanges();

        return ctx;
    }

    [Fact]
    public async Task GenerateFitnessJudgment_ProducesValidPdf()
    {
        using var ctx = CreateSeededContext();
        var service = new DocumentGenerationService(ctx);

        var pdf = await service.GenerateFitnessJudgment(1);

        Assert.NotNull(pdf);
        Assert.True(pdf.Length > 100);
        var header = Encoding.ASCII.GetString(pdf.Take(5).ToArray());
        Assert.Equal("%PDF-", header);
    }

    [Fact]
    public async Task GenerateSanitaryPlan_ProducesValidPdf()
    {
        using var ctx = CreateSeededContext();
        var service = new DocumentGenerationService(ctx);

        var pdf = await service.GenerateSanitaryPlan(1);

        Assert.NotNull(pdf);
        var header = Encoding.ASCII.GetString(pdf.Take(5).ToArray());
        Assert.Equal("%PDF-", header);
    }

    [Fact]
    public async Task GenerateAllegato3B_ProducesValidPdf()
    {
        using var ctx = CreateSeededContext();
        var service = new DocumentGenerationService(ctx);

        var pdf = await service.GenerateAllegato3B(1);

        Assert.NotNull(pdf);
        var header = Encoding.ASCII.GetString(pdf.Take(5).ToArray());
        Assert.Equal("%PDF-", header);
    }
}
