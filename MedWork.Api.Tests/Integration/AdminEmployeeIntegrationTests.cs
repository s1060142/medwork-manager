using System.Net;
using System.Net.Http.Json;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.Extensions.DependencyInjection;

namespace MedWork.Api.Tests.Integration;

public class AdminEmployeeIntegrationTests : IClassFixture<MedWorkWebAppFactory>
{
    private readonly MedWorkWebAppFactory _factory;

    public AdminEmployeeIntegrationTests(MedWorkWebAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Post_Employee_With_Only_ForeignKeyIds_Returns_Ok()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        db.Database.EnsureCreated();

        if (!db.Companies.Any())
        {
            var company = new Company
            {
                Name = "Test Company S.p.A.",
                VATNumber = "IT12345678901",
                ContactEmail = "hr@test-company.it"
            };

            db.Companies.Add(company);
            db.SaveChanges();

            db.Branches.Add(new Branch
            {
                CompanyId = company.Id,
                Address = "Via Test 1",
                City = "Milano",
                Province = "MI",
                PostalCode = "20100"
            });
            db.SaveChanges();
        }

        var companyId = db.Companies.Select(x => x.Id).First();
        var branchId = db.Branches.Select(x => x.Id).First();

        var client = _factory.CreateClient();
        var payload = new
        {
            companyId,
            branchId,
            firstName = "Giulia",
            lastName = "Verdi",
            taxCode = "VRDGLI90A01F205X",
            jobRole = "Impiegata",
            birthDate = new DateTime(1990, 1, 1),
            gender = "F",
            birthCity = "Milano",
            birthCityCode = "F205",
            personalEmail = "giulia.verdi@test.it",
            phoneNumber = "+39 333 0000000"
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/employees", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var responseBody = await response.Content.ReadFromJsonAsync<EmployeeResponse>();
        Assert.NotNull(responseBody);
        Assert.Equal(companyId, responseBody!.CompanyId);
        Assert.Equal(branchId, responseBody.BranchId);
        Assert.Equal("Giulia", responseBody.FirstName);
        Assert.Equal("Verdi", responseBody.LastName);
    }

    private sealed class EmployeeResponse
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public int BranchId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }
}
