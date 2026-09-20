using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
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

public record MigrationDryRunResult(
    bool IsValid,
    int TotalCompanies,
    int TotalEmployees,
    int TotalVisits,
    List<LegacyCompanyDto> PreviewCompanies,
    List<LegacyEmployeeDto> PreviewEmployees,
    List<LegacyVisitDto> PreviewVisits,
    List<string> Warnings,
    List<string> Errors
);

public record LegacyImportPayload(
    string SourceFormat, // "Winasped", "CartSan", "UnifiedCsv", "UnifiedJson"
    List<LegacyCompanyDto>? Companies,
    List<LegacyEmployeeDto>? Employees,
    List<LegacyVisitDto>? Visits
);

public record LegacyCompanyDto(
    string Name,
    string? TaxCode,
    string? VatNumber,
    string? Address,
    string? City,
    string? Province,
    string? PEC,
    string? RSPP
);

public record LegacyEmployeeDto(
    string CompanyName,
    string FirstName,
    string LastName,
    string TaxCode,
    string? JobRole,
    DateTime? BirthDate,
    string? Gender,
    string? Email,
    string? Phone
);

public record LegacyVisitDto(
    string EmployeeTaxCode,
    DateTime VisitDate,
    DateTime? NextDeadlineDate,
    int VisitType,
    string? Outcome,
    string? OutcomeCode,
    string? Prescriptions,
    string? Limitations,
    string? ObjectiveExam
);

public interface ILegacyMigrationService
{
    Task<MigrationReport> ImportLegacyPackageAsync(int tenantId, LegacyImportPayload payload);
    Task<MigrationDryRunResult> DryRunPackageAsync(int tenantId, LegacyImportPayload payload);
    Task<LegacyImportPayload> ParseCsvContentAsync(string csvContent, string sourceFormat);
}

public class LegacyMigrationService : ILegacyMigrationService
{
    private readonly AppDbContext _db;

    public LegacyMigrationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<LegacyImportPayload> ParseCsvContentAsync(string csvContent, string sourceFormat)
    {
        var companies = new List<LegacyCompanyDto>();
        var employees = new List<LegacyEmployeeDto>();
        var visits = new List<LegacyVisitDto>();

        using var reader = new StringReader(csvContent);
        string? headerLine = await reader.ReadLineAsync();
        if (headerLine == null)
        {
            return new LegacyImportPayload(sourceFormat, companies, employees, visits);
        }

        var headerCols = ParseCsvLine(headerLine).Select(c => c.Trim().ToLowerInvariant()).ToArray();

        string? line;
        while ((line = await reader.ReadLineAsync()) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            var cols = ParseCsvLine(line);
            if (cols.Length < 2) continue;

            // Detect row format based on columns or source format
            if (headerCols.Contains("ragionesociale") || headerCols.Contains("azienda") && !headerCols.Contains("cognome"))
            {
                // Company row
                string name = GetVal(cols, headerCols, "azienda", "ragionesociale", "nome", "denominazione") ?? cols[0].Trim();
                string? piva = GetVal(cols, headerCols, "partitaiva", "piva", "vatnumber", "vat");
                string? cf = GetVal(cols, headerCols, "codicefiscale", "cf", "taxcode");
                string? indirizzo = GetVal(cols, headerCols, "indirizzo", "address");
                string? comune = GetVal(cols, headerCols, "comune", "citta", "city");
                string? prov = GetVal(cols, headerCols, "provincia", "prov", "province");
                string? pec = GetVal(cols, headerCols, "pec", "emailpec");
                string? rspp = GetVal(cols, headerCols, "rspp");

                if (!string.IsNullOrWhiteSpace(name))
                {
                    companies.Add(new LegacyCompanyDto(name, cf, piva, indirizzo, comune, prov, pec, rspp));
                }
            }
            else if (headerCols.Contains("datavisita") || headerCols.Contains("giudizio") || headerCols.Contains("esito"))
            {
                // Visit row
                string? taxCode = GetVal(cols, headerCols, "codicefiscale", "cf", "cf_lavoratore", "taxcode");
                string? dateStr = GetVal(cols, headerCols, "datavisita", "data_visita", "data", "visitdate");
                string? nextDateStr = GetVal(cols, headerCols, "prossimascadenza", "scadenza", "nextdeadline");
                string? outcome = GetVal(cols, headerCols, "esito", "giudizio", "outcome");
                string? prescrizioni = GetVal(cols, headerCols, "prescrizioni", "prescriptions");
                string? limitazioni = GetVal(cols, headerCols, "limitazioni", "limitations");
                string? note = GetVal(cols, headerCols, "obiettivita", "anamnesi", "note", "objectiveexam");

                if (!string.IsNullOrWhiteSpace(taxCode) && DateTime.TryParse(dateStr, out var vDate))
                {
                    DateTime? nDate = DateTime.TryParse(nextDateStr, out var parsedNext) ? parsedNext : (DateTime?)null;
                    string outcomeCode = NormalizeOutcomeCode(outcome);
                    visits.Add(new LegacyVisitDto(taxCode.Trim().ToUpperInvariant(), vDate, nDate, 1, outcome ?? "Idoneo", outcomeCode, prescrizioni, limitazioni, note));
                }
            }
            else
            {
                // Default: Employee row
                string? compName = GetVal(cols, headerCols, "azienda", "ragionesociale", "company", "datoredilavoro") ?? "Azienda Migrata";
                string? cognome = GetVal(cols, headerCols, "cognome", "lastname", "surname");
                string? nome = GetVal(cols, headerCols, "nome", "firstname", "name");
                string? cf = GetVal(cols, headerCols, "codicefiscale", "cf", "taxcode");
                string? mansione = GetVal(cols, headerCols, "mansione", "jobrole", "qualifica");
                string? dataNascitaStr = GetVal(cols, headerCols, "datanascita", "data_nascita", "birthdate");
                string? sesso = GetVal(cols, headerCols, "sesso", "gender") ?? "M";
                string? email = GetVal(cols, headerCols, "email", "mail", "personalemail");
                string? tel = GetVal(cols, headerCols, "telefono", "cellulare", "phone");

                if (!string.IsNullOrWhiteSpace(cognome) && !string.IsNullOrWhiteSpace(nome) && !string.IsNullOrWhiteSpace(cf))
                {
                    DateTime? birthDate = DateTime.TryParse(dataNascitaStr, out var bDate) ? bDate : null;
                    employees.Add(new LegacyEmployeeDto(compName, nome.Trim(), cognome.Trim(), cf.Trim().ToUpperInvariant(), mansione, birthDate, sesso.Length > 0 ? sesso.Substring(0, 1).ToUpperInvariant() : "M", email, tel));
                }
            }
        }

        return new LegacyImportPayload(sourceFormat, companies, employees, visits);
    }

