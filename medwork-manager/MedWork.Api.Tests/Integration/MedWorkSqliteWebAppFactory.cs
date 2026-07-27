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
            // Rimuovi registrazioni DB esistenti
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<DbContextOptions<AuditDbContext>>();

            // Aggiungi SQLite con connection string condivisa
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseSqlite(_connectionString);
            });

            services.AddDbContext<AuditDbContext>(options =>
            {
                options.UseSqlite(_connectionString);
            });

            // Registra le policy di autorizzazione (importante!)
            services.AddAuthorization(options => options.AddMedWorkAuthorizationPolicies());

            // Assicura che lo schema sia creato all'avvio per ENTRAMBI i context
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            appDb.Database.EnsureCreated();
            
            var auditDb = scope.ServiceProvider.GetRequiredService<AuditDbContext>();
            auditDb.Database.EnsureCreated();

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