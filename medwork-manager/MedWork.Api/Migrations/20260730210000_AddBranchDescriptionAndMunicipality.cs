using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations;

/// <inheritdoc />
public partial class AddBranchDescriptionAndMunicipality : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Description",
            table: "Branches",
            type: "nvarchar(150)",
            maxLength: 150,
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "MunicipalityId",
            table: "Branches",
            type: "int",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Branches_MunicipalityId",
            table: "Branches",
            column: "MunicipalityId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Branches_MunicipalityId",
            table: "Branches");

        migrationBuilder.DropColumn(
            name: "MunicipalityId",
            table: "Branches");

        migrationBuilder.DropColumn(
            name: "Description",
            table: "Branches");
    }
}
