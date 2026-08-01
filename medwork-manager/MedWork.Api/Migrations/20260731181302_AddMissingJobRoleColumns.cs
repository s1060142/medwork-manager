using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingJobRoleColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "JobRoles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "JobRoles",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobRoles_CompanyId",
                table: "JobRoles",
                column: "CompanyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JobRoles_CompanyId",
                table: "JobRoles");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "JobRoles");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "JobRoles");
        }
    }
}