C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1608: Detected package version outside of dependency constraint: Microsoft.CodeAnalysis.Workspaces.MSBuild 5.0.0 requires Microsoft.CodeAnalysis.Workspaces.Common (= 5.0.0) but version Microsoft.CodeAnalysis.Workspaces.Common 5.6.0 was resolved.
C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1904: Package 'System.Drawing.Common' 4.7.0 has a known critical severity vulnerability, https://github.com/advisories/GHSA-rxg9-xrhp-64gj
C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1608: Detected package version outside of dependency constraint: Microsoft.CodeAnalysis.Workspaces.MSBuild 5.0.0 requires Microsoft.CodeAnalysis.Workspaces.Common (= 5.0.0) but version Microsoft.CodeAnalysis.Workspaces.Common 5.6.0 was resolved.
C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1904: Package 'System.Drawing.Common' 4.7.0 has a known critical severity vulnerability, https://github.com/advisories/GHSA-rxg9-xrhp-64gj
Build started...
Build succeeded.
IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Permissions] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(200) NULL,
        [Category] nvarchar(50) NULL,
        [IsSystem] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Permissions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Tenants] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Slug] nvarchar(50) NOT NULL,
        [Description] nvarchar(500) NULL,
        [LogoUrl] nvarchar(200) NULL,
        [PrimaryColor] nvarchar(200) NULL,
        [SecondaryColor] nvarchar(200) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Tenants] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [CompanyGroups] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [LegalName] nvarchar(200) NULL,
        [Address] nvarchar(250) NULL,
        [City] nvarchar(100) NULL,
        [PostalCode] nvarchar(10) NULL,
        [Province] nvarchar(100) NULL,
        [VATNumber] nvarchar(max) NULL,
        [TaxCode] nvarchar(16) NULL,
        [SingleArchive] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_CompanyGroups] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CompanyGroups_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Doctors] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [FirstName] nvarchar(120) NOT NULL,
        [LastName] nvarchar(120) NOT NULL,
        [MedicalLicenseNumber] nvarchar(50) NOT NULL,
        [Specialty] nvarchar(120) NULL,
        [LicenseAuthority] nvarchar(100) NULL,
        [Email] nvarchar(150) NULL,
        [PEC] nvarchar(150) NULL,
        [Phone] nvarchar(30) NULL,
        [SignatureImageUrl] nvarchar(200) NULL,
        [DigitalCertificateThumbprint] nvarchar(200) NULL,
        [DigitalCertificateExpiry] datetime2 NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [TenantId1] int NULL,
        CONSTRAINT [PK_Doctors] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Doctors_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]),
        CONSTRAINT [FK_Doctors_Tenants_TenantId1] FOREIGN KEY ([TenantId1]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [ExamTypes] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Name] nvarchar(120) NOT NULL,
        [Category] nvarchar(120) NULL,
        [Description] nvarchar(500) NULL,
        [Unit] nvarchar(100) NULL,
        [ReferenceRange] nvarchar(300) NULL,
        [LOINCCode] nvarchar(50) NULL,
        [RequiresNumericResult] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_ExamTypes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ExamTypes_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [JobRoles] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Name] nvarchar(120) NOT NULL,
        [Description] nvarchar(500) NULL,
        [ISCOCode] nvarchar(50) NULL,
        [RiskCategory] nvarchar(100) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_JobRoles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_JobRoles_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Questionnaires] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Type] nvarchar(50) NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [RiskFactor] nvarchar(100) NULL,
        [DefinitionJson] nvarchar(max) NOT NULL,
        [AnomalyThreshold] int NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Questionnaires] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Questionnaires_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [RiskFactors] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Name] nvarchar(120) NOT NULL,
        [Description] nvarchar(500) NOT NULL,
        [SeverityLevel] int NOT NULL,
        [Allegato3BCategory] nvarchar(120) NULL,
        [ICD10Code] nvarchar(50) NULL,
        [INAILCode] nvarchar(50) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_RiskFactors] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RiskFactors_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [RiskLevels] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Name] nvarchar(50) NOT NULL,
        [Description] nvarchar(200) NULL,
        [Color] nvarchar(20) NULL,
        [SortOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RiskLevels] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RiskLevels_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Roles] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Name] nvarchar(50) NOT NULL,
        [Description] nvarchar(200) NULL,
        [IsSystem] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Roles_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [TenantSettings] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Key] nvarchar(100) NOT NULL,
        [Value] nvarchar(4000) NULL,
        [Description] nvarchar(500) NULL,
        CONSTRAINT [PK_TenantSettings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TenantSettings_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Email] nvarchar(150) NOT NULL,
        [PasswordHash] nvarchar(256) NULL,
        [FirstName] nvarchar(120) NOT NULL,
        [LastName] nvarchar(120) NOT NULL,
        [Role] nvarchar(50) NULL,
        [ExternalId] nvarchar(100) NULL,
        [ExternalProvider] nvarchar(50) NULL,
        [IsActive] bit NOT NULL,
        [EmailConfirmed] bit NOT NULL,
        [LastLoginAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Users_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Companies] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [LegalName] nvarchar(100) NULL,
        [VATNumber] nvarchar(30) NULL,
        [TaxCode] nvarchar(16) NULL,
        [ATECOCode] nvarchar(10) NULL,
        [REANumber] nvarchar(50) NULL,
        [ContactEmail] nvarchar(150) NULL,
        [PEC] nvarchar(150) NULL,
        [ContactPhone] nvarchar(30) NULL,
        [Fax] nvarchar(30) NULL,
        [LegalAddress] nvarchar(500) NULL,
        [OperationalAddress] nvarchar(500) NULL,
        [LegalRepresentative] nvarchar(120) NULL,
        [RSPP] nvarchar(150) NULL,
        [RLS] nvarchar(150) NULL,
        [RiskClass] nvarchar(100) NULL,
        [INAILPosition] nvarchar(100) NULL,
        [INAILPolicyNumber] nvarchar(100) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CompanyGroupId] int NULL,
        [TenantId1] int NULL,
        CONSTRAINT [PK_Companies] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Companies_CompanyGroups_CompanyGroupId] FOREIGN KEY ([CompanyGroupId]) REFERENCES [CompanyGroups] ([Id]),
        CONSTRAINT [FK_Companies_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]),
        CONSTRAINT [FK_Companies_Tenants_TenantId1] FOREIGN KEY ([TenantId1]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [DoctorAvailabilities] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [DoctorId] int NOT NULL,
        [DayOfWeek] int NOT NULL,
        [StartTime] time NOT NULL,
        [EndTime] time NOT NULL,
        [Location] nvarchar(100) NULL,
        [IsRecurring] bit NOT NULL,
        [ValidFrom] datetime2 NULL,
        [ValidTo] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_DoctorAvailabilities] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DoctorAvailabilities_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([Id]),
        CONSTRAINT [FK_DoctorAvailabilities_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [PhraseTemplates] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Category] nvarchar(50) NOT NULL,
        [Text] nvarchar(1000) NOT NULL,
        [Tags] nvarchar(250) NULL,
        [DoctorId] int NULL,
        [IsFavourite] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_PhraseTemplates] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PhraseTemplates_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([Id]),
        CONSTRAINT [FK_PhraseTemplates_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Protocols] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Name] nvarchar(160) NOT NULL,
        [Description] nvarchar(500) NULL,
        [LawReference] nvarchar(30) NOT NULL,
        [CadenceDays] int NOT NULL,
        [Objective] nvarchar(1000) NULL,
        [RulesJson] nvarchar(4000) NULL,
        [JobRoleId] int NULL,
        [IsTemplate] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [Version] int NOT NULL,
        [ParentProtocolId] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Protocols] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Protocols_JobRoles_JobRoleId] FOREIGN KEY ([JobRoleId]) REFERENCES [JobRoles] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_Protocols_Protocols_ParentProtocolId] FOREIGN KEY ([ParentProtocolId]) REFERENCES [Protocols] ([Id]),
        CONSTRAINT [FK_Protocols_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [JobRoleRiskFactors] (
        [JobRoleId] int NOT NULL,
        [RiskFactorId] int NOT NULL,
        [Id] int NOT NULL,
        [TenantId] int NOT NULL,
        [SeverityLevel] int NOT NULL,
        [Notes] nvarchar(500) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_JobRoleRiskFactors] PRIMARY KEY ([JobRoleId], [RiskFactorId]),
        CONSTRAINT [FK_JobRoleRiskFactors_JobRoles_JobRoleId] FOREIGN KEY ([JobRoleId]) REFERENCES [JobRoles] ([Id]),
        CONSTRAINT [FK_JobRoleRiskFactors_RiskFactors_RiskFactorId] FOREIGN KEY ([RiskFactorId]) REFERENCES [RiskFactors] ([Id]),
        CONSTRAINT [FK_JobRoleRiskFactors_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [RolePermissions] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] int NOT NULL,
        [PermissionId] int NOT NULL,
        [AssignedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RolePermissions_Permissions_PermissionId] FOREIGN KEY ([PermissionId]) REFERENCES [Permissions] ([Id]),
        CONSTRAINT [FK_RolePermissions_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [UserPermissions] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [PermissionId] int NOT NULL,
        [IsGranted] bit NOT NULL,
        [AssignedAt] datetime2 NOT NULL,
        [AssignedByUserId] int NULL,
        CONSTRAINT [PK_UserPermissions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UserPermissions_Permissions_PermissionId] FOREIGN KEY ([PermissionId]) REFERENCES [Permissions] ([Id]),
        CONSTRAINT [FK_UserPermissions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [UserRoles] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [RoleId] int NOT NULL,
        [AssignedAt] datetime2 NOT NULL,
        [AssignedByUserId] int NULL,
        CONSTRAINT [PK_UserRoles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]),
        CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Branches] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Address] nvarchar(250) NOT NULL,
        [City] nvarchar(100) NOT NULL,
        [Province] nvarchar(100) NULL,
        [PostalCode] nvarchar(10) NULL,
        [Name] nvarchar(100) NULL,
        [Notes] nvarchar(500) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Branches] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Branches_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]),
        CONSTRAINT [FK_Branches_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [CompanyContacts] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Role] nvarchar(50) NOT NULL,
        [FullName] nvarchar(120) NOT NULL,
        [Email] nvarchar(150) NULL,
        [Phone] nvarchar(30) NULL,
        [Qualification] nvarchar(100) NULL,
        [AppointmentDate] datetime2 NULL,
        [ExpiryDate] datetime2 NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_CompanyContacts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CompanyContacts_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]),
        CONSTRAINT [FK_CompanyContacts_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [CompanyDoctors] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [DoctorId] int NOT NULL,
        [IsCoordinator] bit NOT NULL,
        [AssignedAt] datetime2 NULL,
        [ExpiresAt] datetime2 NULL,
        [IsActive] bit NOT NULL,
        [CompanyId1] int NULL,
        [DoctorId1] int NULL,
        CONSTRAINT [PK_CompanyDoctors] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CompanyDoctors_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]),
        CONSTRAINT [FK_CompanyDoctors_Companies_CompanyId1] FOREIGN KEY ([CompanyId1]) REFERENCES [Companies] ([Id]),
        CONSTRAINT [FK_CompanyDoctors_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([Id]),
        CONSTRAINT [FK_CompanyDoctors_Doctors_DoctorId1] FOREIGN KEY ([DoctorId1]) REFERENCES [Doctors] ([Id]),
        CONSTRAINT [FK_CompanyDoctors_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Departments] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Name] nvarchar(120) NOT NULL,
        [Manager] nvarchar(120) NULL,
        [ManagerEmail] nvarchar(150) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Departments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Departments_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]),
        CONSTRAINT [FK_Departments_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [WorkLocations] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Address] nvarchar(250) NULL,
        [City] nvarchar(100) NULL,
        [Province] nvarchar(100) NULL,
        [PostalCode] nvarchar(10) NULL,
        [Notes] nvarchar(500) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_WorkLocations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_WorkLocations_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]),
        CONSTRAINT [FK_WorkLocations_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [ProtocolSteps] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [ProtocolId] int NOT NULL,
        [Name] nvarchar(120) NOT NULL,
        [Description] nvarchar(500) NULL,
        [StepType] nvarchar(50) NOT NULL,
        [SortOrder] int NOT NULL,
        [ConfigurationJson] nvarchar(4000) NULL,
        [IsRequired] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_ProtocolSteps] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProtocolSteps_Protocols_ProtocolId] FOREIGN KEY ([ProtocolId]) REFERENCES [Protocols] ([Id]),
        CONSTRAINT [FK_ProtocolSteps_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Employees] (
        [Id] int NOT NULL IDENTITY,
        [ExternalId] nvarchar(100) NULL,
        [TenantId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [BranchId] int NOT NULL,
        [DepartmentId] int NULL,
        [WorkLocationId] int NULL,
        [FirstName] nvarchar(120) NOT NULL,
        [LastName] nvarchar(120) NOT NULL,
        [TaxCode] nvarchar(32) NOT NULL,
        [JobRole] nvarchar(120) NOT NULL,
        [BirthDate] datetime2 NOT NULL,
        [Gender] nvarchar(1) NOT NULL,
        [BirthCity] nvarchar(120) NOT NULL,
        [BirthCityCode] nvarchar(4) NOT NULL,
        [BirthProvince] nvarchar(120) NULL,
        [BirthCountryCode] nvarchar(2) NULL,
        [PersonalEmail] nvarchar(150) NULL,
        [PhoneNumber] nvarchar(30) NULL,
        [Address] nvarchar(500) NULL,
        [City] nvarchar(120) NULL,
        [Province] nvarchar(100) NULL,
        [PostalCode] nvarchar(10) NULL,
        [Nationality] nvarchar(50) NULL,
        [EducationLevel] nvarchar(100) NULL,
        [HireDate] datetime2 NOT NULL,
        [TerminationDate] datetime2 NULL,
        [ContractType] nvarchar(50) NULL,
        [Qualification] nvarchar(100) NULL,
        [JobRoleId] int NULL,
        [RiskLevelId] int NULL,
        [IsActive] bit NOT NULL,
        [ConsentGDPR] bit NOT NULL,
        [ConsentGDPRDate] datetime2 NULL,
        [ConsentHealthData] bit NOT NULL,
        [ConsentHealthDataDate] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Employees] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Employees_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Employees_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Employees_Departments_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [Departments] ([Id]),
        CONSTRAINT [FK_Employees_JobRoles_JobRoleId] FOREIGN KEY ([JobRoleId]) REFERENCES [JobRoles] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_Employees_RiskLevels_RiskLevelId] FOREIGN KEY ([RiskLevelId]) REFERENCES [RiskLevels] ([Id]),
        CONSTRAINT [FK_Employees_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]),
        CONSTRAINT [FK_Employees_WorkLocations_WorkLocationId] FOREIGN KEY ([WorkLocationId]) REFERENCES [WorkLocations] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [SiteVisits] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [WorkLocationId] int NULL,
        [VisitedStructure] nvarchar(200) NOT NULL,
        [Location] nvarchar(250) NULL,
        [DoctorId] int NULL,
        [DoctorName] nvarchar(120) NULL,
        [VisitDate] datetime2 NOT NULL,
        [Frequency] nvarchar(100) NULL,
        [NextDueDate] datetime2 NULL,
        [Notes] nvarchar(4000) NULL,
        [Outcome] nvarchar(50) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_SiteVisits] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SiteVisits_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]),
        CONSTRAINT [FK_SiteVisits_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([Id]),
        CONSTRAINT [FK_SiteVisits_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]),
        CONSTRAINT [FK_SiteVisits_WorkLocations_WorkLocationId] FOREIGN KEY ([WorkLocationId]) REFERENCES [WorkLocations] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [EmployeeRisks] (
        [EmployeeId] int NOT NULL,
        [RiskFactorId] int NOT NULL,
        [Id] int NOT NULL,
        [TenantId] int NOT NULL,
        [AssignedAt] datetime2 NOT NULL,
        [RemovedAt] datetime2 NULL,
        [Notes] nvarchar(500) NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_EmployeeRisks] PRIMARY KEY ([EmployeeId], [RiskFactorId]),
        CONSTRAINT [FK_EmployeeRisks_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]),
        CONSTRAINT [FK_EmployeeRisks_RiskFactors_RiskFactorId] FOREIGN KEY ([RiskFactorId]) REFERENCES [RiskFactors] ([Id]),
        CONSTRAINT [FK_EmployeeRisks_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [MedicalRecords] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [EmployeeId] int NOT NULL,
        [MedicalHistory] nvarchar(4000) NOT NULL,
        [Notes] nvarchar(2000) NULL,
        [CurrentTherapies] nvarchar(2000) NULL,
        [Allergies] nvarchar(2000) NULL,
        [FamilyHistory] nvarchar(2000) NULL,
        [Status] nvarchar(30) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_MedicalRecords] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MedicalRecords_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]),
        CONSTRAINT [FK_MedicalRecords_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [NotificationLogs] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [EmployeeId] int NOT NULL,
        [Channel] nvarchar(20) NOT NULL,
        [SentDate] datetime2 NOT NULL,
        [MessageText] nvarchar(2000) NOT NULL,
        [IsDelivered] bit NOT NULL,
        [DeliveredAt] datetime2 NULL,
        [ErrorMessage] nvarchar(500) NULL,
        [RetryCount] int NOT NULL,
        CONSTRAINT [PK_NotificationLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_NotificationLogs_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]),
        CONSTRAINT [FK_NotificationLogs_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [PersonalProtocols] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [EmployeeId] int NOT NULL,
        [ProtocolId] int NOT NULL,
        [AssignedAt] datetime2 NOT NULL,
        [ExpiresAt] datetime2 NULL,
        [IsOverride] bit NOT NULL,
        [Notes] nvarchar(1000) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_PersonalProtocols] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PersonalProtocols_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]),
        CONSTRAINT [FK_PersonalProtocols_Protocols_ProtocolId] FOREIGN KEY ([ProtocolId]) REFERENCES [Protocols] ([Id]),
        CONSTRAINT [FK_PersonalProtocols_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [ScheduledExams] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [EmployeeId] int NOT NULL,
        [ExamTypeId] int NOT NULL,
        [DueDate] datetime2 NOT NULL,
        [CompletedDate] datetime2 NULL,
        [Status] nvarchar(30) NOT NULL,
        [Notes] nvarchar(500) NULL,
        [Result] nvarchar(300) NULL,
        [PrescribedBy] nvarchar(200) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [ExamTypeId1] int NULL,
        CONSTRAINT [PK_ScheduledExams] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ScheduledExams_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]),
        CONSTRAINT [FK_ScheduledExams_ExamTypes_ExamTypeId] FOREIGN KEY ([ExamTypeId]) REFERENCES [ExamTypes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ScheduledExams_ExamTypes_ExamTypeId1] FOREIGN KEY ([ExamTypeId1]) REFERENCES [ExamTypes] ([Id]),
        CONSTRAINT [FK_ScheduledExams_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Vaccinations] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [EmployeeId] int NOT NULL,
        [VaccineName] nvarchar(150) NOT NULL,
        [Manufacturer] nvarchar(100) NULL,
        [BatchNumber] nvarchar(50) NULL,
        [DateAdministered] datetime2 NOT NULL,
        [NextDueDate] datetime2 NULL,
        [AdministeredBy] nvarchar(200) NULL,
        [Notes] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Vaccinations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Vaccinations_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]),
        CONSTRAINT [FK_Vaccinations_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [MedicalVisits] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [EmployeeId] int NOT NULL,
        [DoctorId] int NOT NULL,
        [PersonalProtocolId] int NULL,
        [VisitDate] datetime2 NOT NULL,
        [NextDeadlineDate] datetime2 NOT NULL,
        [Outcome] nvarchar(250) NOT NULL,
        [OutcomeCode] nvarchar(50) NULL,
        [ClinicalNotes] nvarchar(4000) NULL,
        [OcrData] nvarchar(max) NULL,
        [VoiceNoteUrl] nvarchar(500) NULL,
        [VisitType] nvarchar(40) NOT NULL,
        [TargetOrgans] nvarchar(2000) NULL,
        [ObjectiveExam] nvarchar(4000) NULL,
        [BloodPressure] nvarchar(100) NULL,
        [HeartRate] nvarchar(50) NULL,
        [Temperature] nvarchar(50) NULL,
        [SpO2] nvarchar(50) NULL,
        [BMI] nvarchar(100) NULL,
        [IsSigned] bit NOT NULL,
        [SignedAt] datetime2 NULL,
        [SignatureImageUrl] nvarchar(200) NULL,
        [DigitalCertificateThumbprint] nvarchar(200) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_MedicalVisits] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MedicalVisits_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_MedicalVisits_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]),
        CONSTRAINT [FK_MedicalVisits_PersonalProtocols_PersonalProtocolId] FOREIGN KEY ([PersonalProtocolId]) REFERENCES [PersonalProtocols] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_MedicalVisits_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [Anamneses] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [MedicalVisitId] int NOT NULL,
        [WorkHistory] nvarchar(4000) NULL,
        [PersonalHistory] nvarchar(4000) NULL,
        [FamilyHistory] nvarchar(4000) NULL,
        [RemotePathology] nvarchar(4000) NULL,
        [RecentPathology] nvarchar(4000) NULL,
        [LifestyleHabits] nvarchar(4000) NULL,
        [OccupationalExposures] nvarchar(4000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Anamneses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Anamneses_MedicalVisits_MedicalVisitId] FOREIGN KEY ([MedicalVisitId]) REFERENCES [MedicalVisits] ([Id]),
        CONSTRAINT [FK_Anamneses_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [QuestionnaireResponses] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [QuestionnaireId] int NOT NULL,
        [EmployeeId] int NOT NULL,
        [MedicalVisitId] int NOT NULL,
        [AnswersJson] nvarchar(max) NOT NULL,
        [Score] int NOT NULL,
        [IsAnomalous] bit NOT NULL,
        [CompletedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_QuestionnaireResponses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_QuestionnaireResponses_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]),
        CONSTRAINT [FK_QuestionnaireResponses_MedicalVisits_MedicalVisitId] FOREIGN KEY ([MedicalVisitId]) REFERENCES [MedicalVisits] ([Id]),
        CONSTRAINT [FK_QuestionnaireResponses_Questionnaires_QuestionnaireId] FOREIGN KEY ([QuestionnaireId]) REFERENCES [Questionnaires] ([Id]),
        CONSTRAINT [FK_QuestionnaireResponses_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE TABLE [VisitExams] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [MedicalVisitId] int NOT NULL,
        [ExamTypeId] int NOT NULL,
        [Result] nvarchar(3000) NOT NULL,
        [Notes] nvarchar(2000) NULL,
        [ReferenceRange] nvarchar(300) NULL,
        [IsAbnormal] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_VisitExams] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_VisitExams_ExamTypes_ExamTypeId] FOREIGN KEY ([ExamTypeId]) REFERENCES [ExamTypes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_VisitExams_MedicalVisits_MedicalVisitId] FOREIGN KEY ([MedicalVisitId]) REFERENCES [MedicalVisits] ([Id]),
        CONSTRAINT [FK_VisitExams_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Anamneses_MedicalVisitId] ON [Anamneses] ([MedicalVisitId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Anamneses_TenantId] ON [Anamneses] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Branches_CompanyId] ON [Branches] ([CompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Branches_TenantId] ON [Branches] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Companies_CompanyGroupId] ON [Companies] ([CompanyGroupId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Companies_TenantId] ON [Companies] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Companies_TenantId1] ON [Companies] ([TenantId1]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Companies_VATNumber] ON [Companies] ([VATNumber]) WHERE [VATNumber] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CompanyContacts_CompanyId] ON [CompanyContacts] ([CompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CompanyContacts_TenantId] ON [CompanyContacts] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CompanyDoctors_CompanyId_DoctorId] ON [CompanyDoctors] ([CompanyId], [DoctorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CompanyDoctors_CompanyId1] ON [CompanyDoctors] ([CompanyId1]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CompanyDoctors_DoctorId] ON [CompanyDoctors] ([DoctorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CompanyDoctors_DoctorId1] ON [CompanyDoctors] ([DoctorId1]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CompanyDoctors_TenantId] ON [CompanyDoctors] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CompanyGroups_TenantId] ON [CompanyGroups] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Departments_CompanyId] ON [Departments] ([CompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Departments_TenantId] ON [Departments] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DoctorAvailabilities_DoctorId] ON [DoctorAvailabilities] ([DoctorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DoctorAvailabilities_TenantId] ON [DoctorAvailabilities] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Doctors_MedicalLicenseNumber] ON [Doctors] ([MedicalLicenseNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Doctors_TenantId] ON [Doctors] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Doctors_TenantId1] ON [Doctors] ([TenantId1]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_EmployeeRisks_RiskFactorId] ON [EmployeeRisks] ([RiskFactorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_EmployeeRisks_TenantId] ON [EmployeeRisks] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Employees_BranchId] ON [Employees] ([BranchId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Employees_CompanyId] ON [Employees] ([CompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Employees_DepartmentId] ON [Employees] ([DepartmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Employees_JobRoleId] ON [Employees] ([JobRoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Employees_RiskLevelId] ON [Employees] ([RiskLevelId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Employees_TaxCode] ON [Employees] ([TaxCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Employees_TenantId] ON [Employees] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Employees_WorkLocationId] ON [Employees] ([WorkLocationId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ExamTypes_TenantId] ON [ExamTypes] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_JobRoleRiskFactors_RiskFactorId] ON [JobRoleRiskFactors] ([RiskFactorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_JobRoleRiskFactors_TenantId] ON [JobRoleRiskFactors] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_JobRoles_Name] ON [JobRoles] ([Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_JobRoles_TenantId] ON [JobRoles] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MedicalRecords_EmployeeId] ON [MedicalRecords] ([EmployeeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MedicalRecords_TenantId] ON [MedicalRecords] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MedicalVisits_DoctorId] ON [MedicalVisits] ([DoctorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MedicalVisits_EmployeeId] ON [MedicalVisits] ([EmployeeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MedicalVisits_PersonalProtocolId] ON [MedicalVisits] ([PersonalProtocolId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MedicalVisits_TenantId] ON [MedicalVisits] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_NotificationLogs_EmployeeId] ON [NotificationLogs] ([EmployeeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_NotificationLogs_TenantId] ON [NotificationLogs] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Permissions_Name] ON [Permissions] ([Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PersonalProtocols_EmployeeId_ProtocolId] ON [PersonalProtocols] ([EmployeeId], [ProtocolId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PersonalProtocols_ProtocolId] ON [PersonalProtocols] ([ProtocolId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PersonalProtocols_TenantId] ON [PersonalProtocols] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PhraseTemplates_DoctorId] ON [PhraseTemplates] ([DoctorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PhraseTemplates_TenantId] ON [PhraseTemplates] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Protocols_JobRoleId] ON [Protocols] ([JobRoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Protocols_ParentProtocolId] ON [Protocols] ([ParentProtocolId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Protocols_TenantId] ON [Protocols] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ProtocolSteps_ProtocolId] ON [ProtocolSteps] ([ProtocolId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ProtocolSteps_TenantId] ON [ProtocolSteps] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuestionnaireResponses_EmployeeId] ON [QuestionnaireResponses] ([EmployeeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuestionnaireResponses_MedicalVisitId] ON [QuestionnaireResponses] ([MedicalVisitId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuestionnaireResponses_QuestionnaireId] ON [QuestionnaireResponses] ([QuestionnaireId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuestionnaireResponses_TenantId] ON [QuestionnaireResponses] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Questionnaires_TenantId] ON [Questionnaires] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RiskFactors_TenantId] ON [RiskFactors] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RiskLevels_TenantId] ON [RiskLevels] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RolePermissions_PermissionId] ON [RolePermissions] ([PermissionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RolePermissions_RoleId_PermissionId] ON [RolePermissions] ([RoleId], [PermissionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Roles_TenantId] ON [Roles] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ScheduledExams_EmployeeId] ON [ScheduledExams] ([EmployeeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ScheduledExams_ExamTypeId] ON [ScheduledExams] ([ExamTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ScheduledExams_ExamTypeId1] ON [ScheduledExams] ([ExamTypeId1]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ScheduledExams_TenantId] ON [ScheduledExams] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SiteVisits_CompanyId] ON [SiteVisits] ([CompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SiteVisits_DoctorId] ON [SiteVisits] ([DoctorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SiteVisits_TenantId] ON [SiteVisits] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SiteVisits_WorkLocationId] ON [SiteVisits] ([WorkLocationId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Tenants_Slug] ON [Tenants] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TenantSettings_TenantId_Key] ON [TenantSettings] ([TenantId], [Key]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_UserPermissions_PermissionId] ON [UserPermissions] ([PermissionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_UserPermissions_UserId_PermissionId] ON [UserPermissions] ([UserId], [PermissionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_UserRoles_UserId_RoleId] ON [UserRoles] ([UserId], [RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_TenantId_Email] ON [Users] ([TenantId], [Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Vaccinations_EmployeeId] ON [Vaccinations] ([EmployeeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Vaccinations_TenantId] ON [Vaccinations] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_VisitExams_ExamTypeId] ON [VisitExams] ([ExamTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_VisitExams_MedicalVisitId] ON [VisitExams] ([MedicalVisitId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_VisitExams_TenantId] ON [VisitExams] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_WorkLocations_CompanyId] ON [WorkLocations] ([CompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_WorkLocations_TenantId] ON [WorkLocations] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813110638_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260813110638_InitialCreate', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260827211131_AddNotificationLogEmailColumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260827211131_AddNotificationLogEmailColumn', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260827212707_AddProtocolStepsColumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260827212707_AddProtocolStepsColumn', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828082921_AddProtocolStepsAndModelFixes'
)
BEGIN
    DECLARE @var nvarchar(max);
    SELECT @var = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[NotificationLogs]') AND [c].[name] = N'EmployeeId');
    IF @var IS NOT NULL EXEC(N'ALTER TABLE [NotificationLogs] DROP CONSTRAINT ' + @var + ';');
    ALTER TABLE [NotificationLogs] ALTER COLUMN [EmployeeId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828082921_AddProtocolStepsAndModelFixes'
)
BEGIN
    ALTER TABLE [NotificationLogs] ADD [Email] nvarchar(150) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828082921_AddProtocolStepsAndModelFixes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260828082921_AddProtocolStepsAndModelFixes', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829204704_AddBilling'
)
BEGIN
    CREATE TABLE [BillingDocuments] (
        [Id] int NOT NULL IDENTITY(1, 1000),
        [TenantId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Period] nvarchar(30) NOT NULL,
        [InvoiceNumber] nvarchar(50) NOT NULL,
        [VisitCount] int NOT NULL,
        [Amount] decimal(10,2) NOT NULL,
        [Status] nvarchar(30) NOT NULL DEFAULT N'emesso',
        [IssuedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [GeneratedById] nvarchar(120) NULL,
        CONSTRAINT [PK_BillingDocuments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_BillingDocuments_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_BillingDocuments_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829204704_AddBilling'
)
BEGIN
    CREATE UNIQUE INDEX [IX_BillingDocuments_TenantId_InvoiceNumber] ON [BillingDocuments] ([TenantId], [InvoiceNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829204704_AddBilling'
)
BEGIN
    CREATE INDEX [IX_BillingDocuments_TenantId_CompanyId_Period] ON [BillingDocuments] ([TenantId], [CompanyId], [Period]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829204704_AddBilling'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260829204704_AddBilling', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829211004_AddAuditEvents'
)
BEGIN
    ALTER TABLE [Employees] ADD [IsArchived] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829211004_AddAuditEvents'
)
BEGIN
    CREATE TABLE [AuditEvents] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [UserName] nvarchar(120) NULL,
        [Module] nvarchar(80) NOT NULL,
        [Action] nvarchar(80) NOT NULL,
        [Detail] nvarchar(1000) NULL,
        [Timestamp] datetime2 NOT NULL,
        [IpAddress] nvarchar(45) NULL,
        CONSTRAINT [PK_AuditEvents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AuditEvents_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829211004_AddAuditEvents'
)
BEGIN
    CREATE TABLE [BillingDocuments] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Period] nvarchar(30) NOT NULL,
        [InvoiceNumber] nvarchar(50) NOT NULL,
        [VisitCount] int NOT NULL,
        [Amount] decimal(10,2) NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [IssuedAt] datetime2 NOT NULL,
        [GeneratedById] nvarchar(120) NULL,
        CONSTRAINT [PK_BillingDocuments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_BillingDocuments_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_BillingDocuments_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829211004_AddAuditEvents'
)
BEGIN
    CREATE TABLE [Signatures] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [Signer] nvarchar(200) NOT NULL,
        [Hash] nvarchar(128) NOT NULL,
        [DocumentId] nvarchar(200) NULL,
        [Timestamp] datetime2 NOT NULL,
        CONSTRAINT [PK_Signatures] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Signatures_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829211004_AddAuditEvents'
)
BEGIN
    CREATE INDEX [IX_AuditEvents_TenantId_Timestamp] ON [AuditEvents] ([TenantId], [Timestamp]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829211004_AddAuditEvents'
)
BEGIN
    CREATE INDEX [IX_BillingDocuments_CompanyId] ON [BillingDocuments] ([CompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829211004_AddAuditEvents'
)
BEGIN
    CREATE INDEX [IX_BillingDocuments_TenantId_CompanyId_Period] ON [BillingDocuments] ([TenantId], [CompanyId], [Period]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829211004_AddAuditEvents'
)
BEGIN
    CREATE UNIQUE INDEX [IX_BillingDocuments_TenantId_InvoiceNumber] ON [BillingDocuments] ([TenantId], [InvoiceNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829211004_AddAuditEvents'
)
BEGIN
    CREATE INDEX [IX_Signatures_TenantId] ON [Signatures] ([TenantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829211004_AddAuditEvents'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260829211004_AddAuditEvents', N'10.0.10');
END;

COMMIT;
GO


