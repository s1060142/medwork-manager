namespace MedWork.Api.Integrations;

using System.Globalization;
using System.IO;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using MedWork.Api.Data;
using MedWork.Api.Models;

/// <summary>
/// Handles HR import/export of employee data via CSV and Excel formats.
/// Used for onboarding, bulk import, and data export.
/// </summary>
[ApiController]
[Route("api/integrations/hr")]
[Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
public sealed class HrImportExportService
{
    private readonly AppDbContext _dbContext;

    public HrImportExportService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Imports employees from a CSV file.
    /// Expected columns: ExternalId, FirstName, LastName, TaxCode, JobRole, HireDate, RiskFactors, Email, Phone
    /// </summary>
    [HttpPost("import-csv")]
    public IActionResult ImportCsv([FromForm] string fileContent, [FromForm] string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileContent))
            return BadRequest("File content is empty.");

        var rows = ParseCsv(fileContent, fileName);
        var imported = 0;
        var errors = new List<string>();

        foreach (var row in rows)
        {
            try
            {
                var employee = MapToEmployee(row);
                if (employee != null)
                {
                    _dbContext.Employees.Add(employee);
                    imported++;
                }
            }
            catch (Exception ex)
            {
                errors.Add($"Row failed to import: {ex.Message}");
            }
        }

        _dbContext.SaveChanges();

        return Ok(new
        {
            Imported = imported,
            TotalRows = rows.Count,
            Errors = errors
        });
    }

    /// <summary>
    /// Exports all active employees to a CSV file.
    /// </summary>
    [HttpGet("export-csv")]
    public IActionResult ExportCsv()
    {
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

    /// <summary>
    /// Exports all active employees to an Excel file (XLSX).
    /// </summary>
    [HttpGet("export-excel")]
    public IActionResult ExportExcel()
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

    /// <summary>
    /// Generates a proper XLSX file using OpenXML SDK.
    /// </summary>
    private byte[] GenerateXlsx(List<Employee> employees)
    {
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
        foreach (var emp in employees)
        {
            var row = new DocumentFormat.OpenXml.Packages.Worksheet.Row(employees.IndexOf(emp) + 2);
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.Id.ToString() })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.ExternalId ?? "" })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.FirstName })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.LastName })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.TaxCode ?? "" })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.JobRole ?? "" })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.HireDate.ToString("yyyy-MM-dd") })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.PersonalEmail ?? "" })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData
                {
                    Value = new DocumentFormat.OpenXml.Packages.Worksheet.Text(new TextFormat { Text = emp.PhoneNumber ?? "" })
                }
            });
            row.Add(new DocumentFormat.OpenXml.Packages.Worksheet.Cell()
            {
                Data = new DocumentFormat.OpenXml.Packages.Worksheet.CellData
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

    /// <summary>
    /// Parses CSV content into rows.
    /// </summary>
    private List<string[]> ParseCsv(string content, string fileName)
    {
        var lines = content.Split(new[] { "\r\n", "\n", "\r" }, StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length < 2)
            return new List<string[]>();

        var header = lines[0].Split(';').Select(h => h.Trim().ToLowerInvariant()).ToArray();
        var result = new List<string[]>();

        for (var i = 1; i < lines.Length; i++)
        {
            var cols = lines[i].Split(';');
            if (cols.Length == 0) continue;

            result.Add(cols);
        }

        return result;
    }

    /// <summary>
    /// Maps a CSV row to an Employee entity.
    /// </summary>
    private Employee? MapToEmployee(string[] row)
    {
        try
        {
            var externalId = "";
            var firstName = "";
            var lastName = "";
            var taxCode = "";
            var jobRole = "";
            var hireDate = DateTime.UtcNow;
            var email = "";
            var phone = "";
            var status = "Active";

            // Try to find values by column name
            for (var i = 0; i < row.Length; i++)
            {
                var col = row[i].Trim().ToLowerInvariant();

                // Map column to field
                if (col == "externalid" || col == "id" || col == "employeeid")
                    externalId = row[i].Trim();
                else if (col == "firstname")
                    firstName = row[i].Trim();
                else if (col == "lastname")
                    lastName = row[i].Trim();
                else if (col == "taxcode")
                    taxCode = row[i].Trim();
                else if (col == "jobrole")
                    jobRole = row[i].Trim();
                else if (col == "hiredate")
                {
                    if (DateTime.TryParse(row[i], out var d))
                        hireDate = d;
                }
                else if (col == "riskfactors" || col == "risks")
                {
                    if (!string.IsNullOrWhiteSpace(row[i]))
                    {
                        jobRole = row[i].Trim();
                    }
                }
                else if (col == "email")
                    email = row[i].Trim();
                else if (col == "phone")
                    phone = row[i].Trim();
                else if (col == "status")
                    status = row[i].Trim();
            }

            // If we couldn't find externalId, look for it in any column
            if (string.IsNullOrWhiteSpace(externalId))
            {
                for (var i = 0; i < row.Length; i++)
                {
                    if (row[i].Trim().Length > 0 && !row[i].Trim().StartsWith("externalid") && !row[i].Trim().StartsWith("id"))
                    {
                        externalId = row[i].Trim();
                        break;
                    }
                }
            }

            // Validate required fields
            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
                return null;

            // Try to find the employee by ExternalId if it looks like an ID
            var existing = _dbContext.Employees
                .FirstOrDefault(e => e.ExternalId == externalId && e.TenantId == 1);
            if (existing != null)
                return existing;

            var employee = new Employee
            {
                TenantId = 1,
                CompanyId = 1,
                FirstName = firstName,
                LastName = lastName,
                TaxCode = taxCode,
                JobRole = jobRole,
                HireDate = hireDate,
                Email = email,
                PhoneNumber = phone,
                IsActive = status == "Active",
                ConsentGDPR = false,
                ConsentHealthData = false,
                ExternalId = externalId
            };

            return employee;
        }
        catch
        {
            return null;
        }
    }
}