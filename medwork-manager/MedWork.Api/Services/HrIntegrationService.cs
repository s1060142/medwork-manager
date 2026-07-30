using System;
using System.Threading.Tasks;
using MedWork.Api.Data;
using MedWork.Api.Models;

namespace MedWork.Api.Services
{
    /// <summary>
    /// Servizio per l'integrazione con sistemi HR (assunzioni, dimissioni, assenze, trasferimenti)
    /// </summary>
    public class HrIntegrationService : IHrIntegrationService
    {
        private readonly AppDbContext _dbContext;

        public HrIntegrationService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Employee> ProcessHireEventAsync(HireEventDto hireEvent)
        {
            // Validate that company and branch exist
            var company = await _dbContext.Companies.FindAsync(hireEvent.CompanyId);
            if (company == null)
                throw new KeyNotFoundException($"Company with ID {hireEvent.CompanyId} not found.");

            var branch = await _dbContext.Branches.FindAsync(hireEvent.BranchId);
            if (branch == null)
                throw new KeyNotFoundException($"Branch with ID {hireEvent.BranchId} not found.");

            // If department is specified, validate it exists and belongs to the company/branch
            if (hireEvent.DepartmentId.HasValue)
            {
                var department = await _dbContext.Departments.FindAsync(hireEvent.DepartmentId.Value);
                if (department == null)
                    throw new KeyNotFoundException($"Department with ID {hireEvent.DepartmentId.Value} not found.");
                // Optionally, check that department belongs to the company/branch
            }

            // Create the employee
            var employee = new Employee
            {
                FirstName = hireEvent.FirstName,
                LastName = hireEvent.LastName,
                TaxCode = hireEvent.TaxCode,
                JobRole = hireEvent.JobRole,
                BirthDate = hireEvent.BirthDate,
                Gender = hireEvent.Gender,
                BirthCity = hireEvent.BirthCity,
                BirthCityCode = hireEvent.BirthCityCode,
                PersonalEmail = hireEvent.PersonalEmail,
                PhoneNumber = hireEvent.PhoneNumber,
                CompanyId = hireEvent.CompanyId,
                BranchId = hireEvent.BranchId,
                DepartmentId = hireEvent.DepartmentId,
                JobRoleId = null // If you have a JobRole entity, you might set this based on hireEvent.JobRole
            };

            _dbContext.Employees.Add(employee);
            await _dbContext.SaveChangesAsync();

            // Optionally, create an initial medical record for the employee
            var medicalRecord = new MedicalRecord
            {
                EmployeeId = employee.Id,
                Status = MedicalRecordStatus.Active,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.MedicalRecords.Add(medicalRecord);
            await _dbContext.SaveChangesAsync();

            return employee;
        }

        public async Task<Employee?> ProcessTerminationEventAsync(TerminationEventDto terminationEvent)
        {
            var employee = await _dbContext.Employees.FindAsync(terminationEvent.EmployeeId);
            if (employee == null)
                return null;

            // Optionally, you can set a flag or move to a terminated state.
            // Since we don't have a termination status on Employee, we might:
            // 1. Add a TerminationDate property to Employee (requires migration)
            // 2. Or, create a Termination record in a separate table.
            // For simplicity, we'll just log the termination and leave the employee active in the system.
            // In a real system, you might want to deactivate the employee.

            // Example: Create a termination log (if you have such an entity)
            // For now, we just return the employee (unchanged) and let the caller handle any additional logic.

            // If you want to mark the employee as inactive, you would need to add an IsActive property to Employee.
            // Since we don't have that, we'll just return the employee and note that the termination was processed.

            // Alternatively, you could create a TerminationHistory record.
            // We'll leave that as an extension point.

            await _dbContext.SaveChangesAsync();

            return employee;
        }

        public async Task<Employee?> ProcessAbsenceEventAsync(AbsenceEventDto absenceEvent)
        {
            var employee = await _dbContext.Employees.FindAsync(absenceEvent.EmployeeId);
            if (employee == null)
                return null;

            // Similarly, we don't have an absence tracking entity by default.
            // You would typically create an Absence record in a separate table.
            // For now, we just return the employee and note that the absence was processed.

            // Example: Create an absence record (if you have an Absence entity)
            // var absence = new Absence { ... };
            // _dbContext.Absences.Add(absence);
            // await _dbContext.SaveChangesAsync();

            await _dbContext.SaveChangesAsync();

            return employee;
        }

        public async Task<Employee?> ProcessTransferEventAsync(TransferEventDto transferEvent)
        {
            var employee = await _dbContext.Employees.FindAsync(transferEvent.EmployeeId);
            if (employee == null)
                return null;

            // Update the employee's department, branch, or job role as specified
            if (transferEvent.NewDepartmentId.HasValue)
            {
                var department = await _dbContext.Departments.FindAsync(transferEvent.NewDepartmentId.Value);
                if (department == null)
                    throw new KeyNotFoundException($"Department with ID {transferEvent.NewDepartmentId.Value} not found.");
                employee.DepartmentId = transferEvent.NewDepartmentId.Value;
            }

            if (transferEvent.NewBranchId.HasValue)
            {
                var branch = await _dbContext.Branches.FindAsync(transferEvent.NewBranchId.Value);
                if (branch == null)
                    throw new KeyNotFoundException($"Branch with ID {transferEvent.NewBranchId.Value} not found.");
                employee.BranchId = transferEvent.NewBranchId.Value;
            }

            if (!string.IsNullOrEmpty(transferEvent.NewJobRole))
            {
                employee.JobRole = transferEvent.NewJobRole;
                // If you have a JobRole entity, you might also set JobRoleNavigation and JobRoleId
            }

            await _dbContext.SaveChangesAsync();

            return employee;
        }
    }
}