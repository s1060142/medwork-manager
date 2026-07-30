using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Services
{
    /// <summary>
    /// Servizio per l'integrazione con sistemi di gestione della sicurezza e dei rischi
    /// </summary>
    public class SafetyRiskManagementService : ISafetyRiskManagementService
    {
        private readonly AppDbContext _dbContext;

        public SafetyRiskManagementService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Injury> RecordWorkplaceIncidentAsync(IncidentReportDto incidentReport)
        {
            // Validate that employee, company, branch, and department exist
            var employee = await _dbContext.Employees.FindAsync(incidentReport.EmployeeId);
            if (employee == null)
                throw new KeyNotFoundException($"Employee with ID {incidentReport.EmployeeId} not found.");

            var company = await _dbContext.Companies.FindAsync(incidentReport.CompanyId);
            if (company == null)
                throw new KeyNotFoundException($"Company with ID {incidentReport.CompanyId} not found.");

            if (incidentReport.BranchId.HasValue)
            {
                var branch = await _dbContext.Branches.FindAsync(incidentReport.BranchId.Value);
                if (branch == null)
                    throw new KeyNotFoundException($"Branch with ID {incidentReport.BranchId.Value} not found.");
            }

            if (incidentReport.DepartmentId.HasValue)
            {
                var department = await _dbContext.Departments.FindAsync(incidentReport.DepartmentId.Value);
                if (department == null)
                    throw new KeyNotFoundException($"Department with ID {incidentReport.DepartmentId.Value} not found.");
            }

            // Create the injury record
            var injury = new Injury
            {
                EmployeeId = incidentReport.EmployeeId,
                InjuryDate = incidentReport.IncidentDate,
                Description = incidentReport.Description,
                Location = incidentReport.Location,
                IsReportedToInail = incidentReport.WasReportedToAuthorities, // Map WasReportedToAuthorities to IsReportedToInail
                DaysLost = incidentReport.LostWorkDays ?? 0, // Map LostWorkDays to DaysLost
                CreatedAt = DateTime.UtcNow
            };

            // Determine injury type based on IncidentType
            // This is a simplified mapping - in a real system, you might have an InjuryType enum or table
            if (incidentReport.IncidentType.Contains("Malattia", StringComparison.OrdinalIgnoreCase))
            {
                // Occupational illness
                injury.InjuryType = "Malattia professionale";
            }
            else if (incidentReport.IncidentType.Contains("Near miss", StringComparison.OrdinalIgnoreCase))
            {
                // Near miss
                injury.InjuryType = "Near miss";
            }
            else
            {
                // Default to injury
                injury.InjuryType = "Infortunio";
            }

            _dbContext.Injuries.Add(injury);
            await _dbContext.SaveChangesAsync();

            return injury;
        }

        public async Task<RiskAssessment> UpdateRiskAssessmentAsync(RiskAssessmentUpdateDto riskAssessmentUpdate)
        {
            // Validate that risk factor exists
            var riskFactor = await _dbContext.RiskFactors.FindAsync(riskAssessmentUpdate.RiskFactorId);
            if (riskFactor == null)
                throw new KeyNotFoundException($"Risk factor with ID {riskAssessmentUpdate.RiskFactorId} not found.");

            // If job role is specified, validate it exists
            JobRole? jobRole = null;
            if (riskAssessmentUpdate.JobRoleId.HasValue)
            {
                jobRole = await _dbContext.JobRoles.FindAsync(riskAssessmentUpdate.JobRoleId.Value);
                if (jobRole == null)
                    throw new KeyNotFoundException($"Job role with ID {riskAssessmentUpdate.JobRoleId.Value} not found.");
            }

            // For simplicity, we'll update the risk factor's severity level
            // In a more complex system, you might have a separate RiskAssessment table
            riskFactor.SeverityLevel = riskAssessmentUpdate.TargetRiskLevel;
            riskFactor.LastAssessed = DateTime.UtcNow;
            
            // Build assessment notes without problematic string interpolation
            string controlMeasures = riskAssessmentUpdate.ControlMeasures ?? "Nessuna specificata";
            riskFactor.AssessmentNotes = string.Format(
                "Valutazione aggiornata il {0:dd/MM/yyyy}. Livello precedente: {1}, Livello obiettivo: {2}, Misure di controllo: {3}",
                DateTime.UtcNow,
                riskAssessmentUpdate.CurrentRiskLevel,
                riskAssessmentUpdate.TargetRiskLevel,
                controlMeasures);

            // Create a new risk assessment record
            var riskAssessment = new RiskAssessment
            {
                RiskFactorId = riskAssessmentUpdate.RiskFactorId,
                JobRoleId = riskAssessmentUpdate.JobRoleId,
                CurrentRiskLevel = riskAssessmentUpdate.CurrentRiskLevel,
                TargetRiskLevel = riskAssessmentUpdate.TargetRiskLevel,
                AssessmentDate = DateTime.UtcNow,
                Assessor = riskAssessmentUpdate.ResponsiblePerson,
                ControlMeasures = riskAssessmentUpdate.ControlMeasures,
                NextReviewDate = riskAssessmentUpdate.ReviewDate,
                RiskFactor = riskFactor,
                JobRole = jobRole
            };

            _dbContext.RiskAssessments.Add(riskAssessment);
            await _dbContext.SaveChangesAsync();

            return riskAssessment;
        }

        public async Task<Injury> RecordNearMissAsync(NearMissReportDto nearMissReport)
        {
            // Validate that employee, company, branch, and department exist
            var employee = await _dbContext.Employees.FindAsync(nearMissReport.EmployeeId);
            if (employee == null)
                throw new KeyNotFoundException($"Employee with ID {nearMissReport.EmployeeId} not found.");

            var company = await _dbContext.Companies.FindAsync(nearMissReport.CompanyId);
            if (company == null)
                throw new KeyNotFoundException($"Company with ID {nearMissReport.CompanyId} not found.");

            if (nearMissReport.BranchId.HasValue)
            {
                var branch = await _dbContext.Branches.FindAsync(nearMissReport.BranchId.Value);
                if (branch == null)
                    throw new KeyNotFoundException($"Branch with ID {nearMissReport.BranchId.Value} not found.");
            }

            if (nearMissReport.DepartmentId.HasValue)
            {
                var department = await _dbContext.Departments.FindAsync(nearMissReport.DepartmentId.Value);
                if (department == null)
                    throw new KeyNotFoundException($"Department with ID {nearMissReport.DepartmentId.Value} not found.");
            }

            // Create the injury record for near miss
            var injury = new Injury
            {
                EmployeeId = nearMissReport.EmployeeId,
                InjuryDate = nearMissReport.IncidentDate,
                Description = nearMissReport.Description,
                Location = nearMissReport.Location,
                IsReportedToInail = false, // Near misses typically aren't reported to authorities
                DaysLost = 0, // No lost work days for near misses
                InjuryType = "Near miss", // Set the type directly
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Injuries.Add(injury);
            await _dbContext.SaveChangesAsync();

            return injury;
        }

        public async Task<SafetyStatisticsDto> GetSafetyStatisticsAsync(int companyId, int? departmentId = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            // Set default date range if not provided (last 12 months)
            if (!startDate.HasValue)
                startDate = DateTime.UtcNow.AddYears(-1);
            if (!endDate.HasValue)
                endDate = DateTime.UtcNow;

            // Validate company exists
            var company = await _dbContext.Companies.FindAsync(companyId);
            if (company == null)
                throw new KeyNotFoundException($"Company with ID {companyId} not found.");

            // Build query for injuries in the specified time period
            var injuriesQuery = _dbContext.Injuries
                .AsNoTracking()
                .Where(i => i.Employee.CompanyId == companyId &&
                            i.InjuryDate >= startDate.Value &&
                            i.InjuryDate <= endDate.Value);

            // Filter by department if specified
            if (departmentId.HasValue)
            {
                injuriesQuery = injuriesQuery.Where(i => i.Employee.DepartmentId == departmentId.Value);
            }

            var injuries = await injuriesQuery.ToListAsync();

            // Get total employees for rate calculations
            var employeesQuery = _dbContext.Employees
                .AsNoTracking()
                .Where(e => e.CompanyId == companyId);

            if (departmentId.HasValue)
            {
                employeesQuery = employeesQuery.Where(e => e.DepartmentId == departmentId.Value);
            }

            int totalEmployees = await employeesQuery.CountAsync();

            // Calculate statistics
            int totalIncidents = injuries.Count;
            int fatalInjuries = injuries.Count(i => i.InjuryType.Equals("Mortale", StringComparison.OrdinalIgnoreCase));
            int lostTimeInjuries = injuries.Count(i => i.DaysLost > 0);
            int recordableInjuries = injuries.Count(i => !i.InjuryType.Equals("Mortale", StringComparison.OrdinalIgnoreCase)); // Simplified definition: non-fatal
            int nearMissReports = injuries.Count(i => i.InjuryType == "Near miss");

            // Calculate rates (per 1000 employees)
            double incidentRatePer1000Employees = totalEmployees > 0 
                ? (double)totalIncidents / totalEmployees * 1000 
                : 0;

            double lostTimeRatePer1000Employees = totalEmployees > 0 
                ? (double)lostTimeInjuries / totalEmployees * 1000 
                : 0;

            // Severity rate: lost days per 1,000,000 hours worked
            // Assuming 2000 hours worked per year per employee (40 hours/week * 50 weeks)
            double totalHoursWorked = totalEmployees * 2000.0;
            int totalLostDays = injuries.Sum(i => i.DaysLost);
            double severityRate = totalHoursWorked > 0 
                ? (double)totalLostDays / totalHoursWorked * 1000000 
                : 0;

            return new SafetyStatisticsDto
            {
                TotalIncidents = totalIncidents,
                FatalInjuries = fatalInjuries,
                LostTimeInjuries = lostTimeInjuries,
                RecordableInjuries = recordableInjuries,
                NearMissReports = nearMissReports,
                IncidentRatePer1000Employees = incidentRatePer1000Employees,
                LostTimeRatePer1000Employees = lostTimeRatePer1000Employees,
                SeverityRate = severityRate,
                PeriodStart = startDate.Value,
                PeriodEnd = endDate.Value
            };
        }

        public async Task<byte[]> ExportInjuryRegisterAsync(int companyId, DateTime startDate, DateTime endDate, string format = "csv")
        {
            // Validate company exists
            var company = await _dbContext.Companies.FindAsync(companyId);
            if (company == null)
                throw new KeyNotFoundException($"Company with ID {companyId} not found.");

            // Get injuries in the specified date range
            var injuries = await _dbContext.Injuries
                .AsNoTracking()
                .Include(i => i.Employee)
                .ThenInclude(e => e.Department)
                .Include(i => i.Employee)
                .ThenInclude(e => e.Branch)
                .Where(i => i.Employee.CompanyId == companyId &&
                            i.InjuryDate >= startDate &&
                            i.InjuryDate <= endDate)
                .OrderBy(i => i.InjuryDate)
                .ToListAsync();

            if (format.Equals("csv", StringComparison.OrdinalIgnoreCase))
            {
                // Generate CSV
                var lines = new List<string>();

                // Header
                lines.Add("Data infortunio,Dipendente,Matricola,Reparto,Sede,Tipo infortunio,Descrizione,Luogo,Giorni persi,Mortale,Segnalato alle autorità,Testimoni,Azioni immediate");

                // Data rows
                foreach (var injury in injuries)
                {
                    var employeeName = $"{injury.Employee.LastName}, {injury.Employee.FirstName}";
                    var employeeId = injury.Employee.TaxCode; // Using TaxCode as employee ID for export
                    var department = injury.Employee.Department?.Name ?? "N/A";
                    var branch = injury.Employee.Branch?.City ?? "N/A"; // Using City as the branch name for simplicity
                    var injuryType = injury.InjuryType ?? "N/A";
                    var description = injury.Description?.Replace("\"", "\"\"") ?? ""; // Escape quotes
                    var location = injury.Location?.Replace("\"", "\"\"") ?? "";
                    var lostDays = injury.DaysLost;
                    var fatal = injury.InjuryType.Equals("Mortale", StringComparison.OrdinalIgnoreCase) ? "Sì" : "No";
                    var reported = injury.IsReportedToInail ? "Sì" : "No";
                    var witnesses = ""; // Not available in Injury model
                    var immediateActions = ""; // Not available in Injury model

                    var line = $"\"{injury.InjuryDate:dd/MM/yyyy}\",\"{employeeName}\",\"{employeeId}\",\"{department}\",\"{branch}\",\"{injuryType}\",\"{description}\",\"{location}\",{lostDays},{fatal},{reported},\"{witnesses}\",\"{immediateActions}\"";
                    lines.Add(line);
                }

                var csvContent = string.Join(Environment.NewLine, lines);
                return Encoding.UTF8.GetBytes(csvContent);
            }
            else if (format.Equals("excel", StringComparison.OrdinalIgnoreCase) || format.Equals("xlsx", StringComparison.OrdinalIgnoreCase))
            {
                // For Excel, we'll generate CSV for simplicity
                // In a real implementation, you might use a library like EPPlus
                return await ExportInjuryRegisterAsync(companyId, startDate, endDate, "csv");
            }
            else
            {
                throw new ArgumentException($"Format '{format}' not supported. Use 'csv' or 'excel'.");
            }
        }
    }
}