    public async Task<MigrationDryRunResult> DryRunPackageAsync(int tenantId, LegacyImportPayload payload)
    {
        var warnings = new List<string>();
        var errors = new List<string>();

        int compCount = payload.Companies?.Count ?? 0;
        int empCount = payload.Employees?.Count ?? 0;
        int visCount = payload.Visits?.Count ?? 0;

        var existingCompanies = await _db.Companies.AsNoTracking().Where(c => c.TenantId == tenantId).Select(c => c.Name).ToListAsync();
        var existingEmployees = await _db.Employees.AsNoTracking().Where(e => e.TenantId == tenantId).Select(e => e.TaxCode).ToListAsync();

        if (payload.Companies != null)
        {
            foreach (var c in payload.Companies)
            {
                if (string.IsNullOrWhiteSpace(c.Name))
                {
                    errors.Add("Azienda priva di denominazione/ragione sociale.");
                }
                else if (existingCompanies.Any(ec => ec.Equals(c.Name, StringComparison.OrdinalIgnoreCase)))
                {
                    warnings.Add($"Azienda '{c.Name}' già presente nel tenant (verrà riutilizzata).");
                }
            }
        }

        if (payload.Employees != null)
        {
            var seenTaxCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var e in payload.Employees)
            {
                if (string.IsNullOrWhiteSpace(e.TaxCode) || e.TaxCode.Length != 16)
                {
                    errors.Add($"Lavoratore {e.LastName} {e.FirstName}: Codice Fiscale non valido ('{e.TaxCode}').");
                }
                else if (!seenTaxCodes.Add(e.TaxCode))
                {
                    warnings.Add($"Lavoratore con CF '{e.TaxCode}' duplicato nel file.");
                }
                else if (existingEmployees.Contains(e.TaxCode))
                {
                    warnings.Add($"Lavoratore con CF '{e.TaxCode}' già presente nel database (lo storico visite verrà integrato).");
                }
            }
        }

        if (payload.Visits != null)
        {
            foreach (var v in payload.Visits)
            {
                if (string.IsNullOrWhiteSpace(v.EmployeeTaxCode))
                {
                    errors.Add($"Visita del {v.VisitDate:dd/MM/yyyy} priva di Codice Fiscale lavoratore.");
                }
            }
        }

        bool isValid = errors.Count == 0;
        var previewComp = payload.Companies?.Take(5).ToList() ?? new List<LegacyCompanyDto>();
        var previewEmp = payload.Employees?.Take(5).ToList() ?? new List<LegacyEmployeeDto>();
        var previewVis = payload.Visits?.Take(5).ToList() ?? new List<LegacyVisitDto>();

