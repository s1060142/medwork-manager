using MedWork.Api.Models;
using MedWork.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace MedWork.Api.Data;

public class AppDbContext : DbContext
{
    private readonly IFieldEncryptionService _fieldEncryptionService;

    public AppDbContext(DbContextOptions<AppDbContext> options, IFieldEncryptionService fieldEncryptionService)
        : base(options)
    {
        _fieldEncryptionService = fieldEncryptionService;
    }

    // Multi-tenant core
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<TenantSettings> TenantSettings => Set<TenantSettings>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();

    // Domain entities
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<RiskFactor> RiskFactors => Set<RiskFactor>();
    public DbSet<EmployeeRisk> EmployeeRisks => Set<EmployeeRisk>();
    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<MedicalVisit> MedicalVisits => Set<MedicalVisit>();
    public DbSet<ExamType> ExamTypes => Set<ExamType>();
    public DbSet<VisitExam> VisitExams => Set<VisitExam>();
    public DbSet<JobRole> JobRoles => Set<JobRole>();
    public DbSet<JobRoleRiskFactor> JobRoleRiskFactors => Set<JobRoleRiskFactor>();
    public DbSet<Protocol> Protocols => Set<Protocol>();
    public DbSet<ProtocolStep> ProtocolSteps => Set<ProtocolStep>();
    public DbSet<PersonalProtocol> PersonalProtocols => Set<PersonalProtocol>();
    public DbSet<Anamnesis> Anamneses => Set<Anamnesis>();
    public DbSet<ScheduledExam> ScheduledExams => Set<ScheduledExam>();
    public DbSet<Vaccination> Vaccinations => Set<Vaccination>();
    public DbSet<DoctorAvailability> DoctorAvailabilities => Set<DoctorAvailability>();
    public DbSet<NotificationLog> NotificationLogs => Set<NotificationLog>();
    public DbSet<CompanyGroup> CompanyGroups => Set<CompanyGroup>();
    public DbSet<CompanyContact> CompanyContacts => Set<CompanyContact>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<WorkLocation> WorkLocations => Set<WorkLocation>();
    public DbSet<SiteVisit> SiteVisits => Set<SiteVisit>();
    public DbSet<CompanyDoctor> CompanyDoctors => Set<CompanyDoctor>();
    public DbSet<RiskLevel> RiskLevels => Set<RiskLevel>();
    public DbSet<PhraseTemplate> PhraseTemplates => Set<PhraseTemplate>();
    public DbSet<Questionnaire> Questionnaires => Set<Questionnaire>();
    public DbSet<QuestionnaireResponse> QuestionnaireResponses => Set<QuestionnaireResponse>();
    public DbSet<Signature> Signatures => Set<Signature>();
    public DbSet<BillingDocument> BillingDocuments => Set<BillingDocument>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<ActivityDeadline> ActivityDeadlines => Set<ActivityDeadline>();
    public DbSet<CompanyNomination> CompanyNominations => Set<CompanyNomination>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var encryptedRequiredStringConverter = new ValueConverter<string, string>(
            value => _fieldEncryptionService.Encrypt(value),
            value => _fieldEncryptionService.Decrypt(value));

        var encryptedNullableStringConverter = new ValueConverter<string?, string?>(
            value => string.IsNullOrWhiteSpace(value) ? value : _fieldEncryptionService.Encrypt(value),
            value => string.IsNullOrWhiteSpace(value) ? value : _fieldEncryptionService.Decrypt(value));

        var medicalVisitTypeConverter = new ValueConverter<MedicalVisitType, string>(
            value => value.ToString(),
            value => ParseMedicalVisitType(value));

