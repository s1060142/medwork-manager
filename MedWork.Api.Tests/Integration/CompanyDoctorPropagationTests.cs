using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace MedWork.Api.Tests.Integration;

public class CompanyDoctorPropagationTests : IClassFixture<MedWorkWebAppFactory>, IClassFixture<MedWorkWebAppAnonymousFactory>
{
    private readonly MedWorkWebAppFactory _factory;
    private readonly MedWorkWebAppAnonymousFactory _anonymousFactory;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    public CompanyDoctorPropagationTests(MedWorkWebAppFactory factory, MedWorkWebAppAnonymousFactory anonymousFactory)
    {
        _factory = factory;
        _anonymousFactory = anonymousFactory;
    }

    private async Task<(int companyId, int doctorAId, int doctorBId, int employeeId)> SetupTestDataAsync(AppDbContext db)
    {
        const int tid = 1;

        var doctorA = new Doctor
        {
            FirstName = "Laura",
            LastName = "Bianchi",
            MedicalLicenseNumber = $"DOCA-{Guid.NewGuid():N}"[..18],
            Specialty = "Medicina del Lavoro",
            TenantId = tid
        };
        var doctorB = new Doctor
        {
            FirstName = "Paolo",
            LastName = "Verdi",
            MedicalLicenseNumber = $"DOCB-{Guid.NewGuid():N}"[..18],
            Specialty = "Medicina del Lavoro",
            TenantId = tid
        };
        db.Doctors.AddRange(doctorA, doctorB);
        await db.SaveChangesAsync();

        var company = new Company
        {
            Name = "QA Azienda Medico 001",
            LegalName = "QA Azienda Medico 001 S.r.l.",
            VATNumber = $"IT{Random.Shared.NextInt64(10000000000, 99999999999)}",
            TenantId = tid
        };
        db.Companies.Add(company);
        await db.SaveChangesAsync();

        var branch = new Branch
        {
            CompanyId = company.Id,
            Address = "Via Garibaldi 10",
            City = "Milano",
            Province = "MI",
            PostalCode = "20121",
            TenantId = tid
        };
        db.Branches.Add(branch);
        await db.SaveChangesAsync();

        // Assign Doctor A as Coordinator
        db.CompanyDoctors.Add(new CompanyDoctor
        {
            CompanyId = company.Id,
            DoctorId = doctorA.Id,
            IsCoordinator = true,
            IsActive = true,
            TenantId = tid
        });
        await db.SaveChangesAsync();

        var employee = new Employee
        {
            CompanyId = company.Id,
            BranchId = branch.Id,
            FirstName = "Mario",
            LastName = "Rossi",
            TaxCode = "RSSMRA80A01F205X",
            JobRole = "Operaio",
            BirthDate = new DateTime(1980, 1, 1),
            BirthCity = "Milano",
            BirthCityCode = "F205",
            TenantId = tid
        };
        db.Employees.Add(employee);
        await db.SaveChangesAsync();

        return (company.Id, doctorA.Id, doctorB.Id, employee.Id);
    }

    [Fact]
    public async Task Test1_Company_With_DoctorA_Employee_Shows_DoctorA()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var (companyId, doctorAId, _, employeeId) = await SetupTestDataAsync(db);

        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/master-data/employees?companyId={companyId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var array = doc.RootElement;
        Assert.True(array.GetArrayLength() > 0);

        var emp = array.EnumerateArray().First(e => e.GetProperty("id").GetInt32() == employeeId);
        Assert.Equal(doctorAId, emp.GetProperty("companyDoctorId").GetInt32());
        Assert.Contains("Bianchi", emp.GetProperty("companyDoctorName").GetString());
    }

    [Fact]
    public async Task Test2_Doctor_Changes_From_A_To_B_Worker_Shows_B_Historic_Visit_Retains_A()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var (companyId, doctorAId, doctorBId, employeeId) = await SetupTestDataAsync(db);
        var client = _factory.CreateClient();

        // 1. Create a historical visit with Doctor A
        var visit = new MedicalVisit
        {
            EmployeeId = employeeId,
            DoctorId = doctorAId,
            VisitDate = DateTime.UtcNow.AddMonths(-2),
            NextDeadlineDate = DateTime.UtcNow.AddMonths(10),
            Outcome = "Idoneo alla mansione",
            VisitType = MedicalVisitType.Periodic,
            TenantId = 1
        };
        db.MedicalVisits.Add(visit);
        await db.SaveChangesAsync();

