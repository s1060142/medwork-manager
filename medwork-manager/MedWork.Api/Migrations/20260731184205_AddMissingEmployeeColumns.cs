using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingEmployeeColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MunicipalityId",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WorkLocationId",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_MunicipalityId",
                table: "Employees",
                column: "MunicipalityId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_WorkLocationId",
                table: "Employees",
                column: "WorkLocationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Employees_MunicipalityId",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Employees_WorkLocationId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "MunicipalityId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "WorkLocationId",
                table: "Employees");
        }
    }
}