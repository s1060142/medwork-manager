using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAiChartingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OcrData",
                table: "MedicalVisits",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PersonalProtocolId",
                table: "MedicalVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VoiceNoteUrl",
                table: "MedicalVisits",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MedicalVisits_PersonalProtocolId",
                table: "MedicalVisits",
                column: "PersonalProtocolId");

            migrationBuilder.AddForeignKey(
                name: "FK_MedicalVisits_PersonalProtocols_PersonalProtocolId",
                table: "MedicalVisits",
                column: "PersonalProtocolId",
                principalTable: "PersonalProtocols",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MedicalVisits_PersonalProtocols_PersonalProtocolId",
                table: "MedicalVisits");

            migrationBuilder.DropIndex(
                name: "IX_MedicalVisits_PersonalProtocolId",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "OcrData",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "PersonalProtocolId",
                table: "MedicalVisits");

            migrationBuilder.DropColumn(
                name: "VoiceNoteUrl",
                table: "MedicalVisits");
        }
    }
}
