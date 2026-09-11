using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using MedWork.Api.Data;
using MedWork.Api.Security;
using MedWork.Api.Services;
using System.IO;

var builder = Host.CreateApplicationBuilder(args);

// 1. Load Configuration from MedWork.Api/appsettings.json
// Get the absolute path to the MedWork.Api project's appsettings.json
// When running from dotnet run, AppContext.BaseDirectory is the output bin directory
// We need to navigate up to the solution root then down to MedWork.Api
var solutionRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
var apiAppSettingsPath = Path.Combine(solutionRoot, "MedWork.Api", "appsettings.json");

if (!File.Exists(apiAppSettingsPath))
{
    Console.WriteLine($"ERROR: Could not find appsettings.json at: {apiAppSettingsPath}");
    // Fallback to relative path for backward compatibility
    builder.Configuration.AddJsonFile("../MedWork.Api/appsettings.json", optional: false, reloadOnChange: true);
}
else
{
    builder.Configuration.AddJsonFile(apiAppSettingsPath, optional: false, reloadOnChange: true);
}

// 2. Setup Services needed by AppDbContext and AppDbSeeder
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString);
});

// Add data protection services needed by FieldEncryptionService
// Configure a persistent key ring so that the API and this initializer share the same keys
var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
var dataProtectionPath = Path.Combine(userProfile, "aspnet_data_protection");
if (!Directory.Exists(dataProtectionPath))
{
    Directory.CreateDirectory(dataProtectionPath);
}
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath))
    .SetApplicationName("MedWork");
// Note: PersistKeysToFileSystem is in Microsoft.AspNetCore.DataProtection.Extensions

// We need to register the services that AppDbContext depends on
// Based on our previous reads, AppDbContext needs IFieldEncryptionService
builder.Services.AddSingleton<IFieldEncryptionService, FieldEncryptionService>();
// If there are other services required, we'll add them here.

using IHost host = builder.Build();

using (var scope = host.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        Console.WriteLine("Starting database initialization...");
        var dbContext = services.GetRequiredService<AppDbContext>();
        
        // This calls the existing seeder logic you already have in the API
        await AppDbSeeder.SeedAsync(dbContext);
        
        Console.WriteLine("Database initialized successfully!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred during initialization: {ex.Message}");
        Console.WriteLine(ex.StackTrace);
    }
}
