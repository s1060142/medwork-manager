using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExtendCompanyFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ATECOCode",
                table: "Companies",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Companies",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.AddColumn<string>(
                name: "Fax",
                table: "Companies",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "INAILPolicyNumber",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "INAILPosition",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Companies",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalAddress",
                table: "Companies",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalName",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalRepresentative",
                table: "Companies",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OperationalAddress",
                table: "Companies",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PEC",
                table: "Companies",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "REANumber",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RLS",
                table: "Companies",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RSPP",
                table: "Companies",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RiskClass",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaxCode",
                table: "Companies",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Companies",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "TenantId1",
                table: "Companies",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Companies",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "UpdatedAt", table: "Companies");
            migrationBuilder.DropColumn(name: "TenantId1", table: "Companies");
            migrationBuilder.DropColumn(name: "TenantId", table: "Companies");
            migrationBuilder.DropColumn(name: "TaxCode", table: "Companies");
            migrationBuilder.DropColumn(name: "RiskClass", table: "Companies");
            migrationBuilder.DropColumn(name: "RSPP", table: "Companies");
            migrationBuilder.DropColumn(name: "RLS", table: "Companies");
            migrationBuilder.DropColumn(name: "REANumber", table: "Companies");
            migrationBuilder.DropColumn(name: "PEC", table: "Companies");
            migrationBuilder.DropColumn(name: "OperationalAddress", table: "Companies");
            migrationBuilder.DropColumn(name: "LegalRepresentative", table: "Companies");
            migrationBuilder.DropColumn(name: "LegalName", table: "Companies");
            migrationBuilder.DropColumn(name: "LegalAddress", table: "Companies");
            migrationBuilder.DropColumn(name: "IsActive", table: "Companies");
            migrationBuilder.DropColumn(name: "INAILPosition", table: "Companies");
            migrationBuilder.DropColumn(name: "INAILPolicyNumber", table: "Companies");
            migrationBuilder.DropColumn(name: "Fax", table: "Companies");
            migrationBuilder.DropColumn(name: "CreatedAt", table: "Companies");
            migrationBuilder.DropColumn(name: "ATECOCode", table: "Companies");
        }
    }
}
