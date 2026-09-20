using System.Net;
using System.Net.Http.Json;
using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace MedWork.Api.Tests.Integration;

public class EmployerRsppIdorTests : IClassFixture<MedWorkWebAppFactory>
{
    private readonly MedWorkWebAppFactory _factory;

    public EmployerRsppIdorTests(MedWorkWebAppFactory factory)
    {
        _factory = factory;
    }

    private async Task<(int company1Id, int company2Id, int emp1Id, int emp2Id, int visit1Id, int visit2Id)> SeedTestDataAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Ensure clean test entities in Tenant 1
        var comp1 = new Company { Name = "SecTest Company 1", VATNumber = "IT11111111111", TenantId = 1, IsActive = true };
        var comp2 = new Company { Name = "SecTest Company 2", VATNumber = "IT22222222222", TenantId = 1, IsActive = true };
        db.Companies.AddRange(comp1, comp2);
        await db.SaveChangesAsync();

        var emp1 = new Employee
        {
            CompanyId = comp1.Id,
            TenantId = 1,
            FirstName = "Mario",
            LastName = "Rossi",
            TaxCode = "RSSMRA80A01H501U",
            JobRole = "Operaio",
            Gender = "M",
            BirthDate = new DateTime(1980, 1, 1),
            BirthCity = "Roma",
            BirthCityCode = "H501"
        };
        var emp2 = new Employee
        {
            CompanyId = comp2.Id,
            TenantId = 1,
            FirstName = "Luigi",
            LastName = "Verdi",
            TaxCode = "VRDLGU85B02H501Z",
            JobRole = "Tecnico",
            Gender = "M",
            BirthDate = new DateTime(1985, 2, 2),
            BirthCity = "Milano",
            BirthCityCode = "F205"
        };
        db.Employees.AddRange(emp1, emp2);
        await db.SaveChangesAsync();

        var visit1 = new MedicalVisit
        {
            EmployeeId = emp1.Id,
            TenantId = 1,
            VisitDate = DateTime.UtcNow.Date.AddDays(-5),
            Outcome = "Idoneo",
            OutcomeCode = "FIT"
        };
        var visit2 = new MedicalVisit
        {
            EmployeeId = emp2.Id,
            TenantId = 1,
            VisitDate = DateTime.UtcNow.Date.AddDays(-5),
            Outcome = "Idoneo",
            OutcomeCode = "FIT"
        };
        db.MedicalVisits.AddRange(visit1, visit2);
        await db.SaveChangesAsync();

        return (comp1.Id, comp2.Id, emp1.Id, emp2.Id, visit1.Id, visit2.Id);
    }

    [Fact]
    public async Task Company1_RSPP_Accessing_Company2_VisitPdf_Returns_403_Forbidden()
    {
        var data = await SeedTestDataAsync();
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", AppRole.RSPP);
        client.DefaultRequestHeaders.Add("X-Test-Company-Id", data.company1Id.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Tenant-Id", "1");

        // RSPP of Company 1 tries to access visit PDF of Company 2 employee
        var response = await client.GetAsync($"/api/documents/visits/{data.visit2Id}/fitness-judgment-pdf");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Company1_RSPP_Generating_Company2_SanitaryPlan_Returns_403_Forbidden()
    {
        var data = await SeedTestDataAsync();
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", AppRole.RSPP);
        client.DefaultRequestHeaders.Add("X-Test-Company-Id", data.company1Id.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Tenant-Id", "1");

        // RSPP of Company 1 tries to generate sanitary plan for employee of Company 2
        var response = await client.PostAsync($"/api/documents/sanitary-plan/{data.emp2Id}", null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Company1_RSPP_Generating_Company2_FitnessJudgment_Returns_403_Forbidden()
    {
        var data = await SeedTestDataAsync();
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", AppRole.RSPP);
        client.DefaultRequestHeaders.Add("X-Test-Company-Id", data.company1Id.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Tenant-Id", "1");

        // RSPP of Company 1 tries to generate fitness judgment for visit of Company 2
        var response = await client.PostAsync($"/api/documents/fitness-judgment/{data.visit2Id}", null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Company2_Employer_Accessing_Company1_Resources_Returns_403_Forbidden()
    {
        var data = await SeedTestDataAsync();
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", AppRole.Employer);
        client.DefaultRequestHeaders.Add("X-Test-Company-Id", data.company2Id.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Tenant-Id", "1");

        // Employer of Company 2 tries to access visit 1 PDF
        var visitResp = await client.GetAsync($"/api/documents/visits/{data.visit1Id}/fitness-judgment-pdf");
        Assert.Equal(HttpStatusCode.Forbidden, visitResp.StatusCode);

        // Employer of Company 2 tries to access sanitary plan for employee 1
        var planResp = await client.PostAsync($"/api/documents/sanitary-plan/{data.emp1Id}", null);
        Assert.Equal(HttpStatusCode.Forbidden, planResp.StatusCode);

        // Employer of Company 2 tries to download ZIP export for Company 1
        var zipResp = await client.GetAsync($"/api/documents/companies/{data.company1Id}/judgments-zip");
        Assert.Equal(HttpStatusCode.Forbidden, zipResp.StatusCode);

        // Employer of Company 2 tries to access Annual Report for Company 1
        var reportResp = await client.GetAsync($"/api/documents/companies/{data.company1Id}/annual-report-pdf");
        Assert.Equal(HttpStatusCode.Forbidden, reportResp.StatusCode);
    }

    [Fact]
    public async Task CrossTenant_RSPP_Accessing_Tenant1_Resources_Returns_404_NotFound()
    {
        var data = await SeedTestDataAsync();
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", AppRole.RSPP);
        client.DefaultRequestHeaders.Add("X-Test-Company-Id", "999");
        client.DefaultRequestHeaders.Add("X-Test-Tenant-Id", "2"); // Tenant 2

        // Tenant 2 RSPP tries to access Tenant 1 visit PDF
        var visitResp = await client.GetAsync($"/api/documents/visits/{data.visit1Id}/fitness-judgment-pdf");
        Assert.Equal(HttpStatusCode.NotFound, visitResp.StatusCode);

        // Tenant 2 RSPP tries to access Tenant 1 sanitary plan
        var planResp = await client.PostAsync($"/api/documents/sanitary-plan/{data.emp1Id}", null);
        Assert.Equal(HttpStatusCode.NotFound, planResp.StatusCode);
    }

    [Fact]
    public async Task Company1_RSPP_Accessing_Own_Company1_Resources_Returns_Success()
    {
        var data = await SeedTestDataAsync();
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", AppRole.RSPP);
        client.DefaultRequestHeaders.Add("X-Test-Company-Id", data.company1Id.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Tenant-Id", "1");

        // Legitimate access to own company 1 visit PDF
        var visitResp = await client.GetAsync($"/api/documents/visits/{data.visit1Id}/fitness-judgment-pdf");
        Assert.Equal(HttpStatusCode.OK, visitResp.StatusCode);

        // Legitimate access to own company 1 sanitary plan
        var planResp = await client.PostAsync($"/api/documents/sanitary-plan/{data.emp1Id}", null);
        Assert.Equal(HttpStatusCode.OK, planResp.StatusCode);
    }
}
