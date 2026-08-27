using System.Net;
using System.Net.Http.Json;
using MedWork.Api.Models;
using Microsoft.Extensions.DependencyInjection;

namespace MedWork.Api.Tests.Integration;

public partial class AuthorizationIntegrationTests : IClassFixture<MedWorkWebAppFactory>, IClassFixture<MedWorkWebAppAnonymousFactory>, IClassFixture<MedWorkWebAppMissingTenantFactory>
{
    private readonly MedWorkWebAppFactory _authFactory;
    private readonly MedWorkWebAppAnonymousFactory _anonymousFactory;
    private readonly MedWorkWebAppMissingTenantFactory _missingTenantFactory;

    public AuthorizationIntegrationTests(MedWorkWebAppFactory authFactory, MedWorkWebAppAnonymousFactory anonymousFactory, MedWorkWebAppMissingTenantFactory missingTenantFactory)
    {
        _authFactory = authFactory;
        _anonymousFactory = anonymousFactory;
        _missingTenantFactory = missingTenantFactory;
    }

    [Fact]
    public async Task TenantContextFilter_WithoutToken_Returns401()
    {
        var client = _anonymousFactory.CreateClient();

        var payload = new
        {
            TenantId = 1,
            Name = "Test Company",
            VatNumber = "IT12345678901"
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/companies", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task TenantContextFilter_MissingTenantIdClaim_Returns401()
    {
        var client = _missingTenantFactory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");

        // Remove TenantId claim from the test auth handler
        var payload = new
        {
            TenantId = 1,
            Name = "Test Company",
            VatNumber = "IT12345678901"
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/companies", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task TenantContextFilter_CrossTenantAccess_Blocked()
    {
        var client = _authFactory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");

        // Try to access Tenant 2 data while authenticated as Tenant 1
        var payload = new
        {
            TenantId = 2,
            Name = "Test Company",
            VatNumber = "IT12345678901"
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/companies", payload);

        // The TenantId should be overwritten to 1 (from the claim)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verify the TenantId was overwritten
        var createdCompany = await response.Content.ReadFromJsonAsync<Company>();
        Assert.Equal(1, createdCompany.TenantId);
    }
}
