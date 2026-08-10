using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyDoctors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CompanyDoctors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    DoctorId = table.Column<int>(type: "int", nullable: false),
                    IsCoordinator = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyDoctors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompanyDoctors_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompanyDoctors_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyDoctors_CompanyId_DoctorId",
                table: "CompanyDoctors",
                columns: new[] { "CompanyId", "DoctorId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompanyDoctors_DoctorId",
                table: "CompanyDoctors",
                column: "DoctorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompanyDoctors");
        }
    }
}
