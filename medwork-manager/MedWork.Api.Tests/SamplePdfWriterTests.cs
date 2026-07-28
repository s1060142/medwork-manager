using System.Text;
using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Services;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Infrastructure;

namespace MedWork.Api.Tests;

/// <summary>
/// Genera PDF di esempio REALI su disco (cartella sample-pdfs) così da poterli ispezionare.
/// Questo test è puramente dimostrativo e scrive i file nell'albero del repo.
/// </summary>
public class SamplePdfWriterTests
{
    static SamplePdfWriterTests()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    [Fact(Skip = "Demo only: genera i PDF di esempio su disco")]
    public void WriteSamplePdfs()
    {
        using var ctx = BuildContext();
        var service = new DocumentGenerationService(ctx);
        var outDir = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "sample-pdfs");
        outDir = Path.GetFullPath(outDir);
        Directory.CreateDirectory(outDir);

        File.WriteAllBytes(Path.Combine(outDir, "giudizio-idoneita-1.pdf"), service.GenerateFitnessJudgment(1).Result);
        File.WriteAllBytes(Path.Combine(outDir, "piano-sanitario-1.pdf"), service.GenerateSanitaryPlan(1).Result);
        File.WriteAllBytes(Path.Combine(outDir, "allegato-3b-1.pdf"), service.GenerateAllegato3B(1).Result);
    }

    private static AppDbContext BuildContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("SamplePdf-" + Guid.NewGuid()).Options;
        var ctx = new AppDbContext(options);

        var company = new Company { Name = "Acme Industria S.p.A.", VATNumber = "IT01234567890" };
        var employee = new Employee
        {
            Id = 1, CompanyId = 1, BranchId = 1, FirstName = "Mario", LastName = "Rossi",
            TaxCode = "RSSMRA80A01F205X", JobRole = "Operatore Linea", BirthDate = new DateTime(1980, 1, 1),
            Gender = "M", BirthCity = "Milano", BirthCityCode = "F205"
        };
        employee.Company = company;
        var doctor = new Doctor { Id = 1, FirstName = "Laura", LastName = "Bianchi", MedicalLicenseNumber = "MED-LOM-98765" };
        var examType = new ExamType { Id = 1, Name = "Spirometria" };
        var visit = new MedicalVisit
        {
            Id = 1, EmployeeId = 1, DoctorId = 1, VisitDate = new DateTime(2026, 1, 10),
            NextDeadlineDate = new DateTime(2027, 1, 10), Outcome = "Idoneo con prescrizioni",
            ClinicalNotes = "Visita demo per convalida PDF.", VisitType = MedicalVisitType.Periodic
        };
        visit.Employee = employee; visit.Doctor = doctor;
        visit.VisitExams = new List<VisitExam> { new() { ExamTypeId = 1, Result = "Funzionalità regolare" } };
        visit.VisitExams.First().ExamType = examType;

        ctx.Companies.Add(company); ctx.Employees.Add(employee); ctx.Doctors.Add(doctor);
        ctx.ExamTypes.Add(examType); ctx.MedicalVisits.Add(visit); ctx.SaveChanges();
        return ctx;
    }
}