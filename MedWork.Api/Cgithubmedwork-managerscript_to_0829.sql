C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1608: Detected package version outside of dependency constraint: Microsoft.CodeAnalysis.Workspaces.MSBuild 5.0.0 requires Microsoft.CodeAnalysis.Workspaces.Common (= 5.0.0) but version Microsoft.CodeAnalysis.Workspaces.Common 5.6.0 was resolved.
C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1904: Package 'System.Drawing.Common' 4.7.0 has a known critical severity vulnerability, https://github.com/advisories/GHSA-rxg9-xrhp-64gj
C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1608: Detected package version outside of dependency constraint: Microsoft.CodeAnalysis.Workspaces.MSBuild 5.0.0 requires Microsoft.CodeAnalysis.Workspaces.Common (= 5.0.0) but version Microsoft.CodeAnalysis.Workspaces.Common 5.6.0 was resolved.
C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1904: Package 'System.Drawing.Common' 4.7.0 has a known critical severity vulnerability, https://github.com/advisories/GHSA-rxg9-xrhp-64gj
Build started...
Build succeeded.
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


