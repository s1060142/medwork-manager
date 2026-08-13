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
        optionsBuilder.UseSqlServer("Server=localhost;Database=MedWorkDb;User Id=sa;Password=sasa;TrustServerCertificate=True;MultipleActiveResultSets=true;");

        var dataProtectionProvider = DataProtectionProvider.Create("MedWork.Api.DesignTime");
        var encryptionService = new FieldEncryptionService(dataProtectionProvider);

        return new AppDbContext(optionsBuilder.Options, encryptionService);
    }
}
