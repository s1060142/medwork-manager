using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace MedWork.Api.Tests.Integration;

public class MedicalStaffIntegrationTests : IClassFixture<MedWorkWebAppFactory>
{
    private readonly MedWorkWebAppFactory _factory;

    public MedicalStaffIntegrationTests(MedWorkWebAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetMedicalStaff_ReturnsOkAndStaffList()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/medical-staff");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    [Fact]
    public async Task GetDashboard_ReturnsKPIStats()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/medical-staff/dashboard");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        Assert.True(doc.RootElement.TryGetProperty("totalActive", out var totalActive));
        Assert.True(doc.RootElement.TryGetProperty("activeDoctors", out _));
        Assert.True(doc.RootElement.TryGetProperty("activeNurses", out _));
        Assert.True(doc.RootElement.TryGetProperty("companyCoveragePercent", out _));
    }

    [Fact]
    public async Task CreateStaff_SavesNewProfessional()
    {
        var client = _factory.CreateClient();
        var license = $"MED-TEST-{Guid.NewGuid():N}".Substring(0, 15);

        var payload = new
        {
            FirstName = "Test",
            LastName = "Medico",
            ProfessionalRole = "MedicoCompetente",
            TaxCode = "TSTMDC80A01H501Z",
            MedicalLicenseNumber = license,
            Specialty = "Medicina del Lavoro",
            LicenseProvince = "Milano",
            Email = $"test.medico.{Guid.NewGuid():N}@medwork.it",
            CreateUserAccount = false
        };

        var response = await client.PostAsJsonAsync("/api/medical-staff", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        Assert.Equal("Test", doc.RootElement.GetProperty("firstName").GetString());
        Assert.Equal("Medico", doc.RootElement.GetProperty("lastName").GetString());
    }

    [Fact]
    public async Task AddAbsence_And_DeleteAbsence_Works()
    {
        var client = _factory.CreateClient();
        var listRes = await client.GetAsync("/api/medical-staff");
        var listContent = await listRes.Content.ReadAsStringAsync();
        using var listDoc = JsonDocument.Parse(listContent);
        var staffId = listDoc.RootElement[0].GetProperty("id").GetInt32();

        var absencePayload = new
        {
            StartDate = DateTime.UtcNow.Date.ToString("yyyy-MM-dd"),
            EndDate = DateTime.UtcNow.Date.AddDays(5).ToString("yyyy-MM-dd"),
            Reason = "Ferie",
            Notes = "Ferie estive"
        };

        var postRes = await client.PostAsJsonAsync($"/api/medical-staff/{staffId}/absences", absencePayload);
        Assert.Equal(HttpStatusCode.OK, postRes.StatusCode);

        var postContent = await postRes.Content.ReadAsStringAsync();
        using var postDoc = JsonDocument.Parse(postContent);
        var absenceId = postDoc.RootElement.GetProperty("id").GetInt32();

        var deleteRes = await client.DeleteAsync($"/api/medical-staff/absences/{absenceId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);
    }
}
