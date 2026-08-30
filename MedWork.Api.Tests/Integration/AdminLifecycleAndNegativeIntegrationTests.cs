using System.Net;
using System.Net.Http.Json;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.Extensions.DependencyInjection;

namespace MedWork.Api.Tests.Integration;

public class AdminLifecycleAndNegativeIntegrationTests : IClassFixture<MedWorkWebAppFactory>
{
    private readonly MedWorkWebAppFactory _factory;

    public AdminLifecycleAndNegativeIntegrationTests(MedWorkWebAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Company_Lifecycle_Create_Update_Delete_Works()
    {
        var client = _factory.CreateClient();
        var vat1 = $"IT{DateTime.UtcNow.Ticks.ToString()[^11..]}";
        var vat2 = $"IT{DateTime.UtcNow.AddSeconds(1).Ticks.ToString()[^11..]}";

        var createPayload = new
        {
            name = "Lifecycle Company",
            vatNumber = vat1,
            contactEmail = "lifecycle@company.it",
            contactPhone = "+39 02 2222222"
        };

        var createResponse = await client.PostAsJsonAsync("/api/admin-data/companies", createPayload);
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<IdResponse>();
        Assert.NotNull(created);

        var updatePayload = new
        {
            name = "Lifecycle Company Updated",
            vatNumber = vat2,
            contactEmail = "updated@company.it",
            contactPhone = "+39 02 3333333"
        };

        var updateResponse = await client.PutAsJsonAsync($"/api/admin-data/companies/{created!.Id}", updatePayload);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/admin-data/companies/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Post_Employee_With_Missing_RequiredFields_Returns_BadRequest()
    {
        var companyId = EnsureCompany();
        var client = _factory.CreateClient();

        var payload = new
        {
            companyId,
            firstName = "Mario",
            lastName = "Rossi"
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/employees", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task EmployeeRisk_Duplicate_Returns_Conflict()
    {
        var employeeId = EnsureEmployee();
        var riskFactorId = EnsureRiskFactor();
        var client = _factory.CreateClient();

        var payload = new { employeeId, riskFactorId };

        var first = await client.PostAsJsonAsync("/api/admin-data/employee-risks", payload);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/admin-data/employee-risks", payload);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task EmployeeRisk_Lifecycle_Update_Delete_Works()
    {
        var employeeId = EnsureEmployee();
        var sourceRiskFactorId = EnsureRiskFactor("Rischio Sorgente");
        var targetRiskFactorId = EnsureRiskFactor("Rischio Destinazione");
        var client = _factory.CreateClient();

        var createPayload = new { employeeId, riskFactorId = sourceRiskFactorId };
        var createResponse = await client.PostAsJsonAsync("/api/admin-data/employee-risks", createPayload);
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

        var updatePayload = new { employeeId, riskFactorId = targetRiskFactorId };
        var updateResponse = await client.PutAsJsonAsync(
            $"/api/admin-data/employee-risks?employeeId={employeeId}&riskFactorId={sourceRiskFactorId}",
            updatePayload);

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync(
            $"/api/admin-data/employee-risks?employeeId={employeeId}&riskFactorId={targetRiskFactorId}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    private int EnsureCompany()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var existing = db.Companies.Select(x => x.Id).FirstOrDefault();
        if (existing > 0) return existing;

        var vat = $"IT{DateTime.UtcNow.Ticks.ToString()[^11..]}";
        var company = new Company
        {
            Name = "Seed Admin Company",
            VATNumber = vat,
            ContactEmail = "seed-admin@company.it",
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
            Address = "Via Admin Seed 10",
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
            FirstName = "Paolo",
            LastName = "Gialli",
            TaxCode = "GLLPLA80A01F205X",
            JobRole = "Operatore",
            BirthDate = new DateTime(1980, 1, 1),
            Gender = "M",
            BirthCity = "Milano",
            BirthCityCode = "F205",
            PersonalEmail = "paolo.gialli@test.it",
            TenantId = 1
        };

        db.Employees.Add(employee);
        db.SaveChanges();
        return employee.Id;
    }

    private int EnsureRiskFactor(string name = "Rischio Seed")
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var existing = db.RiskFactors.FirstOrDefault(x => x.Name == name);
        if (existing is not null) return existing.Id;

        var risk = new RiskFactor
        {
            Name = name,
            Description = "Descrizione valida del fattore di rischio per test integrazione.",
            SeverityLevel = 3,
            TenantId = 1
        };

        db.RiskFactors.Add(risk);
        db.SaveChanges();
        return risk.Id;
    }

    private sealed class IdResponse
    {
        public int Id { get; set; }
    }
}
