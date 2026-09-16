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
        optionsBuilder.UseSqlServer("Server=localhost,11433;Database=MedWorkDb;User ID=sa;Password=sasa;TrustServerCertificate=True;");

        var dataProtectionProvider = DataProtectionProvider.Create("MedWork.Api.DesignTime");
        var encryptionService = new FieldEncryptionService(dataProtectionProvider);

        return new AppDbContext(optionsBuilder.Options, encryptionService);
    }
}
