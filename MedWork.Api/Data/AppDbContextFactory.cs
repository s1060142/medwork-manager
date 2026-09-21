using MedWork.Api.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MedWork.Api.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        var connectionString = Environment.GetEnvironmentVariable("DESIGN_TIME_CONNECTION_STRING")
            ?? "Data Source=medwork.db";

        if (connectionString.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase) && !connectionString.Contains("Server="))
        {
            optionsBuilder.UseSqlite(connectionString);
        }
        else
        {
            optionsBuilder.UseSqlServer(connectionString);
        }

        var dataProtectionProvider = DataProtectionProvider.Create("MedWork.Api.DesignTime");
        var encryptionService = new FieldEncryptionService(dataProtectionProvider);

        return new AppDbContext(optionsBuilder.Options, encryptionService);
    }
}
