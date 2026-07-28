using MedWork.Api.Data;
using MedWork.Api.Security;
using MedWork.Api.Tests.Integration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace MedWork.Api.Tests.Integration;

/// <summary>
/// WebApplicationFactory che usa SQLite (file-based, relazionale vero) invece di InMemory.
/// Esercita tutta la pipeline: HTTP → Auth → Controller → FluentValidation → EF Core → SQL reale.
/// </summary>
public class MedWorkSqliteWebAppFactory : WebApplicationFactory<Program>
{
    private readonly string _databasePath;
    private readonly string _connectionString;

    public MedWorkSqliteWebAppFactory()
    {
        // SQLite file-based per persistenza affidabile tra context
        _databasePath = Path.Combine(Path.GetTempPath(), $"MedWorkTest_{Guid.NewGuid():N}.db");
        _connectionString = $"Data Source={_databasePath};Cache=Shared";
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Rimuovi completamente le registrazioni dei DbContext per sostituirle
            var appDbContextDescriptor = services.SingleOrDefault(
                d => d.Lifetime == ServiceLifetime.Scoped && 
                     d.ServiceType.Name.Contains("AppDbContext"));
            if (appDbContextDescriptor != null)
                services.Remove(appDbContextDescriptor);

            var auditDbContextDescriptor = services.SingleOrDefault(
                d => d.Lifetime == ServiceLifetime.Scoped && 
                     d.ServiceType.Name.Contains("AuditDbContext"));
            if (auditDbContextDescriptor != null)
                services.Remove(auditDbContextDescriptor);

            // Rimuovi anche i DbContextOptions che contengono i provider
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<DbContextOptions<AuditDbContext>>();

            // Registra SQLite in modo da SOSTITITUIRE i provider esistenti
            services.AddScoped<AppDbContext>(provider =>
            {
                var options = new DbContextOptionsBuilder<AppDbContext>()
                    .UseSqlite(_connectionString)
                    // Ignora il warning di pending model changes per i test
                    .ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning))
                    .Options;
                var context = new AppDbContext(options);
                // Usa EnsureCreated per SQLite invece di Migrate
                context.Database.EnsureCreated();
                return context;
            });

            services.AddScoped<AuditDbContext>(provider =>
            {
                var options = new DbContextOptionsBuilder<AuditDbContext>()
                    .UseSqlite(_connectionString)
                    .ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning))
                    .Options;
                var context = new AuditDbContext(options);
                context.Database.EnsureCreated();
                return context;
            });

            // Registra le policy di autorizzazione (importante!)
            services.AddAuthorization(options => options.AddMedWorkAuthorizationPolicies());

            // Test auth handler
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
            }).AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && File.Exists(_databasePath))
        {
            try { File.Delete(_databasePath); } catch { }
        }
    }
}