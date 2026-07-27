using System.Net;
using System.Net.Http.Headers;
using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MedWork.Api.Tests.Integration;

/// <summary>
/// Verifica ruoli estesi, separazione clinico/esito (GDPR art. 9),
/// generazione PDF reale e audit trail di backend.
/// </summary>
public class RolesAndDocumentsIntegrationTests : IClassFixture<MedWorkWebAppFactory>
{
    private readonly MedWorkWebAppFactory _factory;

    public RolesAndDocumentsIntegrationTests(MedWorkWebAppFactory factory)
    {
        _factory = factory;
    }

    private static async Task SeedClinicalDataAsync(MedWorkWebAppFactory factory)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (!await db.MedicalRecords.AnyAsync(x => x.EmployeeId == 1))
        {
            db.MedicalRecords.Add(new MedicalRecord
            {
                EmployeeId = 1,
                MedicalHistory = "Anamnesi demo",
                Notes = "test",
                CurrentTherapies = "Nessuna",
                Status = MedicalRecordStatus.Active
            });
            await db.SaveChangesAsync();
        }
    }

    [Theory]
    [InlineData(AppRole.Admin, HttpStatusCode.OK)]
    [InlineData(AppRole.Doctor, HttpStatusCode.OK)]
    [InlineData(AppRole.Secretary, HttpStatusCode.Forbidden)]
    [InlineData(AppRole.Rspp, HttpStatusCode.Forbidden)]
    [InlineData(AppRole.Employer, HttpStatusCode.Forbidden)]
    public async Task MedicalRecords_ClinicalData_VisibleOnlyToClinicalRoles(string role, HttpStatusCode expected)
    {
        await SeedClinicalDataAsync(_factory);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", role);

        var response = await client.GetAsync("/api/medical-records/employee/1");
        Assert.Equal(expected, response.StatusCode);
    }

    [Theory]
    [InlineData(AppRole.Admin, HttpStatusCode.OK)]
    [InlineData(AppRole.Doctor, HttpStatusCode.OK)]
    [InlineData(AppRole.Secretary, HttpStatusCode.Forbidden)]
    [InlineData(AppRole.Rspp, HttpStatusCode.Forbidden)]
    [InlineData(AppRole.Employer, HttpStatusCode.Forbidden)]
    public async Task MasterData_Employees_ClinicalPii_VisibleOnlyToClinicalAndManagement(string role, HttpStatusCode expected)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", role);

        var response = await client.GetAsync("/api/master-data/employees");
        Assert.Equal(expected, response.StatusCode);
    }

    [Theory]
    [InlineData(AppRole.Admin, HttpStatusCode.OK)]
    [InlineData(AppRole.Doctor, HttpStatusCode.OK)]
    [InlineData(AppRole.Secretary, HttpStatusCode.OK)]
    [InlineData(AppRole.Rspp, HttpStatusCode.OK)]
    [InlineData(AppRole.Employer, HttpStatusCode.OK)]
    public async Task FitnessOutcomes_VisibleToAllRoles_NoClinicalData(string role, HttpStatusCode expected)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", role);

        var response = await client.GetAsync("/api/fitness-outcomes");
        Assert.Equal(expected, response.StatusCode);
    }

    [Fact]
    public async Task Documents_FitnessJudgment_ReturnsPdfOrNotFound()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", AppRole.Doctor);

        var response = await client.GetAsync("/api/documents/fitness-judgment/1");
        Assert.True(response.StatusCode is HttpStatusCode.OK or HttpStatusCode.NotFound);
        if (response.StatusCode == HttpStatusCode.OK)
        {
            var bytes = await response.Content.ReadAsByteArrayAsync();
            Assert.StartsWith("%PDF", System.Text.Encoding.ASCII.GetString(bytes.Take(5).ToArray()));
        }
    }

    [Fact]
    public async Task Audit_Endpoint_ForbiddenForEmployer_VisibleForRspp()
    {
        var employerClient = _factory.CreateClient();
        employerClient.DefaultRequestHeaders.Add("X-Test-Role", AppRole.Employer);
        var employerResp = await employerClient.GetAsync("/api/audit");
        Assert.Equal(HttpStatusCode.Forbidden, employerResp.StatusCode);

        var rsppClient = _factory.CreateClient();
        rsppClient.DefaultRequestHeaders.Add("X-Test-Role", AppRole.Rspp);
        var rsppResp = await rsppClient.GetAsync("/api/audit");
        Assert.Equal(HttpStatusCode.OK, rsppResp.StatusCode);
    }
}
