using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCompliancePlanningAndProtocols : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Allegato3BCategory",
                table: "RiskFactors",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "VisitType",
                table: "MedicalVisits",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(120)",
                oldMaxLength: 120,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObjectiveExam",
                table: "MedicalVisits",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetOrgans",
                table: "MedicalVisits",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "MedicalRecords",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "JobRoleId",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Anamneses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MedicalVisitId = table.Column<int>(type: "int", nullable: false),
                    WorkHistory = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    PersonalHistory = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    FamilyHistory = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    RemotePathology = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    RecentPathology = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Anamneses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Anamneses_MedicalVisits_MedicalVisitId",
                        column: x => x.MedicalVisitId,
                        principalTable: "MedicalVisits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DoctorAvailabilities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DoctorId = table.Column<int>(type: "int", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorAvailabilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorAvailabilities_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "JobRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    Channel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MessageText = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationLogs_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScheduledExams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    ExamTypeId = table.Column<int>(type: "int", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduledExams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScheduledExams_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ScheduledExams_ExamTypes_ExamTypeId",
                        column: x => x.ExamTypeId,
                        principalTable: "ExamTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Vaccinations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    VaccineName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    DateAdministered = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NextDueDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vaccinations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vaccinations_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "JobRoleRiskFactors",
                columns: table => new
                {
                    JobRoleId = table.Column<int>(type: "int", nullable: false),
                    RiskFactorId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobRoleRiskFactors", x => new { x.JobRoleId, x.RiskFactorId });
                    table.ForeignKey(
                        name: "FK_JobRoleRiskFactors_JobRoles_JobRoleId",
                        column: x => x.JobRoleId,
                        principalTable: "JobRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JobRoleRiskFactors_RiskFactors_RiskFactorId",
                        column: x => x.RiskFactorId,
                        principalTable: "RiskFactors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Protocols",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    LawReference = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CadenceDays = table.Column<int>(type: "int", nullable: false),
                    Objective = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    JobRoleId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Protocols", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Protocols_JobRoles_JobRoleId",
                        column: x => x.JobRoleId,
                        principalTable: "JobRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PersonalProtocols",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    ProtocolId = table.Column<int>(type: "int", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsOverride = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonalProtocols", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PersonalProtocols_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PersonalProtocols_Protocols_ProtocolId",
                        column: x => x.ProtocolId,
                        principalTable: "Protocols",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_JobRoleId",
                table: "Employees",
                column: "JobRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Anamneses_MedicalVisitId",
                table: "Anamneses",
                column: "MedicalVisitId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoctorAvailabilities_DoctorId",
                table: "DoctorAvailabilities",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_JobRoleRiskFactors_RiskFactorId",
                table: "JobRoleRiskFactors",
                column: "RiskFactorId");

            migrationBuilder.CreateIndex(
                name: "IX_JobRoles_Name",
                table: "JobRoles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_EmployeeId",
                table: "NotificationLogs",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_PersonalProtocols_EmployeeId_ProtocolId",
                table: "PersonalProtocols",
                columns: new[] { "EmployeeId", "ProtocolId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PersonalProtocols_ProtocolId",
                table: "PersonalProtocols",
                column: "ProtocolId");

            migrationBuilder.CreateIndex(
                name: "IX_Protocols_JobRoleId",
                table: "Protocols",
                column: "JobRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledExams_EmployeeId",
                table: "ScheduledExams",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledExams_ExamTypeId",
                table: "ScheduledExams",
                column: "ExamTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Vaccinations_EmployeeId",
                table: "Vaccinations",
                column: "EmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_JobRoles_JobRoleId",
                table: "Employees",
                column: "JobRoleId",
                principalTable: "JobRoles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_JobRoles_JobRoleId",
                table: "Employees");

            migrationBuilder.DropTable(
                name: "Anamneses");

            migrationBuilder.DropTable(
                name: "DoctorAvailabilities");

            migrationBuilder.DropTable(
                name: "JobRoleRiskFactors");

            migrationBuilder.DropTable(
                name: "NotificationLogs");

            migrationBuilder.DropTable(
                name: "PersonalProtocols");

            migrationBuilder.DropTable(
                name: "ScheduledExams");

            migrationBuilder.DropTable(
                name: "Vaccinations");

            migrationBuilder.DropTable(
                name: "Protocols");

            migrationBuilder.DropTable(
                name: "JobRoles");

            migrationBuilder.DropIndex(
                name: "IX_Employees_JobRoleId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "Allegato3BCategory",
                table: "RiskFactors");

            migrationBuilder.DropColumn(
                name: "ObjectiveExam",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "TargetOrgans",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "JobRoleId",
                table: "Employees");

            migrationBuilder.AlterColumn<string>(
                name: "VisitType",
                table: "MedicalVisits",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(40)",
                oldMaxLength: 40);
        }
    }
}
