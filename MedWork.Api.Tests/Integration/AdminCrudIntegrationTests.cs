using System.Net;
using System.Net.Http.Json;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MedWork.Api.Tests.Integration;

public class AdminCrudIntegrationTests : IClassFixture<MedWorkWebAppFactory>
{
    private readonly MedWorkWebAppFactory _factory;

    public AdminCrudIntegrationTests(MedWorkWebAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Post_Company_Returns_Ok()
    {
        var client = _factory.CreateClient();
        var vatSuffix = DateTime.UtcNow.Ticks.ToString()[^11..];

        var payload = new
        {
            name = $"Company Test {Guid.NewGuid():N}"[..30],
            vatNumber = $"IT{vatSuffix}",
            contactEmail = "info@company-test.it",
            contactPhone = "+39 02 1111111"
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/companies", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Post_Branch_Returns_Ok()
    {
        var companyId = EnsureCompany();
        var client = _factory.CreateClient();

        var payload = new
        {
            companyId,
            address = "Via Branch Test 20",
            city = "Torino",
            province = "TO",
            postalCode = "10100"
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/branches", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Post_Doctor_Returns_NotFound_After_Removal()
    {
        var client = _factory.CreateClient();

        var payload = new
        {
            firstName = "Laura",
            lastName = "Neri",
            medicalLicenseNumber = $"MED-TEST-{Guid.NewGuid():N}"[..20],
            specialty = "Medicina del Lavoro",
            email = "doctor.test@medwork.it"
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/doctors", payload);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_RiskFactor_Returns_Ok()
    {
        var client = _factory.CreateClient();

        var payload = new
        {
            name = $"Rischio-{Guid.NewGuid():N}"[..15],
            description = "Descrizione rischio valida con almeno dieci caratteri.",
            severityLevel = 3
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/risk-factors", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Post_ExamType_Returns_Ok()
    {
        var client = _factory.CreateClient();

        var payload = new
        {
            name = $"Esame-{Guid.NewGuid():N}"[..20],
            category = "Laboratorio"
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/exam-types", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Post_EmployeeRisk_Returns_Ok()
    {
        var employeeId = EnsureEmployee();
        var riskFactorId = EnsureRiskFactor();
        var client = _factory.CreateClient();

        var payload = new
        {
            employeeId,
            riskFactorId
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/employee-risks", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
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
            Name = "Company Seed",
            VATNumber = $"IT{vatSuffix}",
            ContactEmail = "seed@company.it",
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
            Address = "Via Seed 1",
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

        var taxRandom = Guid.NewGuid().ToString("N")[..11].ToUpperInvariant();
        var employee = new Employee
        {
            CompanyId = EnsureCompany(),
            BranchId = EnsureBranch(EnsureCompany()),
            FirstName = "Marco",
            LastName = "Blu",
            TaxCode = $"BLUMRC80A01{taxRandom}"[..16],
            JobRole = "Tecnico",
            BirthDate = new DateTime(1980, 1, 1),
            Gender = "M",
            BirthCity = "Milano",
            BirthCityCode = "F205",
            PersonalEmail = $"employee.seed{taxRandom}@test.it",
            TenantId = 1
        };

        db.Employees.Add(employee);
        db.SaveChanges();
        return employee.Id;
    }

    private int EnsureRiskFactor()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var risk = new RiskFactor
        {
            Name = $"Rischio-{suffix}",
            Description = "Descrizione rischio seed sufficientemente lunga.",
            SeverityLevel = 2,
            TenantId = 1
        };

        db.RiskFactors.Add(risk);
        db.SaveChanges();
        return risk.Id;
    }
}