        modelBuilder.Entity<Company>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.VATNumber).HasMaxLength(30);
            entity.Property(x => x.ContactEmail).HasMaxLength(150);
            entity.Property(x => x.ContactPhone).HasMaxLength(30);
            entity.HasIndex(x => x.VATNumber).IsUnique();
        });

        modelBuilder.Entity<CompanyDoctor>(entity =>
                {
                    entity.HasKey(x => x.Id);
                    entity.HasIndex(x => new { x.CompanyId, x.DoctorId }).IsUnique();
                    entity.HasOne(x => x.Company)
                        .WithMany(x => x.CompanyDoctors)
                        .HasForeignKey(x => x.CompanyId)
                        .OnDelete(DeleteBehavior.Cascade);
                    entity.HasOne(x => x.Doctor)
                        .WithMany(x => x.CompanyDoctors)
                        .HasForeignKey(x => x.DoctorId)
                        .OnDelete(DeleteBehavior.Cascade);
                });

        modelBuilder.Entity<Branch>(entity =>
        {
            entity.Property(x => x.Address).HasMaxLength(250).IsRequired();
            entity.Property(x => x.City).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Province).HasMaxLength(100);
            entity.Property(x => x.PostalCode).HasMaxLength(10);
            entity.HasOne(x => x.Company)
                .WithMany(x => x.Branches)
                .HasForeignKey(x => x.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.Property(x => x.FirstName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.TaxCode).HasMaxLength(32).IsRequired();
            entity.Property(x => x.JobRole).HasMaxLength(120).IsRequired();
            entity.Property(x => x.BirthCity).HasMaxLength(120).IsRequired();
            entity.Property(x => x.BirthCityCode).HasMaxLength(4).IsRequired();
            entity.Property(x => x.Gender).HasMaxLength(1).IsRequired();
            entity.Property(x => x.PersonalEmail).HasMaxLength(150);
            entity.Property(x => x.PhoneNumber).HasMaxLength(30);
            entity.Property(x => x.Reparto).HasMaxLength(120);
            entity.Property(x => x.LuogoDiLavoro).HasMaxLength(200);
            entity.Property(x => x.Periodicita).HasMaxLength(50);
            entity.Property(x => x.Matricola).HasMaxLength(120);
            entity.HasIndex(x => x.TaxCode).IsUnique();

            entity.HasOne(x => x.Company)
                .WithMany(x => x.Employees)
                .HasForeignKey(x => x.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Branch)
                .WithMany(x => x.Employees)
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.JobRoleNavigation)
                .WithMany(x => x.Employees)
                .HasForeignKey(x => x.JobRoleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Doctor>(entity =>
        {
            entity.Property(x => x.FirstName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.MedicalLicenseNumber).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Specialty).HasMaxLength(120);
            entity.Property(x => x.Email).HasMaxLength(150);
            entity.HasIndex(x => x.MedicalLicenseNumber).IsUnique();
        });

        modelBuilder.Entity<RiskFactor>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Allegato3BCategory).HasMaxLength(120);
        });

        modelBuilder.Entity<JobRole>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<JobRoleRiskFactor>(entity =>
        {
            entity.HasKey(x => new { x.JobRoleId, x.RiskFactorId });

            entity.HasOne(x => x.JobRole)
                .WithMany(x => x.JobRoleRiskFactors)
                .HasForeignKey(x => x.JobRoleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.RiskFactor)
                .WithMany(x => x.JobRoleRiskFactors)
                .HasForeignKey(x => x.RiskFactorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Protocol>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.LawReference).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Objective).HasMaxLength(1000);

            entity.HasOne(x => x.JobRole)
                .WithMany(x => x.Protocols)
                .HasForeignKey(x => x.JobRoleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<PersonalProtocol>(entity =>
        {
            entity.Property(x => x.Notes).HasMaxLength(1000);
            entity.HasIndex(x => new { x.EmployeeId, x.ProtocolId }).IsUnique();

            entity.HasOne(x => x.Employee)
                .WithMany(x => x.PersonalProtocols)
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Protocol)
                .WithMany(x => x.PersonalProtocols)
                .HasForeignKey(x => x.ProtocolId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmployeeRisk>(entity =>
        {
            entity.HasKey(x => new { x.EmployeeId, x.RiskFactorId });

            entity.HasOne(x => x.Employee)
                .WithMany(x => x.EmployeeRisks)
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.RiskFactor)
                .WithMany(x => x.EmployeeRisks)
                .HasForeignKey(x => x.RiskFactorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MedicalRecord>(entity =>
        {
            entity.Property(x => x.MedicalHistory).HasMaxLength(4000).HasConversion(encryptedRequiredStringConverter).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(2000);
            entity.Property(x => x.CurrentTherapies).HasMaxLength(2000);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(30).IsRequired();

            entity.HasOne(x => x.Employee)
                .WithOne(x => x.MedicalRecord)
                .HasForeignKey<MedicalRecord>(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => x.EmployeeId).IsUnique();
        });

        modelBuilder.Entity<MedicalVisit>(entity =>
        {
            entity.Property(x => x.Outcome).HasMaxLength(250).IsRequired();
            entity.Property(x => x.ClinicalNotes).HasMaxLength(4000).HasConversion(encryptedNullableStringConverter);
            entity.Property(x => x.VisitType).HasConversion(medicalVisitTypeConverter).HasMaxLength(40).IsRequired();
            entity.Property(x => x.TargetOrgans).HasMaxLength(2000);
            entity.Property(x => x.ObjectiveExam).HasMaxLength(4000).HasConversion(encryptedNullableStringConverter);

            entity.HasOne(x => x.Employee)
                .WithMany(x => x.MedicalVisits)
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Doctor)
                .WithMany(x => x.MedicalVisits)
                .HasForeignKey(x => x.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.PersonalProtocol)
                .WithMany()
                .HasForeignKey(x => x.PersonalProtocolId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Anamnesis>(entity =>
        {
            entity.Property(x => x.WorkHistory).HasMaxLength(4000).HasConversion(encryptedNullableStringConverter);
            entity.Property(x => x.PersonalHistory).HasMaxLength(4000).HasConversion(encryptedNullableStringConverter);
            entity.Property(x => x.FamilyHistory).HasMaxLength(4000).HasConversion(encryptedNullableStringConverter);
            entity.Property(x => x.RemotePathology).HasMaxLength(4000).HasConversion(encryptedNullableStringConverter);
            entity.Property(x => x.RecentPathology).HasMaxLength(4000).HasConversion(encryptedNullableStringConverter);

            entity.HasOne(x => x.MedicalVisit)
                .WithOne(x => x.Anamnesis)
                .HasForeignKey<Anamnesis>(x => x.MedicalVisitId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => x.MedicalVisitId).IsUnique();
        });

        modelBuilder.Entity<ExamType>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(120);
        });

        modelBuilder.Entity<VisitExam>(entity =>
        {
            entity.Property(x => x.Result).HasMaxLength(3000).HasConversion(encryptedRequiredStringConverter).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(2000);
            entity.Property(x => x.ReferenceRange).HasMaxLength(300);

            entity.HasOne(x => x.MedicalVisit)
                .WithMany(x => x.VisitExams)
                .HasForeignKey(x => x.MedicalVisitId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ExamType)
                .WithMany(x => x.VisitExams)
                .HasForeignKey(x => x.ExamTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ScheduledExam>(entity =>
        {
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(30).IsRequired();

            entity.HasOne(x => x.Employee)
                .WithMany(x => x.ScheduledExams)
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ExamType)
                .WithMany()
                .HasForeignKey(x => x.ExamTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Vaccination>(entity =>
        {
            entity.Property(x => x.VaccineName).HasMaxLength(150).IsRequired();

            entity.HasOne(x => x.Employee)
                .WithMany(x => x.Vaccinations)
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DoctorAvailability>(entity =>
        {
            entity.HasOne(x => x.Doctor)
                .WithMany(x => x.Availabilities)
                .HasForeignKey(x => x.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NotificationLog>(entity =>
        {
            entity.Property(x => x.Channel).HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(x => x.MessageText).HasMaxLength(2000).HasConversion(encryptedRequiredStringConverter).IsRequired();

            entity.HasOne(x => x.Employee)
                .WithMany(x => x.NotificationLogs)
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Multi-tenant core entities
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.Property(x => x.LogoUrl).HasMaxLength(200);
            entity.Property(x => x.PrimaryColor).HasMaxLength(200);
            entity.Property(x => x.SecondaryColor).HasMaxLength(200);
            entity.HasIndex(x => x.Slug).IsUnique();
        });

        modelBuilder.Entity<TenantSettings>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Key).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Value).HasMaxLength(4000);
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.HasOne(x => x.Tenant)
                .WithMany(x => x.Settings)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(x => new { x.TenantId, x.Key }).IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(x => x.Email).HasMaxLength(150).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(256);
            entity.Property(x => x.FirstName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Role).HasMaxLength(50);
            entity.Property(x => x.ExternalId).HasMaxLength(100);
            entity.Property(x => x.ExternalProvider).HasMaxLength(50);
            entity.HasIndex(x => new { x.TenantId, x.Email }).IsUnique();
            entity.HasOne(x => x.Tenant)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(200);
            entity.HasOne(x => x.Tenant)
                .WithMany()
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(200);
            entity.Property(x => x.Category).HasMaxLength(50);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasOne(x => x.User)
                .WithMany(x => x.UserRoles)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(x => x.Role)
                .WithMany(x => x.UserRoles)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(x => new { x.UserId, x.RoleId }).IsUnique();
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasOne(x => x.Role)
                .WithMany(x => x.RolePermissions)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Permission)
                .WithMany(x => x.RolePermissions)
                .HasForeignKey(x => x.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(x => new { x.RoleId, x.PermissionId }).IsUnique();
        });

        modelBuilder.Entity<UserPermission>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasOne(x => x.User)
                .WithMany(x => x.UserPermissions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Permission)
                .WithMany(x => x.UserPermissions)
                .HasForeignKey(x => x.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(x => new { x.UserId, x.PermissionId }).IsUnique();
        });

        // ProtocolStep configuration
        modelBuilder.Entity<ProtocolStep>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.Property(x => x.StepType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ConfigurationJson).HasMaxLength(4000);
            entity.HasOne(x => x.Protocol)
                .WithMany()
                .HasForeignKey(x => x.ProtocolId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Tenant)
                .WithMany()
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // RiskLevel configuration
        modelBuilder.Entity<RiskLevel>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(200);
            entity.Property(x => x.Color).HasMaxLength(20);
            entity.HasOne(x => x.Tenant)
                .WithMany()
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // BillingDocument configuration
        modelBuilder.Entity<BillingDocument>(entity =>
        {
            entity.Property(x => x.Period).HasMaxLength(30).IsRequired();
            entity.Property(x => x.InvoiceNumber).HasMaxLength(50).IsRequired();
            entity.Property(x => x.VisitCount).IsRequired();
            entity.Property(x => x.Amount).HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(x => x.Status).HasMaxLength(30).IsRequired();
            entity.Property(x => x.IssuedAt).IsRequired();
            entity.Property(x => x.GeneratedById).HasMaxLength(120);

            entity.HasOne(x => x.Company)
                .WithMany()
                .HasForeignKey(x => x.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.TenantId, x.InvoiceNumber }).IsUnique();
            entity.HasIndex(x => new { x.TenantId, x.CompanyId, x.Period });
        });

        // AuditEvent configuration
        modelBuilder.Entity<AuditEvent>(entity =>
        {
            entity.Property(x => x.UserName).HasMaxLength(120);
            entity.Property(x => x.Module).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Action).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Detail).HasMaxLength(1000);
            entity.Property(x => x.IpAddress).HasMaxLength(45);

            entity.HasIndex(x => new { x.TenantId, x.Timestamp });
        });

        // Add TenantId foreign key to all existing entities
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (entityType.ClrType != typeof(Tenant) &&
                entityType.ClrType != typeof(TenantSettings) &&
                entityType.ClrType != typeof(User) &&
                entityType.ClrType != typeof(Role) &&
                entityType.ClrType != typeof(Permission) &&
                entityType.ClrType != typeof(UserRole) &&
                entityType.ClrType != typeof(RolePermission) &&
                entityType.ClrType != typeof(UserPermission) &&
                entityType.ClrType != typeof(ProtocolStep) &&
                entityType.ClrType != typeof(RiskLevel) &&
                entityType.ClrType != typeof(BillingDocument))
            {
                var tenantIdProperty = entityType.FindProperty("TenantId");
                if (tenantIdProperty != null)
                {
                    entityType.GetForeignKeys().Where(fk => fk.Properties.Contains(tenantIdProperty)).ToList().ForEach(fk => modelBuilder.Entity(entityType.ClrType).Metadata.RemoveForeignKey(fk));

                    modelBuilder.Entity(entityType.ClrType).HasOne(typeof(Tenant), "Tenant")
                        .WithMany()
                        .HasForeignKey("TenantId")
                        .OnDelete(DeleteBehavior.NoAction)
                        .IsRequired();
                }
            }
        }
    }

    private static MedicalVisitType ParseMedicalVisitType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return MedicalVisitType.Periodic;
        }

        if (Enum.TryParse<MedicalVisitType>(value, ignoreCase: true, out var parsed))
        {
            return parsed;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "periodica" => MedicalVisitType.Periodic,
            "preventiva" => MedicalVisitType.Preventive,
            "cambio mansione" => MedicalVisitType.RoleChange,
            "straordinaria" => MedicalVisitType.EmployeeRequest,
            "fine rapporto" => MedicalVisitType.EndOfRelationship,
            _ => MedicalVisitType.Periodic
        };
    }
}
