using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace MedWork.Api.Tests.Integration;

public class AuditControllerTests : IClassFixture<MedWorkWebAppFactory>
{
    private readonly MedWorkWebAppFactory _factory;
    private readonly HttpClient _client;

    public AuditControllerTests(MedWorkWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PostAuditEvent_Then_Get_ReturnsTenantScopedEvents()
    {
        var payload = new
        {
            module = "Tests",
            action = "IntegrationTest",
            detail = "AuditController verification"
        };

        var post = await _client.PostAsJsonAsync("/api/audit/events", payload);
        Assert.Equal(HttpStatusCode.OK, post.StatusCode);
        var posted = await post.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(posted.GetProperty("tenantId").GetInt32() == 1);
        Assert.Equal("Tests", posted.GetProperty("module").GetString());

        var get = await _client.GetAsync("/api/audit/events");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        var events = await get.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(events.GetArrayLength() >= 1);

        var first = events[0];
        Assert.Equal("Tests", first.GetProperty("module").GetString());
        Assert.Equal("IntegrationTest", first.GetProperty("action").GetString());
    }
}
