using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AlignPasswordsAndFixPending : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "VATNumber",
                table: "CompanyGroups",
                type: "nvarchar(13)",
                maxLength: 13,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ComplianceNotes",
                table: "CompanyGroups",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ConsolidatedBilling",
                table: "CompanyGroups",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "CompanyGroups",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "CompanyGroups",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastComplianceReview",
                table: "CompanyGroups",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalForm",
                table: "CompanyGroups",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalRepTaxCode",
                table: "CompanyGroups",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalRepresentative",
                table: "CompanyGroups",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MedicoCompetenteGroup",
                table: "CompanyGroups",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PEC",
                table: "CompanyGroups",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PropagateDoctors",
                table: "CompanyGroups",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PropagateProtocols",
                table: "CompanyGroups",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PropagateRiskFactors",
                table: "CompanyGroups",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PropagateVisitSchedules",
                table: "CompanyGroups",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RSPPGroup",
                table: "CompanyGroups",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegistrationNumber",
                table: "CompanyGroups",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShareCapital",
                table: "CompanyGroups",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "CompanyGroups",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "CompanyGroups",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "CompanyGroupMemberships",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyGroupId = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LeftAt = table.Column<DateTime>(type: "datetime2", maxLength: 50, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyGroupMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompanyGroupMemberships_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompanyGroupMemberships_CompanyGroups_CompanyGroupId",
                        column: x => x.CompanyGroupId,
                        principalTable: "CompanyGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupBillingConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyGroupId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Frequency = table.Column<int>(type: "int", nullable: false),
                    FixedFee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PerVisitFee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PerEmployeeFee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PaymentTermsDays = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    PaymentMethod = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    IBAN = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ValidFrom = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ValidUntil = table.Column<DateTime>(type: "datetime2", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupBillingConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupBillingConfigs_CompanyGroups_CompanyGroupId",
                        column: x => x.CompanyGroupId,
                        principalTable: "CompanyGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupDoctors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyGroupId = table.Column<int>(type: "int", nullable: false),
                    DoctorId = table.Column<int>(type: "int", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UntilDate = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupDoctors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupDoctors_CompanyGroups_CompanyGroupId",
                        column: x => x.CompanyGroupId,
                        principalTable: "CompanyGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupDoctors_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupProtocols",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyGroupId = table.Column<int>(type: "int", nullable: false),
                    ProtocolId = table.Column<int>(type: "int", nullable: false),
                    IsMandatory = table.Column<bool>(type: "bit", nullable: false),
                    FrequencyOverride = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    FrequencyMonthsOverride = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupProtocols", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupProtocols_CompanyGroups_CompanyGroupId",
                        column: x => x.CompanyGroupId,
                        principalTable: "CompanyGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupProtocols_Protocols_ProtocolId",
                        column: x => x.ProtocolId,
                        principalTable: "Protocols",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupRiskFactors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyGroupId = table.Column<int>(type: "int", nullable: false),
                    RiskFactorId = table.Column<int>(type: "int", nullable: false),
                    LevelId = table.Column<int>(type: "int", nullable: false),
                    AppliesToAllCompanies = table.Column<bool>(type: "bit", nullable: false),
                    SpecificCompanyIds = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupRiskFactors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupRiskFactors_CompanyGroups_CompanyGroupId",
                        column: x => x.CompanyGroupId,
                        principalTable: "CompanyGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupRiskFactors_RiskFactors_RiskFactorId",
                        column: x => x.RiskFactorId,
                        principalTable: "RiskFactors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupRiskFactors_RiskLevels_LevelId",
                        column: x => x.LevelId,
                        principalTable: "RiskLevels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyGroupMemberships_CompanyGroupId",
                table: "CompanyGroupMemberships",
                column: "CompanyGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyGroupMemberships_CompanyId",
                table: "CompanyGroupMemberships",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBillingConfigs_CompanyGroupId",
                table: "GroupBillingConfigs",
                column: "CompanyGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupDoctors_CompanyGroupId",
                table: "GroupDoctors",
                column: "CompanyGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupDoctors_DoctorId",
                table: "GroupDoctors",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupProtocols_CompanyGroupId",
                table: "GroupProtocols",
                column: "CompanyGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupProtocols_ProtocolId",
                table: "GroupProtocols",
                column: "ProtocolId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupRiskFactors_CompanyGroupId",
                table: "GroupRiskFactors",
                column: "CompanyGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupRiskFactors_LevelId",
                table: "GroupRiskFactors",
                column: "LevelId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupRiskFactors_RiskFactorId",
                table: "GroupRiskFactors",
                column: "RiskFactorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompanyGroupMemberships");

            migrationBuilder.DropTable(
                name: "GroupBillingConfigs");

            migrationBuilder.DropTable(
                name: "GroupDoctors");

            migrationBuilder.DropTable(
                name: "GroupProtocols");

            migrationBuilder.DropTable(
                name: "GroupRiskFactors");

            migrationBuilder.DropColumn(
                name: "ComplianceNotes",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "ConsolidatedBilling",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "LastComplianceReview",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "LegalForm",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "LegalRepTaxCode",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "LegalRepresentative",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "MedicoCompetenteGroup",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "PEC",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "PropagateDoctors",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "PropagateProtocols",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "PropagateRiskFactors",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "PropagateVisitSchedules",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "RSPPGroup",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "RegistrationNumber",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "ShareCapital",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "CompanyGroups");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "CompanyGroups");

            migrationBuilder.AlterColumn<string>(
                name: "VATNumber",
                table: "CompanyGroups",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(13)",
                oldMaxLength: 13,
                oldNullable: true);
        }
    }
}
