using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace MedWork.Api.Tests.Integration;

public class CompanyGroupsIntegrationTests : IClassFixture<MedWorkWebAppFactory>
{
    private readonly HttpClient _client;

    public CompanyGroupsIntegrationTests(MedWorkWebAppFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAll_ReturnsSuccessAndGroups()
    {
        var response = await _client.GetAsync("/api/company-groups");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var groups = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Array, groups.ValueKind);
    }

    [Fact]
    public async Task DoctorData_CompanyGroups_ReturnsSummaryAndList()
    {
        var response = await _client.GetAsync("/api/doctor-data/company-groups");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("summary", out var summary));
        Assert.True(summary.TryGetProperty("totalGroups", out _));
        Assert.True(body.TryGetProperty("groups", out var groups));
        Assert.Equal(JsonValueKind.Array, groups.ValueKind);
    }

    [Fact]
    public async Task GetDashboard_ForGroup1_Returns10Kpis()
    {
        // Check if group 1 exists, otherwise create one
        var listResponse = await _client.GetAsync("/api/company-groups");
        var groups = await listResponse.Content.ReadFromJsonAsync<JsonElement>();

        int targetGroupId = 1;
        if (groups.GetArrayLength() > 0)
        {
            targetGroupId = groups[0].GetProperty("id").GetInt32();
        }
        else
        {
            var createRes = await _client.PostAsJsonAsync("/api/company-groups", new
            {
                Name = "Gruppo Test Integration",
                LegalName = "Gruppo Test S.p.A.",
                Type = 1,
                Status = 1
            });
            var created = await createRes.Content.ReadFromJsonAsync<JsonElement>();
            targetGroupId = created.GetProperty("id").GetInt32();
        }

        var response = await _client.GetAsync($"/api/company-groups/{targetGroupId}/dashboard");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("companiesCount", out _));
        Assert.True(body.TryGetProperty("branchesCount", out _));
        Assert.True(body.TryGetProperty("employeesCount", out _));
        Assert.True(body.TryGetProperty("activeProtocolsCount", out _));
        Assert.True(body.TryGetProperty("visitsDue", out _));
        Assert.True(body.TryGetProperty("visitsOverdue", out _));
        Assert.True(body.TryGetProperty("siteVisitsDue", out _));
        Assert.True(body.TryGetProperty("nominationsDue", out _));
        Assert.True(body.TryGetProperty("vaccinationDeadlines", out _));
        Assert.True(body.TryGetProperty("complianceAlerts", out _));
        Assert.True(body.TryGetProperty("complianceScore", out _));
        Assert.True(body.TryGetProperty("companyBreakdown", out var breakdown));
        Assert.Equal(JsonValueKind.Array, breakdown.ValueKind);
    }

    [Fact]
    public async Task GetDeadlines_ReturnsAggregatedDeadlines()
    {
        var listResponse = await _client.GetAsync("/api/company-groups");
        var groups = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        var targetGroupId = groups.GetArrayLength() > 0 ? groups[0].GetProperty("id").GetInt32() : 1;

        var response = await _client.GetAsync($"/api/company-groups/{targetGroupId}/deadlines?type=all");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Array, body.ValueKind);
    }

    [Fact]
    public async Task GetEmployees_ReturnsUnifiedWorkforce()
    {
        var listResponse = await _client.GetAsync("/api/company-groups");
        var groups = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        var targetGroupId = groups.GetArrayLength() > 0 ? groups[0].GetProperty("id").GetInt32() : 1;

        var response = await _client.GetAsync($"/api/company-groups/{targetGroupId}/employees");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Array, body.ValueKind);
    }

    [Fact]
    public async Task GetCompliance_ReturnsComplianceScoreAndRemediations()
    {
        var listResponse = await _client.GetAsync("/api/company-groups");
        var groups = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        var targetGroupId = groups.GetArrayLength() > 0 ? groups[0].GetProperty("id").GetInt32() : 1;

        var response = await _client.GetAsync($"/api/company-groups/{targetGroupId}/compliance");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("complianceScore", out _));
        Assert.True(body.TryGetProperty("missingRecords", out _));
        Assert.True(body.TryGetProperty("expiredVisits", out _));
        Assert.True(body.TryGetProperty("missingNominations", out _));
        Assert.True(body.TryGetProperty("remediations", out var remediations));
        Assert.Equal(JsonValueKind.Array, remediations.ValueKind);
    }

    [Fact]
    public async Task GetAggregatedReport_ReturnsJudgmentsAndDistributions()
    {
        var listResponse = await _client.GetAsync("/api/company-groups");
        var groups = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        var targetGroupId = groups.GetArrayLength() > 0 ? groups[0].GetProperty("id").GetInt32() : 1;

        var response = await _client.GetAsync($"/api/company-groups/{targetGroupId}/reports/aggregated");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("totalWorkers", out _));
        Assert.True(body.TryGetProperty("workersByCompany", out _));
        Assert.True(body.TryGetProperty("judgmentsDistribution", out var judgments));
        Assert.True(judgments.TryGetProperty("fit", out _));
        Assert.True(body.TryGetProperty("prescriptionsAndLimitations", out _));
    }

    [Fact]
    public async Task GetPhysicianPerspective_ReturnsDoctorWorkloads()
    {
        var listResponse = await _client.GetAsync("/api/company-groups");
        var groups = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        var targetGroupId = groups.GetArrayLength() > 0 ? groups[0].GetProperty("id").GetInt32() : 1;

        var response = await _client.GetAsync($"/api/company-groups/{targetGroupId}/physician-perspective");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("workloads", out var workloads));
        Assert.Equal(JsonValueKind.Array, workloads.ValueKind);
    }

    [Fact]
    public async Task BulkPlanVisits_ValidRequest_ReturnsSuccess()
    {
        var listResponse = await _client.GetAsync("/api/company-groups");
        var groups = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        var targetGroupId = groups.GetArrayLength() > 0 ? groups[0].GetProperty("id").GetInt32() : 1;

        var request = new
        {
            EmployeeIds = new[] { 1 },
            ScheduledDate = DateTime.UtcNow.AddDays(14),
            VisitType = "Periodic",
            Notes = "Test bulk visit planning"
        };

        var response = await _client.PostAsJsonAsync($"/api/company-groups/{targetGroupId}/bulk-plan-visits", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("success").GetBoolean());
        Assert.Equal(1, body.GetProperty("count").GetInt32());
    }
}
