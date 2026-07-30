using System;

namespace MedWork.Api.Models
{
    /// <summary>
    /// Data transfer object for HR hire event
    /// </summary>
    public class HireEventDto
    {
        public string FirstName { get; set; } = default!;
        public string LastName { get; set; } = default!;
        public string TaxCode { get; set; } = default!;
        public string JobRole { get; set; } = default!;
        public DateTime BirthDate { get; set; }
        public string Gender { get; set; } = default!; // "M" or "F"
        public string BirthCity { get; set; } = default!;
        public string BirthCityCode { get; set; } = default!;
        public string? PersonalEmail { get; set; }
        public string? PhoneNumber { get; set; }
        public int CompanyId { get; set; }
        public int BranchId { get; set; }
        public int? DepartmentId { get; set; }
        public DateTime HireDate { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Data transfer object for HR termination event
    /// </summary>
    public class TerminationEventDto
    {
        public int EmployeeId { get; set; }
        public DateTime TerminationDate { get; set; } = DateTime.UtcNow;
        public string? Reason { get; set; }
    }

    /// <summary>
    /// Data transfer object for HR absence event (e.g., leave, sick)
    /// </summary>
    public class AbsenceEventDto
    {
        public int EmployeeId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string AbsenceType { get; set; } = default!; // e.g., "Sick", "Vacation", "Unpaid"
        public string? Description { get; set; }
    }

    /// <summary>
    /// Data transfer object for HR transfer event (change of department, branch, job role)
    /// </summary>
    public class TransferEventDto
    {
        public int EmployeeId { get; set; }
        public int? NewDepartmentId { get; set; }
        public int? NewBranchId { get; set; }
        public string? NewJobRole { get; set; }
        public DateTime TransferDate { get; set; } = DateTime.UtcNow;
        public string? Reason { get; set; }
    }
}