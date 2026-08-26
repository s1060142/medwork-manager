using System.Globalization;
using System.IO;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using MedWork.Api.Data;
using MedWork.Api.Models;
using MedWork.Api.Security;

namespace MedWork.Api.Integrations;


/// <summary>
/// Handles HR import/export of employee data via CSV and Excel formats.
/// Used for onboarding, bulk import, and data export.
/// </summary>
[ApiController]
[Route("api/integrations/hr")]
[Authorize(Roles = AppRole.Admin + "," + AppRole.Doctor)]
public sealed class HrImportExportService : ControllerBase
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
    public IActionResult ImportCsv(IFormFile file, string fileName)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is empty.");

        var fileContent = new StreamReader(file.OpenReadStream()).ReadToEnd();
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
                $"{emp.PersonalEmail ?? ""},{emp.PhoneNumber ?? ""},{(emp.IsActive ? "Active" : "Inactive")}");
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
    /// Generates a proper XLSX file using EPPlus.
    /// </summary>
    private byte[] GenerateXlsx(List<Employee> employees)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Employees");

        var headers = new[] { "ID", "ExternalId", "FirstName", "LastName", "TaxCode", "JobRole", "HireDate", "Email", "Phone", "Status" };
        for (var c = 0; c < headers.Length; c++)
        {
            worksheet.Cells[1, c + 1].Value = headers[c];
        }

        var r = 2;
        foreach (var emp in employees)
        {
            worksheet.Cells[r, 1].Value = emp.Id;
            worksheet.Cells[r, 2].Value = emp.ExternalId ?? "";
            worksheet.Cells[r, 3].Value = emp.FirstName;
            worksheet.Cells[r, 4].Value = emp.LastName;
            worksheet.Cells[r, 5].Value = emp.TaxCode ?? "";
            worksheet.Cells[r, 6].Value = emp.JobRole ?? "";
            worksheet.Cells[r, 7].Value = emp.HireDate.ToString("yyyy-MM-dd");
            worksheet.Cells[r, 8].Value = emp.PersonalEmail ?? "";
            worksheet.Cells[r, 9].Value = emp.PhoneNumber ?? "";
            worksheet.Cells[r, 10].Value = emp.IsActive ? "Active" : "Inactive";
            r++;
        }

        return package.GetAsByteArray();
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
            int? riskLevelId = null;

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
                    var riskVal = row[i].Trim();
                    if (!string.IsNullOrWhiteSpace(riskVal) && int.TryParse(riskVal, out var riskId) && riskId >= 1)
                        riskLevelId = riskId;
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
                PersonalEmail = email,
                PhoneNumber = phone,
                IsActive = status == "Active",
                ConsentGDPR = false,
                ConsentHealthData = false,
                ExternalId = externalId,
                RiskLevelId = riskLevelId
            };

            return employee;
        }
        catch
        {
            return null;
        }
    }
}