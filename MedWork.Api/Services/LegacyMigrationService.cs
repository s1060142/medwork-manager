using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Services;

public record MigrationReport(
    int TotalCompaniesImported,
    int TotalEmployeesImported,
    int TotalVisitsImported,
    int TotalProtocolsImported,
    List<string> Warnings,
    List<string> Errors
);

public record LegacyImportPayload(
    string SourceFormat, // "WinAspi", "CartSan", "UnifiedJson"
    List<LegacyCompanyDto>? Companies,
    List<LegacyEmployeeDto>? Employees,
    List<LegacyVisitDto>? Visits
);

public record LegacyCompanyDto(string Name, string? TaxCode, string? VatNumber, string? Address, string? City, string? Province, string? PEC, string? RSPP);
public record LegacyEmployeeDto(string CompanyName, string FirstName, string LastName, string TaxCode, string? JobRole, DateTime? BirthDate, string? Gender, string? Email, string? Phone);
public record LegacyVisitDto(string EmployeeTaxCode, DateTime VisitDate, DateTime? NextDeadlineDate, int VisitType, string? Outcome, string? Prescriptions, string? Limitations, string? ObjectiveExam);

public interface ILegacyMigrationService
{
    Task<MigrationReport> ImportLegacyPackageAsync(int tenantId, LegacyImportPayload payload);
    Task<MigrationReport> ParseAndImportCsvDumpAsync(int tenantId, string csvContent, string entityType);
}

public class LegacyMigrationService : ILegacyMigrationService
{
    private readonly AppDbContext _db;

