using System;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MedWork.Api.Tests.Integration;

public class MedWorkWebAppFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"MedWorkTestDb_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Replace the shared InMemory database with a unique one for this factory instance
            var serviceList = services as System.Collections.Generic.IList<Microsoft.Extensions.DependencyInjection.ServiceDescriptor>;
            if (serviceList != null)
            {
                for (int i = serviceList.Count - 1; i >= 0; i--)
                {
                    if (serviceList[i].ServiceType == typeof(Microsoft.EntityFrameworkCore.DbContextOptions<MedWork.Api.Data.AppDbContext>) ||
                        serviceList[i].ServiceType == typeof(MedWork.Api.Data.AppDbContext))
                    {
                        serviceList.RemoveAt(i);
                    }
                }
            }

            services.AddDbContext<MedWork.Api.Data.AppDbContext>(options =>
                options.UseInMemoryDatabase(_dbName)
                       .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
            }).AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });
        });
    }
}
