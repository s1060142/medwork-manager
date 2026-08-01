using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class CleanupAndNewEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Channel",
                table: "NotificationLogs",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<string>(
                name: "FitnessStatus",
                table: "Employees",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastFitnessDate",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkStatus",
                table: "Employees",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Accreditations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CompletionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    EmployeeId = table.Column<int>(type: "int", nullable: true),
                    JobRoleId = table.Column<int>(type: "int", nullable: true),
                    RiskFactorId = table.Column<int>(type: "int", nullable: true),
                    ProtocolId = table.Column<int>(type: "int", nullable: true),
                    ResponsiblePerson = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    ResponsibleEmail = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    IsRecurring = table.Column<bool>(type: "bit", nullable: false),
                    RecurrenceMonths = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accreditations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Accreditations_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Accreditations_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_Accreditations_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Accreditations_JobRoles_JobRoleId",
                        column: x => x.JobRoleId,
                        principalTable: "JobRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Accreditations_Protocols_ProtocolId",
                        column: x => x.ProtocolId,
                        principalTable: "Protocols",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Accreditations_RiskFactors_RiskFactorId",
                        column: x => x.RiskFactorId,
                        principalTable: "RiskFactors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Activities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    EmployeeId = table.Column<int>(type: "int", nullable: true),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RelatedEntityId = table.Column<int>(type: "int", nullable: true),
                    RelatedEntityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AssignedToUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsSystemGenerated = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Activities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Activities_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Activities_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Activities_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Activities_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HealthRecordExports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    RequestedByUserId = table.Column<int>(type: "int", nullable: false),
                    ExportType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PeriodEnd = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IncludeAttachments = table.Column<bool>(type: "bit", nullable: false),
                    IncludeServices = table.Column<bool>(type: "bit", nullable: false),
                    IncludePrivacyInfo = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FileName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DownloadedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DownloadCount = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealthRecordExports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HealthRecordExports_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HealthRecordExports_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HealthRecordExports_Users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LabAccreditations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    LaboratoryName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    LaboratoryAddress = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    LaboratoryEmail = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    LaboratoryPhone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    ContactPerson = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AccreditedExams = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AccreditationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LabAccreditations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LabAccreditations_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Accreditations_BranchId",
                table: "Accreditations",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Accreditations_CompanyId",
                table: "Accreditations",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Accreditations_EmployeeId",
                table: "Accreditations",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Accreditations_ExpiryDate",
                table: "Accreditations",
                column: "ExpiryDate");

            migrationBuilder.CreateIndex(
                name: "IX_Accreditations_JobRoleId",
                table: "Accreditations",
                column: "JobRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Accreditations_ProtocolId",
                table: "Accreditations",
                column: "ProtocolId");

            migrationBuilder.CreateIndex(
                name: "IX_Accreditations_RiskFactorId",
                table: "Accreditations",
                column: "RiskFactorId");

            migrationBuilder.CreateIndex(
                name: "IX_Accreditations_Status",
                table: "Accreditations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_AssignedToUserId",
                table: "Activities",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_Category",
                table: "Activities",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_CompanyId",
                table: "Activities",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_CreatedByUserId",
                table: "Activities",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_DueDate",
                table: "Activities",
                column: "DueDate");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_EmployeeId",
                table: "Activities",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_Status",
                table: "Activities",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_HealthRecordExports_CompanyId",
                table: "HealthRecordExports",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthRecordExports_EmployeeId",
                table: "HealthRecordExports",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthRecordExports_RequestedAt",
                table: "HealthRecordExports",
                column: "RequestedAt");

            migrationBuilder.CreateIndex(
                name: "IX_HealthRecordExports_RequestedByUserId",
                table: "HealthRecordExports",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthRecordExports_Status",
                table: "HealthRecordExports",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_LabAccreditations_CompanyId",
                table: "LabAccreditations",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_LabAccreditations_ExpiryDate",
                table: "LabAccreditations",
                column: "ExpiryDate");

            migrationBuilder.CreateIndex(
                name: "IX_LabAccreditations_Status",
                table: "LabAccreditations",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Accreditations");

            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "HealthRecordExports");

            migrationBuilder.DropTable(
                name: "LabAccreditations");

            migrationBuilder.DropColumn(
                name: "FitnessStatus",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "LastFitnessDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "WorkStatus",
                table: "Employees");

            migrationBuilder.AddColumn<int>(
                name: "VaccineId",
                table: "Vaccinations",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Channel",
                table: "NotificationLogs",
                type: "int",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<int>(
                name: "MunicipalityId",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MunicipalityId",
                table: "Companies",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProvinceId",
                table: "Companies",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RegionId",
                table: "Companies",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MunicipalityId",
                table: "Branches",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Carcinogen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CasNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Carcinogen", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Region",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Region", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Vaccine",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DefaultPeriodMonths = table.Column<int>(type: "int", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vaccine", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VisitInjury",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MedicalVisitId = table.Column<int>(type: "int", nullable: false),
                    BodyPart = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Cause = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    DaysLost = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    InailReportDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InailReportNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    InjuryDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    InjuryNature = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    InjuryType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsReportedToInail = table.Column<bool>(type: "bit", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisitInjury", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisitInjury_MedicalVisits_MedicalVisitId",
                        column: x => x.MedicalVisitId,
                        principalTable: "MedicalVisits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VisitRisk",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    MedicalVisitId = table.Column<int>(type: "int", nullable: false),
                    RiskFactorId = table.Column<int>(type: "int", nullable: false),
                    NotSuitable = table.Column<string>(type: "nvarchar(1)", maxLength: 1, nullable: true),
                    Notes = table.Column<double>(type: "float", nullable: true),
                    RiskUnit = table.Column<int>(type: "int", nullable: true),
                    RiskValue = table.Column<double>(type: "float", nullable: true),
                    SuitableWithPpe = table.Column<string>(type: "nvarchar(1)", maxLength: 1, nullable: true),
                    TimeUnit = table.Column<int>(type: "int", nullable: true),
                    TimeValue = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisitRisk", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisitRisk_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisitRisk_MedicalVisits_MedicalVisitId",
                        column: x => x.MedicalVisitId,
                        principalTable: "MedicalVisits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisitRisk_RiskFactors_RiskFactorId",
                        column: x => x.RiskFactorId,
                        principalTable: "RiskFactors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VisitCarcinogen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CarcinogenId = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    MedicalVisitId = table.Column<int>(type: "int", nullable: false),
                    CurrentExposure = table.Column<bool>(type: "bit", nullable: false),
                    PastExposure = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisitCarcinogen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisitCarcinogen_Carcinogen_CarcinogenId",
                        column: x => x.CarcinogenId,
                        principalTable: "Carcinogen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisitCarcinogen_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisitCarcinogen_MedicalVisits_MedicalVisitId",
                        column: x => x.MedicalVisitId,
                        principalTable: "MedicalVisits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Province",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RegionId = table.Column<int>(type: "int", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Province", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Province_Region_RegionId",
                        column: x => x.RegionId,
                        principalTable: "Region",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VisitVaccination",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    MedicalVisitId = table.Column<int>(type: "int", nullable: false),
                    VaccineId = table.Column<int>(type: "int", nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvoiceNumber = table.Column<int>(type: "int", nullable: true),
                    InvoiceYear = table.Column<int>(type: "int", nullable: true),
                    IsInvoiced = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PeriodMonths = table.Column<int>(type: "int", nullable: true),
                    VaccinationDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisitVaccination", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisitVaccination_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisitVaccination_MedicalVisits_MedicalVisitId",
                        column: x => x.MedicalVisitId,
                        principalTable: "MedicalVisits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisitVaccination_Vaccine_VaccineId",
                        column: x => x.VaccineId,
                        principalTable: "Vaccine",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Municipality",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProvinceId = table.Column<int>(type: "int", nullable: false),
                    RegionId = table.Column<int>(type: "int", nullable: false),
                    BelfioreCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Cap = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    IstatCode = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Municipality", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Municipality_Province_ProvinceId",
                        column: x => x.ProvinceId,
                        principalTable: "Province",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Municipality_Region_RegionId",
                        column: x => x.RegionId,
                        principalTable: "Region",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Vaccinations_VaccineId",
                table: "Vaccinations",
                column: "VaccineId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_MunicipalityId",
                table: "Employees",
                column: "MunicipalityId");

            migrationBuilder.CreateIndex(
                name: "IX_Companies_MunicipalityId",
                table: "Companies",
                column: "MunicipalityId");

            migrationBuilder.CreateIndex(
                name: "IX_Companies_ProvinceId",
                table: "Companies",
                column: "ProvinceId");

            migrationBuilder.CreateIndex(
                name: "IX_Companies_RegionId",
                table: "Companies",
                column: "RegionId");

            migrationBuilder.CreateIndex(
                name: "IX_Branches_MunicipalityId",
                table: "Branches",
                column: "MunicipalityId");

            migrationBuilder.CreateIndex(
                name: "IX_Municipality_ProvinceId",
                table: "Municipality",
                column: "ProvinceId");

            migrationBuilder.CreateIndex(
                name: "IX_Municipality_RegionId",
                table: "Municipality",
                column: "RegionId");

            migrationBuilder.CreateIndex(
                name: "IX_Province_RegionId",
                table: "Province",
                column: "RegionId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitCarcinogen_CarcinogenId",
                table: "VisitCarcinogen",
                column: "CarcinogenId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitCarcinogen_CompanyId",
                table: "VisitCarcinogen",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitCarcinogen_MedicalVisitId",
                table: "VisitCarcinogen",
                column: "MedicalVisitId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitInjury_MedicalVisitId",
                table: "VisitInjury",
                column: "MedicalVisitId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitRisk_CompanyId",
                table: "VisitRisk",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitRisk_MedicalVisitId",
                table: "VisitRisk",
                column: "MedicalVisitId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitRisk_RiskFactorId",
                table: "VisitRisk",
                column: "RiskFactorId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitVaccination_CompanyId",
                table: "VisitVaccination",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitVaccination_MedicalVisitId",
                table: "VisitVaccination",
                column: "MedicalVisitId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitVaccination_VaccineId",
                table: "VisitVaccination",
                column: "VaccineId");

            migrationBuilder.AddForeignKey(
                name: "FK_Branches_Municipality_MunicipalityId",
                table: "Branches",
                column: "MunicipalityId",
                principalTable: "Municipality",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Companies_Municipality_MunicipalityId",
                table: "Companies",
                column: "MunicipalityId",
                principalTable: "Municipality",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Companies_Province_ProvinceId",
                table: "Companies",
                column: "ProvinceId",
                principalTable: "Province",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Companies_Region_RegionId",
                table: "Companies",
                column: "RegionId",
                principalTable: "Region",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_Municipality_MunicipalityId",
                table: "Employees",
                column: "MunicipalityId",
                principalTable: "Municipality",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Vaccinations_Vaccine_VaccineId",
                table: "Vaccinations",
                column: "VaccineId",
                principalTable: "Vaccine",
                principalColumn: "Id");
        }
    }
}
