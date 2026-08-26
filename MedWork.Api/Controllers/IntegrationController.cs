using MedWork.Api.Data;
using MedWork.Api.Integrations;
using MedWork.Api.Models;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using System.Text;
using System.Security.Claims;

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
    private readonly HrImportExportService _hrImportExport;
    private readonly AppDbContext _dbContext;

    public IntegrationController(
        HrImportExportService hrImportExport,
        AppDbContext dbContext)
    {
        _hrImportExport = hrImportExport;
        _dbContext = dbContext;
    }

    private int GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value;
        if (int.TryParse(tenantClaim, out var tenantId))
        {
            return tenantId;
        }
        throw new UnauthorizedAccessException("Tenant ID non valido nel token.");
    }

    [HttpPost("import-employee")]
    [Authorize(Roles = "Admin")]
    public IActionResult ImportEmployee(IFormFile file, string fileName)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is empty.");

        var workers = _hrImportExport.ImportCsv(file, fileName ?? "");
        return Ok(workers);
    }

    [HttpGet("export-employee-csv")]
    [Authorize(Roles = "Admin")]
    public IActionResult ExportEmployeeCsv()
    {
        // Export all active employees to CSV
        var employees = _dbContext.Employees
            .Where(e => e.IsActive && e.TenantId == GetTenantId())
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

    [HttpGet("export-employee-excel")]
    [Authorize(Roles = "Admin")]
    public IActionResult ExportEmployeeExcel()
    {
        var employees = _dbContext.Employees
            .Where(e => e.IsActive && e.TenantId == GetTenantId())
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .ToList();

        // Generate proper XLSX using OpenXML SDK
        var xlsxBytes = GenerateXlsx(employees);

        return File(xlsxBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "employees.xlsx");
    }

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

}