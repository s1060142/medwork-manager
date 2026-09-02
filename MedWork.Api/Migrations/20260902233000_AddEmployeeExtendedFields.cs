using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedWork.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeExtendedFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CategoriaProtetta",
                table: "Employees",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataAssunzione",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataAttualeMansione",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataCessazione",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataProssimaVisita",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataProssimaVisitaRI",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataRiattivazione",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataUltimaVisita",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataUltimaVisitaRI",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentiPrivacy",
                table: "Employees",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Domicilio",
                table: "Employees",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GruppoSanguigno",
                table: "Employees",
                type: "nvarchar(5)",
                maxLength: 5,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentificativoMPI",
                table: "Employees",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IndirizzoDomicilio",
                table: "Employees",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IndirizzoMedico",
                table: "Employees",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MedicoCurante",
                table: "Employees",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Motivazione",
                table: "Employees",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NotePerAzienda",
                table: "Employees",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NoteRiservate",
                table: "Employees",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PeriodicitaVisitaRI",
                table: "Employees",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenteAziendale",
                table: "Employees",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StatoRisorsa",
                table: "Employees",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                defaultValue: "Attivo");

            migrationBuilder.AddColumn<string>(
                name: "TelefonoMedico",
                table: "Employees",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoProssimaVisita",
                table: "Employees",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CategoriaProtetta", table: "Employees");
            migrationBuilder.DropColumn(name: "DataAssunzione", table: "Employees");
            migrationBuilder.DropColumn(name: "DataAttualeMansione", table: "Employees");
            migrationBuilder.DropColumn(name: "DataCessazione", table: "Employees");
            migrationBuilder.DropColumn(name: "DataProssimaVisita", table: "Employees");
            migrationBuilder.DropColumn(name: "DataProssimaVisitaRI", table: "Employees");
            migrationBuilder.DropColumn(name: "DataRiattivazione", table: "Employees");
            migrationBuilder.DropColumn(name: "DataUltimaVisita", table: "Employees");
            migrationBuilder.DropColumn(name: "DataUltimaVisitaRI", table: "Employees");
            migrationBuilder.DropColumn(name: "DocumentiPrivacy", table: "Employees");
            migrationBuilder.DropColumn(name: "Domicilio", table: "Employees");
            migrationBuilder.DropColumn(name: "GruppoSanguigno", table: "Employees");
            migrationBuilder.DropColumn(name: "IdentificativoMPI", table: "Employees");
            migrationBuilder.DropColumn(name: "IndirizzoDomicilio", table: "Employees");
            migrationBuilder.DropColumn(name: "IndirizzoMedico", table: "Employees");
            migrationBuilder.DropColumn(name: "MedicoCurante", table: "Employees");
            migrationBuilder.DropColumn(name: "Motivazione", table: "Employees");
            migrationBuilder.DropColumn(name: "NotePerAzienda", table: "Employees");
            migrationBuilder.DropColumn(name: "NoteRiservate", table: "Employees");
            migrationBuilder.DropColumn(name: "PeriodicitaVisitaRI", table: "Employees");
            migrationBuilder.DropColumn(name: "ReferenteAziendale", table: "Employees");
            migrationBuilder.DropColumn(name: "StatoRisorsa", table: "Employees");
            migrationBuilder.DropColumn(name: "TelefonoMedico", table: "Employees");
            migrationBuilder.DropColumn(name: "TipoProssimaVisita", table: "Employees");
        }
    }
}
