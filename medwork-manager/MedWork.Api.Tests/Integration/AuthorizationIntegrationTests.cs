using System.Net;
using System.Net.Http.Json;

namespace MedWork.Api.Tests.Integration;

public class AuthorizationIntegrationTests : IClassFixture<MedWorkWebAppFactory>, IClassFixture<MedWorkWebAppAnonymousFactory>
{
    private readonly MedWorkWebAppFactory _authFactory;
    private readonly MedWorkWebAppAnonymousFactory _anonymousFactory;

    public AuthorizationIntegrationTests(MedWorkWebAppFactory authFactory, MedWorkWebAppAnonymousFactory anonymousFactory)
    {
        _authFactory = authFactory;
        _anonymousFactory = anonymousFactory;
    }

    [Fact]
    public async Task Admin_Endpoint_Without_Auth_Returns_Unauthorized()
    {
        var client = _anonymousFactory.CreateClient();

        var payload = new
        {
            name = "No Auth Company",
            vatNumber = "IT12345678901"
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/companies", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Admin_Endpoint_With_Doctor_Role_Returns_Forbidden()
    {
        var client = _authFactory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Doctor");

        var payload = new
        {
            name = "Forbidden Company",
            vatNumber = "IT12345678901"
        };

        var response = await client.PostAsJsonAsync("/api/admin-data/companies", payload);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Doctor_Can_Access_Doctor_And_Master_Areas()
    {
        var client = _authFactory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Doctor");

        var expiringResponse = await client.GetAsync("/api/medical-visits/expiring?days=30");
        var masterResponse = await client.GetAsync("/api/master-data/employees");

        Assert.Equal(HttpStatusCode.OK, expiringResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, masterResponse.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Access_Doctor_And_Admin_Areas()
    {
        var client = _authFactory.CreateClient();

        var expiringResponse = await client.GetAsync("/api/medical-visits/expiring?days=30");

        var createPayload = new
        {
            name = "Admin Access Company",
            vatNumber = "IT12345678901",
            contactEmail = "admin@test.it"
        };
        var adminCreateResponse = await client.PostAsJsonAsync("/api/admin-data/companies", createPayload);

        Assert.Equal(HttpStatusCode.OK, expiringResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, adminCreateResponse.StatusCode);
    }
}
