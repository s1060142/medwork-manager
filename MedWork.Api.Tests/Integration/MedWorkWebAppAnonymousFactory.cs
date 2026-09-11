using System;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MedWork.Api.Tests.Integration;

public class MedWorkWebAppAnonymousFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing")
            .ConfigureServices((context, services) =>
            {
                var connStr = context.Configuration.GetConnectionString("DefaultConnection");
                if (!string.IsNullOrWhiteSpace(connStr))
                {
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
                        options.UseSqlServer(connStr)
                               .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));
                }
            });
    }
}