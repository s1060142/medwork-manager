using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyExtendedFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CompanyDoctors_Companies_CompanyId1",
                table: "CompanyDoctors");

            migrationBuilder.DropForeignKey(
                name: "FK_CompanyDoctors_Doctors_DoctorId1",
                table: "CompanyDoctors");

            migrationBuilder.DropIndex(
                name: "IX_CompanyDoctors_CompanyId1",
                table: "CompanyDoctors");

            migrationBuilder.DropIndex(
                name: "IX_CompanyDoctors_DoctorId1",
                table: "CompanyDoctors");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "CompanyDoctors");

            migrationBuilder.DropColumn(
                name: "DoctorId1",
                table: "CompanyDoctors");

            migrationBuilder.AlterColumn<int>(
                name: "DoctorId",
                table: "MedicalVisits",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "ABI",
                table: "Companies",
                type: "nvarchar(5)",
                maxLength: 5,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AccountHolder",
                table: "Companies",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Activity",
                table: "Companies",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BICSwift",
                table: "Companies",
                type: "nvarchar(11)",
                maxLength: 11,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BankChargesAmount",
                table: "Companies",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankChargesDebit",
                table: "Companies",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "Companies",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BillingEmail",
                table: "Companies",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CAB",
                table: "Companies",
                type: "nvarchar(5)",
                maxLength: 5,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CIGCode",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CUPCode",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Clinic",
                table: "Companies",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CommunicationsEmail",
                table: "Companies",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractIdentifier",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentStorageLocation",
                table: "Companies",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalCode",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IBAN",
                table: "Companies",
                type: "nvarchar(34)",
                maxLength: 34,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "IntentLetterDate",
                table: "Companies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "IntentLetterExpiry",
                table: "Companies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IntentLetterNumber",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InternalContactEmail",
                table: "Companies",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InternalContactName",
                table: "Companies",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalCity",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalPostalCode",
                table: "Companies",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalProvince",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Companies",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OperationalCity",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OperationalPostalCode",
                table: "Companies",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OperationalProvince",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OperationalUnitName",
                table: "Companies",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderCode",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentTerms",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecipientCode",
                table: "Companies",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reference",
                table: "Companies",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SplitPayment",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UsualVisitLocation",
                table: "Companies",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ABI",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "AccountHolder",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Activity",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "BICSwift",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "BankChargesAmount",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "BankChargesDebit",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "BillingEmail",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CAB",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CIGCode",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CUPCode",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Clinic",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CommunicationsEmail",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "ContractIdentifier",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "DocumentStorageLocation",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "ExternalCode",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "IBAN",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "IntentLetterDate",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "IntentLetterExpiry",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "IntentLetterNumber",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "InternalContactEmail",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "InternalContactName",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "LegalCity",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "LegalPostalCode",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "LegalProvince",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "OperationalCity",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "OperationalPostalCode",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "OperationalProvince",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "OperationalUnitName",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "OrderCode",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "PaymentTerms",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "RecipientCode",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Reference",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "SplitPayment",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "UsualVisitLocation",
                table: "Companies");

            migrationBuilder.AlterColumn<int>(
                name: "DoctorId",
                table: "MedicalVisits",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "CompanyDoctors",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DoctorId1",
                table: "CompanyDoctors",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompanyDoctors_CompanyId1",
                table: "CompanyDoctors",
                column: "CompanyId1");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyDoctors_DoctorId1",
                table: "CompanyDoctors",
                column: "DoctorId1");

            migrationBuilder.AddForeignKey(
                name: "FK_CompanyDoctors_Companies_CompanyId1",
                table: "CompanyDoctors",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CompanyDoctors_Doctors_DoctorId1",
                table: "CompanyDoctors",
                column: "DoctorId1",
                principalTable: "Doctors",
                principalColumn: "Id");
        }
    }
}
