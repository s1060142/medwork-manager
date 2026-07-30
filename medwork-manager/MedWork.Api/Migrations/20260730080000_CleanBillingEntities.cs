using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingBillingEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Users table - columns already added manually, just add foreign keys if needed
            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DoctorId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EmployeeId",
                table: "Users",
                type: "int",
                nullable: true);

            // PriceLists table - already created via SQL
            // Just ensure indexes exist
            migrationBuilder.CreateIndex(
                name: "IX_PriceLists_CompanyId",
                table: "PriceLists",
                column: "CompanyId");

            // Quotes table - already created via SQL
            migrationBuilder.CreateIndex(
                name: "IX_Quotes_CompanyId_Year_Number",
                table: "Quotes",
                columns: new[] { "CompanyId", "Year", "Number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quotes_CompanyId",
                table: "Quotes",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotes_ConvertedToInvoiceId",
                table: "Quotes",
                column: "ConvertedToInvoiceId");

            // QuoteLines table - already created via SQL
            migrationBuilder.CreateIndex(
                name: "IX_QuoteLines_QuoteId",
                table: "QuoteLines",
                column: "QuoteId");

            // ElectronicInvoices table - already created via SQL
            // Just ensure indexes
            migrationBuilder.CreateIndex(
                name: "IX_ElectronicInvoices_CompanyId_Year_Number",
                table: "ElectronicInvoices",
                columns: new[] { "CompanyId", "Year", "Number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ElectronicInvoices_CompanyId",
                table: "ElectronicInvoices",
                column: "CompanyId");

            // ElectronicInvoiceLines table - already created
            migrationBuilder.CreateIndex(
                name: "IX_ElectronicInvoiceLines_ElectronicInvoiceId",
                table: "ElectronicInvoiceLines",
                column: "ElectronicInvoiceId");

            // ElectronicInvoicePayments - already created
            migrationBuilder.CreateIndex(
                name: "IX_ElectronicInvoicePayments_ElectronicInvoiceId",
                table: "ElectronicInvoicePayments",
                column: "ElectronicInvoiceId");

            // ElectronicInvoiceLogs - already created
            migrationBuilder.CreateIndex(
                name: "IX_ElectronicInvoiceLogs_ElectronicInvoiceId",
                table: "ElectronicInvoiceLogs",
                column: "ElectronicInvoiceId");

            // SdiConfigurations - already created
            migrationBuilder.CreateIndex(
                name: "IX_SdiConfigurations_CompanyId",
                table: "SdiConfigurations",
                column: "CompanyId",
                unique: true);

            // SdiNotificationLogs - already created
            migrationBuilder.CreateIndex(
                name: "IX_SdiNotificationLogs_ElectronicInvoiceId",
                table: "SdiNotificationLogs",
                column: "ElectronicInvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_SdiNotificationLogs_IsProcessed",
                table: "SdiNotificationLogs",
                column: "IsProcessed");

            // NotificationLogs - ensure ReminderKey index exists
            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_ReminderKey",
                table: "NotificationLogs",
                column: "ReminderKey");

            // MedicalVisits - ensure CompanyId index
            migrationBuilder.CreateIndex(
                name: "IX_MedicalVisits_CompanyId",
                table: "MedicalVisits",
                column: "CompanyId");

            // PriceLists - already created via SQL
            migrationBuilder.CreateIndex(
                name: "IX_PriceLists_CompanyId",
                table: "PriceLists",
                column: "CompanyId");

            // Quotes - already created via SQL
            migrationBuilder.CreateIndex(
                name: "IX_Quotes_CompanyId",
                table: "Quotes",
                column: "CompanyId");

            // Quotes - unique constraint already created, just ensure FK
            migrationBuilder.AddForeignKey(
                name: "FK_Quotes_Companies_CompanyId",
                table: "Quotes",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Quotes_ElectronicInvoices_ConvertedToInvoiceId",
                table: "Quotes",
                column: "ConvertedToInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // QuoteLines FK
            migrationBuilder.AddForeignKey(
                name: "FK_QuoteLines_Quotes_QuoteId",
                table: "QuoteLines",
                column: "QuoteId",
                principalTable: "Quotes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // ElectronicInvoiceLines FK
            migrationBuilder.AddForeignKey(
                name: "FK_ElectronicInvoiceLines_ElectronicInvoices_ElectronicInvoiceId",
                table: "ElectronicInvoiceLines",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // ElectronicInvoicePayments FK
            migrationBuilder.AddForeignKey(
                name: "FK_ElectronicInvoicePayments_ElectronicInvoices_ElectronicInvoiceId",
                table: "ElectronicInvoicePayments",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // ElectronicInvoiceLogs FK
            migrationBuilder.AddForeignKey(
                name: "FK_ElectronicInvoiceLogs_ElectronicInvoices_ElectronicInvoiceId",
                table: "ElectronicInvoiceLogs",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // SdiConfigurations FK
            migrationBuilder.AddForeignKey(
                name: "FK_SdiConfigurations_Companies_CompanyId",
                table: "SdiConfigurations",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // SdiNotificationLogs FK
            migrationBuilder.AddForeignKey(
                name: "FK_SdiNotificationLogs_ElectronicInvoices_ElectronicInvoiceId",
                table: "SdiNotificationLogs",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // PriceLists FK
            migrationBuilder.AddForeignKey(
                name: "FK_PriceLists_Companies_CompanyId",
                table: "PriceLists",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Quotes FKs
            migrationBuilder.AddForeignKey(
                name: "FK_Quotes_Companies_CompanyId",
                table: "Quotes",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // ElectronicInvoices FK
            migrationBuilder.AddForeignKey(
                name: "FK_ElectronicInvoices_Companies_CompanyId",
                table: "ElectronicInvoices",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // ElectronicInvoiceLines FK
            migrationBuilder.AddForeignKey(
                name: "FK_ElectronicInvoiceLines_ElectronicInvoices_ElectronicInvoiceId",
                table: "ElectronicInvoiceLines",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // ElectronicInvoicePayments FK
            migrationBuilder.AddForeignKey(
                name: "FK_ElectronicInvoicePayments_ElectronicInvoices_ElectronicInvoiceId",
                table: "ElectronicInvoicePayments",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // ElectronicInvoiceLogs FK
            migrationBuilder.AddForeignKey(
                name: "FK_ElectronicInvoiceLogs_ElectronicInvoices_ElectronicInvoiceId",
                table: "ElectronicInvoiceLogs",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // SdiConfigurations FK
            migrationBuilder.AddForeignKey(
                name: "FK_SdiConfigurations_Companies_CompanyId",
                table: "SdiConfigurations",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // SdiNotificationLogs FK
            migrationBuilder.AddForeignKey(
                name: "FK_SdiNotificationLogs_ElectronicInvoices_ElectronicInvoiceId",
                table: "SdiNotificationLogs",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // PriceLists FK
            migrationBuilder.AddForeignKey(
                name: "FK_PriceLists_Companies_CompanyId",
                table: "PriceLists",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Quotes FK
            migrationBuilder.AddForeignKey(
                name: "FK_Quotes_Companies_CompanyId",
                table: "Quotes",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Users FKs
            migrationBuilder.AddForeignKey(
                name: "FK_Users_Companies_CompanyId",
                table: "Users",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Employees_EmployeeId",
                table: "Users",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Doctors_DoctorId",
                table: "Users",
                column: "DoctorId",
                principalTable: "Doctors",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // ElectronicInvoices FK
            migrationBuilder.AddForeignKey(
                name: "FK_ElectronicInvoices_Companies_CompanyId",
                table: "ElectronicInvoices",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // SdiConfigurations FK
            migrationBuilder.AddForeignKey(
                name: "FK_SdiConfigurations_Companies_CompanyId",
                table: "SdiConfigurations",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // SdiNotificationLogs FK
            migrationBuilder.AddForeignKey(
                name: "FK_SdiNotificationLogs_ElectronicInvoices_ElectronicInvoiceId",
                table: "SdiNotificationLogs",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // PriceLists FK
            migrationBuilder.AddForeignKey(
                name: "FK_PriceLists_Companies_CompanyId",
                table: "PriceLists",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Quotes FK
            migrationBuilder.AddForeignKey(
                name: "FK_Quotes_Companies_CompanyId",
                table: "Quotes",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // ElectronicInvoiceLines FK
            migrationBuilder.AddForeignKey(
                name: "FK_ElectronicInvoiceLines_ElectronicInvoices_ElectronicInvoiceId",
                table: "ElectronicInvoiceLines",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // ElectronicInvoicePayments FK
            migrationBuilder.AddForeignKey(
                name: "FK_ElectronicInvoicePayments_ElectronicInvoices_ElectronicInvoiceId",
                table: "ElectronicInvoicePayments",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // ElectronicInvoiceLogs FK
            migrationBuilder.AddForeignKey(
                name: "FK_ElectronicInvoiceLogs_ElectronicInvoices_ElectronicInvoiceId",
                table: "ElectronicInvoiceLogs",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // SdiConfigurations FK
            migrationBuilder.AddForeignKey(
                name: "FK_SdiConfigurations_Companies_CompanyId",
                table: "SdiConfigurations",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // SdiNotificationLogs FK
            migrationBuilder.AddForeignKey(
                name: "FK_SdiNotificationLogs_ElectronicInvoices_ElectronicInvoiceId",
                table: "SdiNotificationLogs",
                column: "ElectronicInvoiceId",
                principalTable: "ElectronicInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // PriceLists FK
            migrationBuilder.AddForeignKey(
                name: "FK_PriceLists_Companies_CompanyId",
                table: "PriceLists",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Quotes FK
            migrationBuilder.AddForeignKey(
                name: "FK_Quotes_Companies_CompanyId",
                table: "Quotes",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No down - we don't want to drop tables
        }
    }
}