using System;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MedWork.Api.Tests.Integration;

public class MedWorkWebAppMissingTenantFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices((context, services) =>
        {
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandlerMissingTenant.SchemeName;
                options.DefaultChallengeScheme = TestAuthHandlerMissingTenant.SchemeName;
            }).AddScheme<AuthenticationSchemeOptions, TestAuthHandlerMissingTenant>(TestAuthHandlerMissingTenant.SchemeName, _ => { });
        });
    }
}