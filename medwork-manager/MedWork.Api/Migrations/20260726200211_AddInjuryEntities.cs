using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddInjuryEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Injuries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    InjuryDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReportDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    InjuryType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BodyPart = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    InjuryNature = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Cause = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Location = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    DaysLost = table.Column<int>(type: "int", nullable: false),
                    ReturnToWorkDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsReportedToInail = table.Column<bool>(type: "bit", nullable: false),
                    InailReportNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    InailReportDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Injuries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Injuries_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Injuries_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InjuryAttachments",
                columns: table => new
                {
                    InjuryId = table.Column<int>(type: "int", nullable: false),
                    AttachmentId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InjuryAttachments", x => new { x.InjuryId, x.AttachmentId });
                    table.ForeignKey(
                        name: "FK_InjuryAttachments_Attachments_AttachmentId",
                        column: x => x.AttachmentId,
                        principalTable: "Attachments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InjuryAttachments_Injuries_InjuryId",
                        column: x => x.InjuryId,
                        principalTable: "Injuries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Injuries_CompanyId",
                table: "Injuries",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Injuries_EmployeeId",
                table: "Injuries",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Injuries_InjuryDate",
                table: "Injuries",
                column: "InjuryDate");

            migrationBuilder.CreateIndex(
                name: "IX_Injuries_Status",
                table: "Injuries",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_InjuryAttachments_AttachmentId",
                table: "InjuryAttachments",
                column: "AttachmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InjuryAttachments");

            migrationBuilder.DropTable(
                name: "Injuries");
        }
    }
}
