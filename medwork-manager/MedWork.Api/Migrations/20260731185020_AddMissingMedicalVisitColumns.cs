using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingMedicalVisitColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "MedicalVisits",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "SchedulingCode",
                table: "MedicalVisits",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExamCode",
                table: "MedicalVisits",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RiskCode",
                table: "MedicalVisits",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OutcomeCode",
                table: "MedicalVisits",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "MedicalVisits",
                type: "nvarchar(4000)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight",
                table: "MedicalVisits",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HeartRate",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SystolicPressure",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DiastolicPressure",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FitnessOutcome",
                table: "MedicalVisits",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UnfitNotes",
                table: "MedicalVisits",
                type: "nvarchar(4000)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Pathologies",
                table: "MedicalVisits",
                type: "nvarchar(4000)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "JobRoleId",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VisitTypeDetail",
                table: "MedicalVisits",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Periodicity",
                table: "MedicalVisits",
                type: "int",
                nullable: false,
                defaultValue: 365);

            migrationBuilder.AddColumn<int>(
                name: "ReasonForVisit",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ValidationCode",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastTidDate",
                table: "MedicalVisits",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TidType",
                table: "MedicalVisits",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AnalyticalInterval",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConEsito",
                table: "MedicalVisits",
                type: "nvarchar(1)",
                maxLength: 1,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NotCoe",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ValidityDays",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrescriptionRequired",
                table: "MedicalVisits",
                type: "nvarchar(1)",
                maxLength: 1,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IdoneitaLavorativa",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvoiceFlag",
                table: "MedicalVisits",
                type: "nvarchar(1)",
                maxLength: 1,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PrescriptionExpiry",
                table: "MedicalVisits",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmployeeTidDate",
                table: "MedicalVisits",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeTidType",
                table: "MedicalVisits",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RiskAssessment",
                table: "MedicalVisits",
                type: "nvarchar(4000)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "UnfitNotes2",
                table: "MedicalVisits",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NoExpiry",
                table: "MedicalVisits",
                type: "nvarchar(1)",
                maxLength: 1,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IsAltered",
                table: "MedicalVisits",
                type: "nvarchar(1)",
                maxLength: 1,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "No3b",
                table: "MedicalVisits",
                type: "nvarchar(1)",
                maxLength: 1,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnfitNew",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Signature",
                table: "MedicalVisits",
                type: "nvarchar(4000)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "InvoiceNumber",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "InvoiceYear",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "VisitTime",
                table: "MedicalVisits",
                type: "time",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MedicalVisits_CompanyId",
                table: "MedicalVisits",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_MedicalVisits_JobRoleId",
                table: "MedicalVisits",
                column: "JobRoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MedicalVisits_CompanyId",
                table: "MedicalVisits");

            migrationBuilder.DropIndex(
                name: "IX_MedicalVisits_JobRoleId",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "SchedulingCode",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "ExamCode",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "RiskCode",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "OutcomeCode",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "HeartRate",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "SystolicPressure",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "DiastolicPressure",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "FitnessOutcome",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "UnfitNotes",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "Pathologies",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "JobRoleId",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "VisitTypeDetail",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "Periodicity",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "ReasonForVisit",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "ValidationCode",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "LastTidDate",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "TidType",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "AnalyticalInterval",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "ConEsito",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "NotCoe",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "ValidityDays",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "PrescriptionRequired",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "IdoneitaLavorativa",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "InvoiceFlag",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "PrescriptionExpiry",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "EmployeeTidDate",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "EmployeeTidType",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "RiskAssessment",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "UnfitNotes2",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "NoExpiry",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "IsAltered",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "No3b",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "UnfitNew",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "Signature",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "InvoiceNumber",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "InvoiceYear",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "VisitTime",
                table: "MedicalVisits");
        }
    }
}