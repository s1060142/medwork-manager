using System.Net;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.Extensions.DependencyInjection;

namespace MedWork.Api.Tests.Integration;

public class TenantScopingIntegrationTests : IClassFixture<MedWorkWebAppFactory>
{
    private readonly MedWorkWebAppFactory _factory;

    public TenantScopingIntegrationTests(MedWorkWebAppFactory factory)
    {
        _factory = factory;
    }

    private (int ownEmployeeId, int otherEmployeeId) SeedMedicalRecords()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var own = new MedicalRecord
        {
            TenantId = 1,
            EmployeeId = 901,
            MedicalHistory = "Storico tenant corrente.",
            Status = MedicalRecordStatus.Active
        };
        var other = new MedicalRecord
        {
            TenantId = 2,
            EmployeeId = 902,
            MedicalHistory = "Storico di un altro tenant.",
            Status = MedicalRecordStatus.Active
        };

        db.MedicalRecords.Add(own);
        db.MedicalRecords.Add(other);
        db.SaveChanges();

        return (own.EmployeeId, other.EmployeeId);
    }

    [Fact]
    public async Task GetByEmployee_IsTenantScoped()
    {
        var (ownId, otherId) = SeedMedicalRecords();
        var client = _factory.CreateClient();

        var ownResponse = await client.GetAsync($"/api/medical-records/employee/{ownId}");
        Assert.Equal(HttpStatusCode.OK, ownResponse.StatusCode);

        var crossResponse = await client.GetAsync($"/api/medical-records/employee/{otherId}");
        Assert.Equal(HttpStatusCode.NotFound, crossResponse.StatusCode);
    }

    private (int ownVisitId, int otherVisitId) SeedVisitExams()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        var examType = new ExamType { Name = "Audiometria", Category = "Funzionale", TenantId = 1 };
        db.ExamTypes.Add(examType);
        db.SaveChanges();

        var own = new VisitExam
        {
            TenantId = 1,
            MedicalVisitId = 801,
            ExamTypeId = examType.Id,
            Result = "Normale"
        };
        var other = new VisitExam
        {
            TenantId = 2,
            MedicalVisitId = 802,
            ExamTypeId = examType.Id,
            Result = "Riservato"
        };

        db.VisitExams.Add(own);
        db.VisitExams.Add(other);
        db.SaveChanges();

        return (own.MedicalVisitId, other.MedicalVisitId);
    }

    [Fact]
    public async Task GetByVisit_IsTenantScoped()
    {
        var (ownId, otherId) = SeedVisitExams();
        var client = _factory.CreateClient();

        var ownResponse = await client.GetAsync($"/api/visit-exams/visit/{ownId}");
        Assert.Equal(HttpStatusCode.OK, ownResponse.StatusCode);
        var ownBody = await ownResponse.Content.ReadAsStringAsync();
        Assert.Contains("Normale", ownBody);

        var crossResponse = await client.GetAsync($"/api/visit-exams/visit/{otherId}");
        Assert.Equal(HttpStatusCode.OK, crossResponse.StatusCode);
        var crossBody = await crossResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain("Riservato", crossBody);
    }
}
