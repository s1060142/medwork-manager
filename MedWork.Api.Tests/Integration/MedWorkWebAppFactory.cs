using System;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MedWork.Api.Tests.Integration;

public class MedWorkWebAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development"); // Use Development to get SQL Server connection from appsettings

        builder.ConfigureServices(services =>
        {
            // Replace the shared InMemory database with SQL Server
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

            // Add SQL Server context using connection string from appsettings
            services.AddDbContext<MedWork.Api.Data.AppDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
                       .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
            });