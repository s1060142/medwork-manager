using MedWork.Api.Models;
using MedWork.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace MedWork.Api.Data;

public class AppDbContext : DbContext
{
    private readonly ICurrentContextService? _currentContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentContextService? currentContext = null)
        : base(options)
    {
        _currentContext = currentContext;
    }

    // Scoping dinamico: valutato a ogni query (EF li tratta come parametri, non cache-ati come costanti)
    private int? CurrentCompanyId => _currentContext?.CompanyId;
    private int? CurrentSiteId => _currentContext?.SiteId;

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

        // PPE (DPI) entities
                public DbSet<Ppe> Ppes => Set<Ppe>();
                public DbSet<EmployeePpe> EmployeePpes => Set<EmployeePpe>();
                public DbSet<JobRolePpe> JobRolePpes => Set<JobRolePpe>();

                // Document entities
                                                public DbSet<Attachment> Attachments => Set<Attachment>();

                        // Injury entities
                        public DbSet<Injury> Injuries => Set<Injury>();
                        public DbSet<InjuryAttachment> InjuryAttachments => Set<InjuryAttachment>();

                        public DbSet<AppUser> Users => Set<AppUser>();

                            protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasIndex(x => x.Username).IsUnique();
            entity.Property(x => x.Username).HasMaxLength(120).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Role).HasMaxLength(40).IsRequired();
            entity.Property(x => x.TaxCode).HasMaxLength(32);
            entity.Property(x => x.Email).HasMaxLength(120);
        });

                var medicalVisitTypeConverter = new ValueConverter<MedicalVisitType, string>(
            value => value.ToString(),
            value => ParseMedicalVisitType(value));

        modelBuilder.Entity<Company>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.VATNumber).HasMaxLength(30).IsRequired();
            entity.Property(x => x.ContactEmail).HasMaxLength(150);
            entity.Property(x => x.ContactPhone).HasMaxLength(30);
            entity.HasIndex(x => x.VATNumber).IsUnique();
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
                    entity.Property(x => x.MedicalHistory).HasMaxLength(4000).IsRequired();
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
                    entity.Property(x => x.ClinicalNotes).HasMaxLength(4000);
                    entity.Property(x => x.VisitType).HasConversion(medicalVisitTypeConverter).HasMaxLength(40).IsRequired();
                    entity.Property(x => x.TargetOrgans).HasMaxLength(2000);
                    entity.Property(x => x.ObjectiveExam).HasMaxLength(4000);

                    entity.HasOne(x => x.Employee)
                        .WithMany(x => x.MedicalVisits)
                        .HasForeignKey(x => x.EmployeeId)
                        .OnDelete(DeleteBehavior.Cascade);

                    entity.HasOne(x => x.Doctor)
                        .WithMany(x => x.MedicalVisits)
                        .HasForeignKey(x => x.DoctorId)
                        .OnDelete(DeleteBehavior.Restrict);
                });

                modelBuilder.Entity<Anamnesis>(entity =>
                {
                    entity.Property(x => x.WorkHistory).HasMaxLength(4000);
                    entity.Property(x => x.PersonalHistory).HasMaxLength(4000);
                    entity.Property(x => x.FamilyHistory).HasMaxLength(4000);
                    entity.Property(x => x.RemotePathology).HasMaxLength(4000);
                    entity.Property(x => x.RecentPathology).HasMaxLength(4000);

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
                    entity.Property(x => x.Result).HasMaxLength(3000).IsRequired();
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
                    entity.Property(x => x.MessageText).HasMaxLength(2000).IsRequired();
                    // Chiave di deduplicazione NON cifrata (vedi NotificationLog.ReminderKey).
                    entity.Property(x => x.ReminderKey).HasMaxLength(120);

                    entity.HasOne(x => x.Employee)
                        .WithMany(x => x.NotificationLogs)
                        .HasForeignKey(x => x.EmployeeId)
                        .OnDelete(DeleteBehavior.Cascade);
                });

                // PPE (DPI) configurations
                modelBuilder.Entity<Ppe>(entity =>
                {
                    entity.HasKey(x => x.Id);
                    entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
                    entity.Property(x => x.Category).HasMaxLength(50);
                    entity.Property(x => x.Standard).HasMaxLength(100);
                    entity.Property(x => x.ProtectionLevel).HasMaxLength(100);
                    entity.Property(x => x.Description).HasMaxLength(500);
                    entity.Property(x => x.Manufacturer).HasMaxLength(100);
                    entity.Property(x => x.Model).HasMaxLength(100);
                    entity.Property(x => x.IsActive).IsRequired();
                    entity.Property(x => x.CreatedAt).IsRequired();
                    entity.Property(x => x.UpdatedAt).IsRequired();
                });

                modelBuilder.Entity<EmployeePpe>(entity =>
                {
                    entity.HasKey(x => new { x.EmployeeId, x.PpeId });
                    entity.Property(x => x.AssignedDate).IsRequired();
                    entity.Property(x => x.ExpiryDate);
                    entity.Property(x => x.Size).HasMaxLength(50);
                    entity.Property(x => x.SerialNumber).HasMaxLength(100);
                    entity.Property(x => x.Notes).HasMaxLength(500);
                    entity.Property(x => x.IsReturned).IsRequired();
                    entity.Property(x => x.ReturnedDate);

                    entity.HasOne(x => x.Employee)
                        .WithMany(x => x.EmployeePpes)
                        .HasForeignKey(x => x.EmployeeId)
                        .OnDelete(DeleteBehavior.Cascade);

                    entity.HasOne(x => x.Ppe)
                        .WithMany(x => x.EmployeePpes)
                        .HasForeignKey(x => x.PpeId)
                        .OnDelete(DeleteBehavior.Cascade);
                });

                modelBuilder.Entity<JobRolePpe>(entity =>
                                {
                                    entity.HasKey(x => new { x.JobRoleId, x.PpeId });
                                    entity.Property(x => x.IsMandatory).IsRequired();
                                    entity.Property(x => x.Notes).HasMaxLength(500);

                                    entity.HasOne(x => x.JobRole)
                                        .WithMany(x => x.JobRolePpes)
                                        .HasForeignKey(x => x.JobRoleId)
                                        .OnDelete(DeleteBehavior.Cascade);

                                    entity.HasOne(x => x.Ppe)
                                        .WithMany(x => x.JobRolePpes)
                                        .HasForeignKey(x => x.PpeId)
                                        .OnDelete(DeleteBehavior.Cascade);
                                });

                                // Attachment configurations
                                modelBuilder.Entity<Attachment>(entity =>
                                {
                                    entity.HasKey(x => x.Id);
                                    entity.Property(x => x.Title).HasMaxLength(250).IsRequired();
                                    entity.Property(x => x.Category).HasMaxLength(100);
                                    entity.Property(x => x.Description).HasMaxLength(500);
                                    entity.Property(x => x.FileName).HasMaxLength(500).IsRequired();
                                    entity.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
                                    entity.Property(x => x.FileSize).IsRequired();
                                    entity.Property(x => x.StoragePath).HasMaxLength(500).IsRequired();
                                    entity.Property(x => x.Checksum).HasMaxLength(100);
                                    entity.Property(x => x.IsConfidential).IsRequired();
                                    entity.Property(x => x.IsArchived).IsRequired();
                                    entity.Property(x => x.UploadedAt).IsRequired();
                                    entity.Property(x => x.UploadedBy).HasMaxLength(120);
                                    entity.Property(x => x.ExpiresAt);

                                    entity.HasOne(x => x.Employee)
                                        .WithMany()
                                        .HasForeignKey(x => x.EmployeeId)
                                        .OnDelete(DeleteBehavior.SetNull);

                                    entity.HasOne(x => x.Company)
                                        .WithMany()
                                        .HasForeignKey(x => x.CompanyId)
                                        .OnDelete(DeleteBehavior.SetNull);

                                    entity.HasOne(x => x.MedicalVisit)
                                        .WithMany()
                                        .HasForeignKey(x => x.MedicalVisitId)
                                        .OnDelete(DeleteBehavior.SetNull);

                                    entity.HasOne(x => x.RiskFactor)
                                        .WithMany()
                                        .HasForeignKey(x => x.RiskFactorId)
                                        .OnDelete(DeleteBehavior.SetNull);

                                    entity.HasOne(x => x.SiteVisit)
                                        .WithMany()
                                        .HasForeignKey(x => x.SiteVisitId)
                                        .OnDelete(DeleteBehavior.SetNull);

                                    entity.HasIndex(x => x.EmployeeId);
                                                                        entity.HasIndex(x => x.CompanyId);
                                                                        entity.HasIndex(x => x.MedicalVisitId);
                                                                        entity.HasIndex(x => x.UploadedAt);
                                                                    });

                                                                    // Injury configurations
                                                                    modelBuilder.Entity<Injury>(entity =>
                                                                    {
                                                                        entity.HasKey(x => x.Id);
                                                                        entity.Property(x => x.EmployeeId).IsRequired();
                                                                        entity.Property(x => x.CompanyId).IsRequired();
                                                                        entity.Property(x => x.InjuryDate).IsRequired();
                                                                        entity.Property(x => x.ReportDate).IsRequired();
                                                                        entity.Property(x => x.InjuryType).HasMaxLength(50).IsRequired(); // "Lieve", "Grave", "Mortale", "In itinere"
                                                                        entity.Property(x => x.BodyPart).HasMaxLength(120).IsRequired();
                                                                        entity.Property(x => x.InjuryNature).HasMaxLength(120); // "Frattura", "Contusione", "Taglio", "Ustione", ecc.
                                                                        entity.Property(x => x.Cause).HasMaxLength(500).IsRequired();
                                                                        entity.Property(x => x.Location).HasMaxLength(250);
                                                                        entity.Property(x => x.Description).HasMaxLength(2000);
                                                                        entity.Property(x => x.DaysLost).IsRequired();
                                                                        entity.Property(x => x.IsReportedToInail).IsRequired();
                                                                        entity.Property(x => x.InailReportNumber).HasMaxLength(100);
                                                                        entity.Property(x => x.InailReportDate);
                                                                        entity.Property(x => x.Status).HasMaxLength(50).IsRequired(); // "Aperto", "In corso", "Chiuso", "Contestato"
                                                                        entity.Property(x => x.CreatedAt).IsRequired();
                                                                        entity.Property(x => x.UpdatedAt).IsRequired();
                                                                        entity.Property(x => x.CreatedBy).HasMaxLength(120).IsRequired();

                                                                        entity.HasOne(x => x.Employee)
                                                                            .WithMany()
                                                                            .HasForeignKey(x => x.EmployeeId)
                                                                            .OnDelete(DeleteBehavior.Cascade);

                                                                        entity.HasOne(x => x.Company)
                                                                            .WithMany()
                                                                            .HasForeignKey(x => x.CompanyId)
                                                                            .OnDelete(DeleteBehavior.Cascade);

                                                                        entity.HasIndex(x => x.EmployeeId);
                                                                        entity.HasIndex(x => x.CompanyId);
                                                                        entity.HasIndex(x => x.InjuryDate);
                                                                        entity.HasIndex(x => x.Status);
                                                                    });

                                                                    modelBuilder.Entity<InjuryAttachment>(entity =>
                                                                    {
                                                                        entity.HasKey(x => new { x.InjuryId, x.AttachmentId });

                                                                        entity.HasOne(x => x.Injury)
                                                                            .WithMany(x => x.InjuryAttachments)
                                                                            .HasForeignKey(x => x.InjuryId)
                                                                            .OnDelete(DeleteBehavior.Cascade);

                                                                        entity.HasOne(x => x.Attachment)
                                                                            .WithMany()
                                                                            .HasForeignKey(x => x.AttachmentId)
                                                                            .OnDelete(DeleteBehavior.Cascade);
                                                                    });

        // ===== GLOBAL QUERY FILTERS: scoping automatico per contesto (companyId/siteId dai claim JWT) =====
        // Se i claim sono assenti (es. admin senza contesto, seeder, job) i filtri sono no-op.
        modelBuilder.Entity<Company>().HasQueryFilter(x =>
            CurrentCompanyId == null || x.Id == CurrentCompanyId);

        modelBuilder.Entity<Branch>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.Id == CurrentSiteId));

        modelBuilder.Entity<Employee>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.BranchId == CurrentSiteId));

        modelBuilder.Entity<CompanyContact>().HasQueryFilter(x =>
            CurrentCompanyId == null || x.CompanyId == CurrentCompanyId);

        modelBuilder.Entity<Department>().HasQueryFilter(x =>
            CurrentCompanyId == null || x.CompanyId == CurrentCompanyId);

        modelBuilder.Entity<WorkLocation>().HasQueryFilter(x =>
            CurrentCompanyId == null || x.CompanyId == CurrentCompanyId);

        // Entità figlie di Employee: ereditano lo scope via navigazione
        modelBuilder.Entity<EmployeeRisk>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.Employee!.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.Employee!.BranchId == CurrentSiteId));

        modelBuilder.Entity<MedicalRecord>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.Employee!.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.Employee!.BranchId == CurrentSiteId));

        modelBuilder.Entity<MedicalVisit>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.Employee!.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.Employee!.BranchId == CurrentSiteId));

        modelBuilder.Entity<VisitExam>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.MedicalVisit!.Employee!.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.MedicalVisit!.Employee!.BranchId == CurrentSiteId));

        modelBuilder.Entity<Anamnesis>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.MedicalVisit!.Employee!.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.MedicalVisit!.Employee!.BranchId == CurrentSiteId));

        modelBuilder.Entity<PersonalProtocol>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.Employee!.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.Employee!.BranchId == CurrentSiteId));

        modelBuilder.Entity<ScheduledExam>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.Employee!.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.Employee!.BranchId == CurrentSiteId));

        modelBuilder.Entity<Vaccination>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.Employee!.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.Employee!.BranchId == CurrentSiteId));

        modelBuilder.Entity<NotificationLog>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.Employee!.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.Employee!.BranchId == CurrentSiteId));

        modelBuilder.Entity<EmployeePpe>().HasQueryFilter(x =>
            (CurrentCompanyId == null || x.Employee!.CompanyId == CurrentCompanyId) &&
            (CurrentSiteId == null || x.Employee!.BranchId == CurrentSiteId));

        modelBuilder.Entity<Injury>().HasQueryFilter(x =>
            CurrentCompanyId == null || x.CompanyId == CurrentCompanyId);

        modelBuilder.Entity<InjuryAttachment>().HasQueryFilter(x =>
            CurrentCompanyId == null || x.Injury!.CompanyId == CurrentCompanyId);

        modelBuilder.Entity<Attachment>().HasQueryFilter(x =>
            CurrentCompanyId == null || x.CompanyId == null || x.CompanyId == CurrentCompanyId);
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
