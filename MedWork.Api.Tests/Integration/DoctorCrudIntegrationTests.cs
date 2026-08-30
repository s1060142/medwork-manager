using System.Net;
using System.Net.Http.Json;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.Extensions.DependencyInjection;

namespace MedWork.Api.Tests.Integration;

public class DoctorCrudIntegrationTests : IClassFixture<MedWorkWebAppFactory>
{
    private readonly MedWorkWebAppFactory _factory;

    public DoctorCrudIntegrationTests(MedWorkWebAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Post_MedicalRecord_Returns_Ok()
    {
        var employeeId = CreateUniqueEmployee();
        var client = _factory.CreateClient();

        var payload = new
        {
            employeeId,
            medicalHistory = "Anamnesi valida con descrizione clinica sufficientemente estesa.",
            notes = "Note test",
            currentTherapies = "Nessuna"
        };

        var response = await client.PostAsJsonAsync("/api/doctor-data/medical-records", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Post_MedicalRecord_DuplicateEmployee_Returns_Conflict()
    {
        var employeeId = CreateUniqueEmployee();
        var client = _factory.CreateClient();

        var payload = new
        {
            employeeId,
            medicalHistory = "Anamnesi valida con descrizione clinica sufficientemente estesa.",
            notes = "Prima creazione",
            currentTherapies = "Nessuna"
        };

        var first = await client.PostAsJsonAsync("/api/doctor-data/medical-records", payload);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/doctor-data/medical-records", payload);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Post_MedicalVisit_Valid_Returns_Ok()
    {
        var employeeId = EnsureEmployee();
        var doctorId = EnsureDoctor();
        var client = _factory.CreateClient();

        var payload = new
        {
            employeeId,
            doctorId,
            visitDate = new DateTime(2026, 3, 1),
            nextDeadlineDate = new DateTime(2026, 9, 1),
            outcome = "Idoneo",
            clinicalNotes = "Note visita",
            visitType = "Periodic"
        };

        var response = await client.PostAsJsonAsync("/api/doctor-data/medical-visits", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Post_MedicalVisit_InvalidDates_Returns_BadRequest()
    {
        var employeeId = EnsureEmployee();
        var doctorId = EnsureDoctor();
        var client = _factory.CreateClient();

        var payload = new
        {
            employeeId,
            doctorId,
            visitDate = new DateTime(2026, 3, 10),
            nextDeadlineDate = new DateTime(2026, 3, 9),
            outcome = "Idoneo"
        };

        var response = await client.PostAsJsonAsync("/api/doctor-data/medical-visits", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task VisitExam_Lifecycle_Create_Update_Delete_Works()
    {
        var medicalVisitId = EnsureMedicalVisit();
        var examTypeId = EnsureExamType();
        var client = _factory.CreateClient();

        var createPayload = new
        {
            medicalVisitId,
            examTypeId,
            result = "Valori nella norma",
            notes = "Note iniziali",
            referenceRange = "FEV1 > 80%"
        };

        var createResponse = await client.PostAsJsonAsync("/api/doctor-data/visit-exams", createPayload);
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<IdResponse>();
        Assert.NotNull(created);

        var updatePayload = new
        {
            medicalVisitId,
            examTypeId,
            result = "Valori aggiornati",
            notes = "Note aggiornate",
            referenceRange = "FEV1 > 75%"
        };

        var updateResponse = await client.PutAsJsonAsync($"/api/doctor-data/visit-exams/{created!.Id}", updatePayload);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/doctor-data/visit-exams/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task MedicalVisit_Lifecycle_Create_Update_Delete_Works()
    {
        var employeeId = EnsureEmployee();
        var doctorId = EnsureDoctor();
        var client = _factory.CreateClient();

        var createPayload = new
        {
            employeeId,
            doctorId,
            visitDate = new DateTime(2026, 4, 1),
            nextDeadlineDate = new DateTime(2026, 10, 1),
            outcome = "Idoneo con prescrizioni",
            clinicalNotes = "Note create",
            visitType = "RoleChange"
        };

        var createResponse = await client.PostAsJsonAsync("/api/doctor-data/medical-visits", createPayload);
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<IdResponse>();
        Assert.NotNull(created);

        var updatePayload = new
        {
            employeeId,
            doctorId,
            visitDate = new DateTime(2026, 4, 2),
            nextDeadlineDate = new DateTime(2026, 10, 2),
            outcome = "Idoneo",
            clinicalNotes = "Note update",
            visitType = "Periodic"
        };

        var updateResponse = await client.PutAsJsonAsync($"/api/doctor-data/medical-visits/{created!.Id}", updatePayload);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/doctor-data/medical-visits/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    private int EnsureCompany()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var existing = db.Companies.Select(x => x.Id).FirstOrDefault();
        if (existing > 0) return existing;

        var vatSuffix = DateTime.UtcNow.Ticks.ToString()[^11..];
        var company = new Company
        {
            Name = "Company Doctor Seed",
            VATNumber = $"IT{vatSuffix}",
            ContactEmail = "doctor-seed@company.it",
            TenantId = 1
        };

        db.Companies.Add(company);
        db.SaveChanges();
        return company.Id;
    }

    private int EnsureBranch(int companyId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var existing = db.Branches.Where(x => x.CompanyId == companyId).Select(x => x.Id).FirstOrDefault();
        if (existing > 0) return existing;

        var branch = new Branch
        {
            CompanyId = companyId,
            Address = "Via Doctor Seed 12",
            City = "Milano",
            Province = "MI",
            PostalCode = "20100",
            TenantId = 1
        };

        db.Branches.Add(branch);
        db.SaveChanges();
        return branch.Id;
    }

    private int EnsureEmployee()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var existing = db.Employees.Select(x => x.Id).FirstOrDefault();
        if (existing > 0) return existing;

        var companyId = EnsureCompany();
        var branchId = EnsureBranch(companyId);

        var employee = new Employee
        {
            CompanyId = companyId,
            BranchId = branchId,
            FirstName = "Anna",
            LastName = "Rosa",
            TaxCode = "RSANNA80A01F205X",
            JobRole = "Impiegata",
            BirthDate = new DateTime(1980, 1, 1),
            Gender = "F",
            BirthCity = "Milano",
            BirthCityCode = "F205",
            PersonalEmail = "anna.rosa@test.it",
            TenantId = 1
        };

        db.Employees.Add(employee);
        db.SaveChanges();
        return employee.Id;
    }

    private int CreateUniqueEmployee()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var companyId = EnsureCompany();
        var branchId = EnsureBranch(companyId);
        var suffix = Guid.NewGuid().ToString("N")[..11].ToUpperInvariant();

        var employee = new Employee
        {
            CompanyId = companyId,
            BranchId = branchId,
            FirstName = "Test",
            LastName = "Record",
            TaxCode = $"TSTRCR80A01{suffix}"[..16],
            JobRole = "Impiegata",
            BirthDate = new DateTime(1980, 1, 1),
            Gender = "F",
            BirthCity = "Milano",
            BirthCityCode = "F205",
            PersonalEmail = $"record.{suffix.ToLowerInvariant()}@test.it",
            TenantId = 1
        };

        db.Employees.Add(employee);
        db.SaveChanges();
        return employee.Id;
    }

    private int EnsureDoctor()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var existing = db.Doctors.Select(x => x.Id).FirstOrDefault();
        if (existing > 0) return existing;

        var doctor = new Doctor
        {
            FirstName = "Luca",
            LastName = "Verdi",
            MedicalLicenseNumber = $"DOC-{Guid.NewGuid():N}"[..18],
            Specialty = "Medicina del Lavoro",
            Email = "luca.verdi@test.it",
            TenantId = 1
        };

        db.Doctors.Add(doctor);
        db.SaveChanges();
        return doctor.Id;
    }

    private int EnsureExamType()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var existing = db.ExamTypes.Select(x => x.Id).FirstOrDefault();
        if (existing > 0) return existing;

        var examType = new ExamType
        {
            Name = "Spirometria",
            Category = "Funzionale",
            TenantId = 1
        };

        db.ExamTypes.Add(examType);
        db.SaveChanges();
        return examType.Id;
    }

    private int EnsureMedicalVisit()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var existing = db.MedicalVisits.Select(x => x.Id).FirstOrDefault();
        if (existing > 0) return existing;

        var employeeId = EnsureEmployee();
        var doctorId = EnsureDoctor();

            var visit = new MedicalVisit
            {
                EmployeeId = employeeId,
                DoctorId = doctorId,
                VisitDate = new DateTime(2026, 5, 1),
                NextDeadlineDate = new DateTime(2026, 11, 1),
                Outcome = "Idoneo",
                VisitType = MedicalVisitType.Periodic,
                TenantId = 1
            };

        db.MedicalVisits.Add(visit);
        db.SaveChanges();
        return visit.Id;
    }

    private sealed class IdResponse
    {
        public int Id { get; set; }
    }
}