    public LegacyMigrationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<MigrationReport> ImportLegacyPackageAsync(int tenantId, LegacyImportPayload payload)
    {
        var warnings = new List<string>();
        var errors = new List<string>();
        int companiesCount = 0;
        int employeesCount = 0;
        int visitsCount = 0;

        var companyMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        // Preload existing companies for this tenant
        var existingCompanies = await _db.Companies.Where(c => c.TenantId == tenantId).ToListAsync();
        foreach (var c in existingCompanies)
        {
            companyMap[c.Name] = c.Id;
        }

        // 1. Process Companies
        if (payload.Companies != null)
        {
            foreach (var comp in payload.Companies)
            {
                if (string.IsNullOrWhiteSpace(comp.Name)) continue;
                if (!companyMap.ContainsKey(comp.Name))
                {
                    var newComp = new Company
                    {
                        TenantId = tenantId,
                        Name = comp.Name.Trim(),
                        TaxCode = comp.TaxCode?.Trim(),
                        VATNumber = comp.VatNumber?.Trim(),
                        LegalAddress = comp.Address,
                        OperationalCity = comp.City,
                        OperationalProvince = comp.Province,
                        PEC = comp.PEC,
                        RSPP = comp.RSPP,
                    };
                    _db.Companies.Add(newComp);
                    await _db.SaveChangesAsync();
                    companyMap[newComp.Name] = newComp.Id;
                    companiesCount++;
                }
            }
        }

        // 2. Process Employees
        var employeeMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var existingEmployees = await _db.Employees.Where(e => e.TenantId == tenantId).ToListAsync();
        foreach (var e in existingEmployees)
        {
            if (!string.IsNullOrWhiteSpace(e.TaxCode)) employeeMap[e.TaxCode] = e.Id;
        }

        // Find default branch for fallback
        var defaultBranchId = await _db.Branches.Where(b => b.TenantId == tenantId).Select(b => b.Id).FirstOrDefaultAsync();
        if (defaultBranchId <= 0) defaultBranchId = 1;

        if (payload.Employees != null)
        {
            foreach (var emp in payload.Employees)
            {
                if (string.IsNullOrWhiteSpace(emp.TaxCode))
                {
                    warnings.Add($"Dipendente {emp.FirstName} {emp.LastName} ignorato per codice fiscale assente.");
                    continue;
                }

                if (!employeeMap.ContainsKey(emp.TaxCode.Trim()))
                {
                    int targetCompanyId = existingCompanies.FirstOrDefault()?.Id ?? 1;
                    if (!string.IsNullOrWhiteSpace(emp.CompanyName) && companyMap.TryGetValue(emp.CompanyName, out int foundCompId))
                    {
                        targetCompanyId = foundCompId;
                    }

                    var newEmp = new Employee
                    {
                        TenantId = tenantId,
                        CompanyId = targetCompanyId,
                        BranchId = defaultBranchId,
                        FirstName = emp.FirstName.Trim(),
                        LastName = emp.LastName.Trim(),
                        TaxCode = emp.TaxCode.Trim().ToUpperInvariant(),
                        JobRole = emp.JobRole ?? "Mansione non specificata",
                        BirthDate = emp.BirthDate ?? new DateTime(1985, 1, 1),
                        Gender = emp.Gender ?? "M",
                        PersonalEmail = emp.Email,
                        PhoneNumber = emp.Phone,
                        IsActive = true,
                        HireDate = DateTime.UtcNow.AddYears(-2)
                    };
                    _db.Employees.Add(newEmp);
                    await _db.SaveChangesAsync();
                    employeeMap[newEmp.TaxCode] = newEmp.Id;
                    employeesCount++;
                }
            }
        }

        // 3. Process Visits
        if (payload.Visits != null)
        {
            foreach (var v in payload.Visits)
            {
                if (string.IsNullOrWhiteSpace(v.EmployeeTaxCode) || !employeeMap.TryGetValue(v.EmployeeTaxCode.Trim(), out int empId))
                {
                    warnings.Add($"Visita del {v.VisitDate:dd/MM/yyyy} ignorata: lavoratore con CF {v.EmployeeTaxCode} non trovato.");
                    continue;
                }

                var newVisit = new MedicalVisit
                {
                    TenantId = tenantId,
                    EmployeeId = empId,
                    VisitDate = v.VisitDate,
                    NextDeadlineDate = v.NextDeadlineDate ?? v.VisitDate.AddYears(1),
                    VisitType = v.VisitType > 0 ? (MedicalVisitType)v.VisitType : MedicalVisitType.Periodic,
                    Outcome = v.Outcome ?? "Idoneo alla mansione specifica",
                    OutcomeCode = v.Outcome?.Contains("prescrizion", StringComparison.OrdinalIgnoreCase) == true ? "IDONE0P" : "IDONE0",
                    Prescriptions = v.Prescriptions,
                    Limitations = v.Limitations,
                    ObjectiveExam = v.ObjectiveExam ?? "Reperto d'archivio storico migrato.",
                    IsSigned = true
                };
                _db.MedicalVisits.Add(newVisit);
                visitsCount++;
            }
            await _db.SaveChangesAsync();
        }

        return new MigrationReport(companiesCount, employeesCount, visitsCount, 0, warnings, errors);
    }

    public async Task<MigrationReport> ParseAndImportCsvDumpAsync(int tenantId, string csvContent, string entityType)
    {
        var warnings = new List<string>();
        var errors = new List<string>();
        int count = 0;

        using var reader = new StringReader(csvContent);
        string? header = await reader.ReadLineAsync();
        if (header == null) return new MigrationReport(0, 0, 0, 0, warnings, errors);

        string? line;
        while ((line = await reader.ReadLineAsync()) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            var parts = line.Split(';', ',');
            if (parts.Length < 3) continue;

            try
            {
                if (entityType.Equals("company", StringComparison.OrdinalIgnoreCase))
                {
                    var comp = new Company
                    {
                        TenantId = tenantId,
                        Name = parts[0].Trim(),
                        TaxCode = parts.Length > 1 ? parts[1].Trim() : null,
                        VATNumber = parts.Length > 2 ? parts[2].Trim() : null,
                    };
                    _db.Companies.Add(comp);
                    count++;
                }
            }
            catch (Exception ex)
            {
                warnings.Add($"Errore parsing riga '{line}': {ex.Message}");
            }
        }

        await _db.SaveChangesAsync();
        return new MigrationReport(count, 0, 0, 0, warnings, errors);
    }
}