        return new MigrationDryRunResult(isValid, compCount, empCount, visCount, previewComp, previewEmp, previewVis, warnings, errors);
    }

    public async Task<MigrationReport> ImportLegacyPackageAsync(int tenantId, LegacyImportPayload payload)
    {
        var warnings = new List<string>();
        var errors = new List<string>();
        int companiesCount = 0;
        int employeesCount = 0;
        int visitsCount = 0;

        var companyMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
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
                if (!companyMap.ContainsKey(comp.Name.Trim()))
                {
                    var newComp = new Company
                    {
                        TenantId = tenantId,
                        Name = comp.Name.Trim(),
                        TaxCode = comp.TaxCode?.Trim(),
                        VATNumber = comp.VatNumber?.Trim(),
                        LegalAddress = comp.Address ?? "Indirizzo da completare",
                        LegalCity = comp.City ?? "Milano",
                        LegalPostalCode = "20100",
                        OperationalAddress = comp.Address ?? "Indirizzo da completare",
                        OperationalCity = comp.City ?? "Milano",
                        OperationalPostalCode = "20100",
                        OperationalProvince = comp.Province ?? "MI",
                        PEC = comp.PEC,
                        RSPP = comp.RSPP,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.Companies.Add(newComp);
                    await _db.SaveChangesAsync();

                    // Create a default branch for this company
                    var branch = new Branch
                    {
                        TenantId = tenantId,
                        CompanyId = newComp.Id,
                        Name = "Sede Principale",
                        Address = newComp.OperationalAddress,
                        City = newComp.OperationalCity,
                        Province = newComp.OperationalProvince,
                        PostalCode = newComp.OperationalPostalCode,
                        IsActive = true
                    };
                    _db.Branches.Add(branch);
                    await _db.SaveChangesAsync();

                    companyMap[newComp.Name] = newComp.Id;
                    companiesCount++;
                }
            }
        }

        // Ensure at least one company exists for fallback
        if (companyMap.Count == 0)
        {
            var fallbackComp = new Company
            {
                TenantId = tenantId,
                Name = "Azienda Migrata Principale",
                LegalAddress = "Sede legale",
                LegalCity = "Milano",
                LegalPostalCode = "20100",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Companies.Add(fallbackComp);
            await _db.SaveChangesAsync();
            companyMap[fallbackComp.Name] = fallbackComp.Id;

            var branch = new Branch
            {
                TenantId = tenantId,
                CompanyId = fallbackComp.Id,
                Name = "Sede Principale",
                Address = fallbackComp.LegalAddress,
                City = fallbackComp.LegalCity,
                PostalCode = "20100",
                IsActive = true
            };
            _db.Branches.Add(branch);
            await _db.SaveChangesAsync();
        }

        // 2. Process Employees (Scoped by CompanyId + TaxCode)
        var employeeMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var existingEmployees = await _db.Employees.Where(e => e.TenantId == tenantId).ToListAsync();
        foreach (var e in existingEmployees)
        {
            if (!string.IsNullOrWhiteSpace(e.TaxCode))
            {
                employeeMap[e.TaxCode.Trim()] = e.Id;
            }
        }

        if (payload.Employees != null)
        {
            foreach (var emp in payload.Employees)
            {
                if (string.IsNullOrWhiteSpace(emp.TaxCode))
                {
                    warnings.Add($"Dipendente {emp.FirstName} {emp.LastName} ignorato per codice fiscale assente.");
                    continue;
                }

                string taxCodeClean = emp.TaxCode.Trim().ToUpperInvariant();
                if (!employeeMap.ContainsKey(taxCodeClean))
                {
                    int targetCompanyId = companyMap.Values.FirstOrDefault();
                    if (!string.IsNullOrWhiteSpace(emp.CompanyName) && companyMap.TryGetValue(emp.CompanyName.Trim(), out int foundCompId))
                    {
                        targetCompanyId = foundCompId;
                    }

                    var branchId = await _db.Branches.Where(b => b.TenantId == tenantId && b.CompanyId == targetCompanyId).Select(b => b.Id).FirstOrDefaultAsync();
                    if (branchId <= 0)
                    {
                        branchId = await _db.Branches.Where(b => b.TenantId == tenantId).Select(b => b.Id).FirstOrDefaultAsync();
                        if (branchId <= 0) branchId = 1;
                    }

                    var newEmp = new Employee
                    {
                        TenantId = tenantId,
                        CompanyId = targetCompanyId,
                        BranchId = branchId,
                        FirstName = !string.IsNullOrWhiteSpace(emp.FirstName) ? emp.FirstName.Trim() : "Nome",
                        LastName = !string.IsNullOrWhiteSpace(emp.LastName) ? emp.LastName.Trim() : "Cognome",
                        TaxCode = taxCodeClean,
                        JobRole = !string.IsNullOrWhiteSpace(emp.JobRole) ? emp.JobRole.Trim() : "Mansione standard",
                        BirthDate = emp.BirthDate ?? new DateTime(1980, 1, 1),
                        Gender = (emp.Gender == "F" || emp.Gender == "f") ? "F" : "M",
                        BirthCity = "Milano",
                        BirthCityCode = "F205",
                        PersonalEmail = emp.Email,
                        PhoneNumber = emp.Phone,
                        IsActive = true,
                        HireDate = DateTime.UtcNow.AddYears(-2),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _db.Employees.Add(newEmp);
                    await _db.SaveChangesAsync();
                    employeeMap[taxCodeClean] = newEmp.Id;
                    employeesCount++;
                }
            }
        }

        // 3. Process Visits
        if (payload.Visits != null)
        {
            var existingVisits = await _db.MedicalVisits.Where(v => v.TenantId == tenantId).ToListAsync();

            foreach (var v in payload.Visits)
            {
                if (string.IsNullOrWhiteSpace(v.EmployeeTaxCode)) continue;
                string taxCodeClean = v.EmployeeTaxCode.Trim().ToUpperInvariant();

                if (!employeeMap.TryGetValue(taxCodeClean, out int empId))
                {
                    warnings.Add($"Visita del {v.VisitDate:dd/MM/yyyy} ignorata: lavoratore con CF {taxCodeClean} non trovato.");
                    continue;
                }

                bool alreadyExists = existingVisits.Any(ev => ev.EmployeeId == empId && ev.VisitDate.Date == v.VisitDate.Date);
                if (alreadyExists)
                {
                    warnings.Add($"Visita del {v.VisitDate:dd/MM/yyyy} per lavoratore con CF {taxCodeClean} già presente (ignorata).");
                    continue;
                }

                string outcome = !string.IsNullOrWhiteSpace(v.Outcome) ? v.Outcome.Trim() : "Idoneo alla mansione specifica";
                string outcomeCode = !string.IsNullOrWhiteSpace(v.OutcomeCode) ? v.OutcomeCode : NormalizeOutcomeCode(outcome);

                var newVisit = new MedicalVisit
                {
                    TenantId = tenantId,
                    EmployeeId = empId,
                    VisitDate = v.VisitDate,
                    NextDeadlineDate = v.NextDeadlineDate ?? v.VisitDate.AddYears(1),
                    VisitType = v.VisitType > 0 ? (MedicalVisitType)v.VisitType : MedicalVisitType.Periodic,
                    Outcome = outcome,
                    OutcomeCode = outcomeCode,
                    Prescriptions = v.Prescriptions,
                    Limitations = v.Limitations,
                    ObjectiveExam = !string.IsNullOrWhiteSpace(v.ObjectiveExam) ? v.ObjectiveExam : "Archivio storico migrato.",
                    IsSigned = true
                };

                _db.MedicalVisits.Add(newVisit);
                visitsCount++;
            }

            await _db.SaveChangesAsync();
        }

        return new MigrationReport(companiesCount, employeesCount, visitsCount, 0, warnings, errors);
    }

    private static string NormalizeOutcomeCode(string? outcome)
    {
        if (string.IsNullOrWhiteSpace(outcome)) return "IDONEO";
        var lower = outcome.ToLowerInvariant();
        if (lower.Contains("limitazion")) return "IDONEO_LIMITAZIONI";
        if (lower.Contains("prescrizion")) return "IDONEO_PRESCRIZIONI";
        if (lower.Contains("non idoneo temp") || lower.Contains("temporan")) return "NON_IDONEO_TEMP";
        if (lower.Contains("non idoneo") || lower.Contains("inidoneo")) return "NON_IDONEO_PERM";
        return "IDONEO";
    }

    private static string[] ParseCsvLine(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var current = new System.Text.StringBuilder();

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if ((c == ';' || c == ',') && !inQuotes)
            {
                result.Add(current.ToString().Trim('"', ' '));
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }
        result.Add(current.ToString().Trim('"', ' '));
        return result.ToArray();
    }

    private static string? GetVal(string[] cols, string[] headers, params string[] targetNames)
    {
        for (int i = 0; i < headers.Length; i++)
        {
            string h = headers[i].Replace("_", "").Replace(" ", "").ToLowerInvariant();
            foreach (var target in targetNames)
            {
                if (h.Equals(target, StringComparison.OrdinalIgnoreCase) && i < cols.Length)
                {
                    var val = cols[i].Trim();
                    return string.IsNullOrWhiteSpace(val) ? null : val;
                }
            }
        }
        return null;
    }
}