        // 2. Change Company's Doctor from A to B via API
        var changeDocResponse = await client.PutAsJsonAsync("/api/admin-data/company-doctors", new
        {
            companyId,
            doctorIds = new[] { doctorBId },
            coordinatorDoctorId = doctorBId
        });
        Assert.Equal(HttpStatusCode.OK, changeDocResponse.StatusCode);

        // 3. Worker now dynamically shows Doctor B
        var empResponse = await client.GetAsync($"/api/master-data/employees?companyId={companyId}");
        Assert.Equal(HttpStatusCode.OK, empResponse.StatusCode);
        var empJson = await empResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(empJson);
        var emp = doc.RootElement.EnumerateArray().First(e => e.GetProperty("id").GetInt32() == employeeId);
        Assert.Equal(doctorBId, emp.GetProperty("companyDoctorId").GetInt32());
        Assert.Contains("Verdi", emp.GetProperty("companyDoctorName").GetString());

        // 4. Historical visit MUST retain Doctor A (Snapshot model)
        var visitInDb = await db.MedicalVisits.AsNoTracking().FirstAsync(v => v.Id == visit.Id);
        Assert.Equal(doctorAId, visitInDb.DoctorId);
    }

    [Fact]
    public async Task Test3_Employee_Changes_Company_Shows_New_Company_Doctor()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var (company1Id, doctorAId, doctorBId, employeeId) = await SetupTestDataAsync(db);
        var client = _factory.CreateClient();

        // Create Company 2 with Doctor B
        var company2 = new Company
        {
            Name = "QA Seconda Azienda",
            LegalName = "QA Seconda Azienda S.p.A.",
            VATNumber = $"IT{Random.Shared.NextInt64(10000000000, 99999999999)}",
            TenantId = 1
        };
        db.Companies.Add(company2);
        await db.SaveChangesAsync();

        var branch2 = new Branch
        {
            CompanyId = company2.Id,
            Address = "Via Roma 5",
            City = "Torino",
            Province = "TO",
            PostalCode = "10100",
            TenantId = 1
        };
        db.Branches.Add(branch2);
        await db.SaveChangesAsync();

        db.CompanyDoctors.Add(new CompanyDoctor
        {
            CompanyId = company2.Id,
            DoctorId = doctorBId,
            IsCoordinator = true,
            IsActive = true,
            TenantId = 1
        });
        await db.SaveChangesAsync();

        // Move Employee from Company 1 to Company 2
        var empEntity = await db.Employees.FirstAsync(e => e.Id == employeeId);
        empEntity.CompanyId = company2.Id;
        empEntity.BranchId = branch2.Id;
        await db.SaveChangesAsync();

        // Verify dynamic resolution reflects Company 2's doctor (Doctor B)
        var empResponse = await client.GetAsync($"/api/master-data/employees?companyId={company2.Id}");
        Assert.Equal(HttpStatusCode.OK, empResponse.StatusCode);
        var empJson = await empResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(empJson);
        var emp = doc.RootElement.EnumerateArray().First(e => e.GetProperty("id").GetInt32() == employeeId);
        Assert.Equal(doctorBId, emp.GetProperty("companyDoctorId").GetInt32());
        Assert.Contains("Verdi", emp.GetProperty("companyDoctorName").GetString());
    }

    [Fact]
    public async Task Test4_Company_Without_Doctor_Handled_Gracefully()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var emptyCompany = new Company
        {
            Name = "Azienda Senza Medico",
            LegalName = "Senza Medico S.r.l.",
            VATNumber = $"IT{Random.Shared.NextInt64(10000000000, 99999999999)}",
            TenantId = 1
        };
        db.Companies.Add(emptyCompany);
        await db.SaveChangesAsync();

        var branch = new Branch
        {
            CompanyId = emptyCompany.Id,
            Address = "Corso Francia 20",
            City = "Torino",
            Province = "TO",
            PostalCode = "10138",
            TenantId = 1
        };
        db.Branches.Add(branch);
        await db.SaveChangesAsync();

        var emp = new Employee
        {
            CompanyId = emptyCompany.Id,
            BranchId = branch.Id,
            FirstName = "Luigi",
            LastName = "Neri",
            TaxCode = "NRILGU85B02L219Z",
            JobRole = "Tecnico",
            BirthDate = new DateTime(1985, 2, 2),
            BirthCity = "Torino",
            BirthCityCode = "L219",
            TenantId = 1
        };
        db.Employees.Add(emp);
        await db.SaveChangesAsync();

        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/master-data/employees?companyId={emptyCompany.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var item = doc.RootElement.EnumerateArray().First(e => e.GetProperty("id").GetInt32() == emp.Id);
        Assert.True(item.GetProperty("companyDoctorId").ValueKind == JsonValueKind.Null);
        Assert.True(item.GetProperty("companyDoctorName").ValueKind == JsonValueKind.Null);
    }

    [Fact]
    public async Task Test5_Filter_Employees_By_Doctor()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var (companyId, doctorAId, doctorBId, employeeId) = await SetupTestDataAsync(db);

        var client = _factory.CreateClient();

        // Filter by Doctor A -> returns employee
        var resDoctorA = await client.GetAsync($"/api/master-data/employees?doctorId={doctorAId}");
        Assert.Equal(HttpStatusCode.OK, resDoctorA.StatusCode);
        var jsonA = await resDoctorA.Content.ReadAsStringAsync();
        using var docA = JsonDocument.Parse(jsonA);
        Assert.Contains(docA.RootElement.EnumerateArray(), e => e.GetProperty("id").GetInt32() == employeeId);

        // Filter by Doctor B -> does NOT return employee
        var resDoctorB = await client.GetAsync($"/api/master-data/employees?doctorId={doctorBId}");
        Assert.Equal(HttpStatusCode.OK, resDoctorB.StatusCode);
        var jsonB = await resDoctorB.Content.ReadAsStringAsync();
        using var docB = JsonDocument.Parse(jsonB);
        Assert.DoesNotContain(docB.RootElement.EnumerateArray(), e => e.GetProperty("id").GetInt32() == employeeId);
    }

    [Fact]
    public async Task Test6_Create_Medical_Visit_Proposes_And_Saves_Doctor()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var (companyId, doctorAId, _, employeeId) = await SetupTestDataAsync(db);

        var client = _factory.CreateClient();

        // Create visit with doctorId = null -> backend automatically assigns company's Doctor A
        var payload = new
        {
            employeeId,
            doctorId = (int?)null,
            visitDate = DateTime.UtcNow.ToString("o"),
            nextDeadlineDate = DateTime.UtcNow.AddYears(1).ToString("o"),
            outcome = "Idoneo senza limitazioni",
            visitType = 2
        };

        var response = await client.PostAsJsonAsync("/api/doctor-data/medical-visits", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var visitResponse = await response.Content.ReadFromJsonAsync<MedicalVisit>(JsonOptions);
        Assert.NotNull(visitResponse);
        Assert.Equal(doctorAId, visitResponse.DoctorId);
    }

    [Fact]
    public async Task Test7_Reopening_And_Refresh_Data_Persists()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var (companyId, doctorAId, _, employeeId) = await SetupTestDataAsync(db);

        var client = _factory.CreateClient();

        // Create visit
        var createRes = await client.PostAsJsonAsync("/api/doctor-data/medical-visits", new
        {
            employeeId,
            doctorId = doctorAId,
            visitDate = DateTime.UtcNow.ToString("o"),
            nextDeadlineDate = DateTime.UtcNow.AddYears(1).ToString("o"),
            outcome = "Idoneo con prescrizioni",
            visitType = 2
        });
        Assert.Equal(HttpStatusCode.OK, createRes.StatusCode);

        // Fetch medical visits list (simulating UI reopening)
        var listRes = await client.GetAsync("/api/master-data/medical-visits");
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);

        var listJson = await listRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(listJson);
        var visitItem = doc.RootElement.EnumerateArray().First(v => v.GetProperty("employeeId").GetInt32() == employeeId);
        Assert.Equal(doctorAId, visitItem.GetProperty("doctorId").GetInt32());
        Assert.Contains("Bianchi", visitItem.GetProperty("doctorFullName").GetString());
    }

    [Fact]
    public async Task Test8_Unauthorized_User_Blocked()
    {
        var anonClient = _anonymousFactory.CreateClient();

        var empRes = await anonClient.GetAsync("/api/master-data/employees");
        Assert.Equal(HttpStatusCode.Unauthorized, empRes.StatusCode);

        var visitRes = await anonClient.PostAsJsonAsync("/api/doctor-data/medical-visits", new { employeeId = 1 });
        Assert.Equal(HttpStatusCode.Unauthorized, visitRes.StatusCode);
    }
}
