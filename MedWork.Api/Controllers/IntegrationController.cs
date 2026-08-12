using MedWork.Api.Integrations;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

/// <summary>
/// FASE 3 - Integration Hub: HR imports (Zucchetti/TeamSystem), FatturaPA builder.
/// Exposes pure mapping/transform services. No AppDbContext dependency.
/// </summary>
[ApiController]
[Route("api/integrations")]
[Authorize(Roles = "Admin")]
public sealed class IntegrationController : ControllerBase
{
    private readonly ZucchettiConnector _zucchetti = new();
    private readonly TeamSystemConnector _teamSystem = new();
    private readonly IFatturaPaBuilder _fattura = new FatturaPaBuilder();
    private readonly HrImportExportService _hrImportExport;
    private readonly AppDbContext _dbContext;

    public IntegrationController(HrImportExportService hrImportExport, AppDbContext dbContext)
    {
        _hrImportExport = hrImportExport;
        _dbContext = dbContext;
    }

    [HttpPost("hr/zucchetti/csv")]
    public IActionResult ImportZucchettiCsv([FromBody] string csv)
    {
        var workers = _zucchetti.MapCsv(csv ?? string.Empty);
        return Ok(workers);
    }

    [HttpPost("hr/teamsystem/json")]
    public IActionResult ImportTeamSystemJson([FromBody] string json)
    {
        var workers = _teamSystem.MapJson(json ?? string.Empty);
        return Ok(workers);
    }

    [HttpPost("import-employee")]
    [Authorize(Roles = "Admin")]
    public IActionResult ImportEmployee([FromForm] string fileContent, [FromForm] string fileName)
    {
        var workers = _hrImportExport.ImportCsv(fileContent ?? string.Empty, fileName ?? "");
        return Ok(workers);
    }

    [HttpGet("export-employee-csv")]
    [Authorize(Roles = "Admin")]
    public IActionResult ExportEmployeeCsv()
    {
        // Export all active employees to CSV
        var employees = _dbContext.Employees
            .Where(e => e.IsActive)
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .ToList();

        var sb = new StringBuilder();
        sb.AppendLine("ID,ExternalId,FirstName,LastName,TaxCode,JobRole,HireDate,Email,Phone,Status");

        foreach (var emp in employees)
        {
            var hireDateStr = emp.HireDate.ToString("yyyy-MM-dd");
            sb.AppendLine(
                $"{emp.Id},{emp.ExternalId ?? ""},{emp.FirstName},{emp.LastName}," +
                $"{emp.TaxCode ?? ""},{emp.JobRole ?? ""},{hireDateStr}," +
                $"{emp.PersonalEmail ?? ""},{emp.PhoneNumber ?? ""},{emp.IsActive ? "Active" : "Inactive"}");
        }

        var fileBytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(fileBytes, "text/csv", "employees.csv");
    }

    [HttpGet("export-employee-excel")]
    [Authorize(Roles = "Admin")]
    public IActionResult ExportEmployeeExcel()
    {
        var employees = _dbContext.Employees
            .Where(e => e.IsActive)
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .ToList();

        // Generate proper XLSX using OpenXML SDK
        var xlsxBytes = GenerateXlsx(employees);

        return File(xlsxBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "employees.xlsx");
    }

    private byte[] GenerateXlsx(List<Employee> employees)
    {
        // Generate a proper XLSX file using OpenXML SDK
        using var package = new DocumentFormat.OpenXml.Packages.DocumentPackage();
        using var workbookPart = package.AddPart(new DocumentFormat.OpenXml.Packages.WorkbookPart());
        using var sheetDataPart = package.AddPart(new DocumentFormat.OpenXml.Packages.WorksheetPart());

        // Create the workbook
        var workbook = new Workbook();
        var sheets = new Sheets();
        var sheet = new Sheet()
        {
            SheetId = 1,
            Name = "Employees",
            Id = workbookPart.GetIdPart()
        };
        sheets.Add(sheet);
        workbook.Sheets = sheets;
        workbookPart.Workbook = workbook;

        // Create first sheet
        var firstSheet = sheetDataPart.Worksheet;

        // Add header row
        var headerRow = new DocumentFormat.OpenXml.Packages.Worksheet.Row(1);
        var headers = new[] { "ID", "ExternalId", "FirstName", "LastName", "TaxCode", "JobRole", "HireDate", "Email", "Phone", "Status" };
        foreach (var header in headers)
        {
            var cell = new DocumentFormat.OpenXml.Packages.Worksheet.Cell();
            cell.Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData();
            cell.Data.Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = header });
            headerRow.Add(cell);
        }
        firstSheet.Add(headerRow);

        // Add data rows
        for (var i = 0; i < employees.Count; i++)
        {
            var emp = employees[i];
            var row = new DocumentFormat.OpenXml.Packages.Worksheet.Row(i + 2);
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData()
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.Id.ToString() })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData()
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.ExternalId ?? "" })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData()
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.FirstName })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData()
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.LastName })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData()
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.TaxCode ?? "" })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData()
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.JobRole ?? "" })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData()
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.HireDate.ToString("yyyy-MM-dd") })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData()
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.PersonalEmail ?? "" })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData()
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.PhoneNumber ?? "" })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData()
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.IsActive ? "Active" : "Inactive" })
                }
            });
            firstSheet.Add(row);
        }

        // Save the package to a memory stream
        var memStream = new MemoryStream();
        var writer = new StreamWriter(memStream);
        package.Save(writer);
        writer.Flush();
        memStream.Position = 0;

        return memStream.ToArray();
    }

    [HttpPost("fatturapa")]
    public IActionResult BuildFatturaPa([FromBody] FatturaPiva fattura)
    {
        if (fattura is null) return BadRequest("fattura required.");
        return Content(_fattura.BuildXml(fattura), "application/xml");
    }
}