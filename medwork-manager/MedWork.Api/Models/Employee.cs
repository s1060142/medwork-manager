using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Employee
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }

    [Range(1, int.MaxValue)]
    public int BranchId { get; set; }

    [Range(1, int.MaxValue)]
    public int? DepartmentId { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^[A-Z0-9]{16}$")]
    public string TaxCode { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string JobRole { get; set; } = string.Empty;

    [Required]
    public DateTime BirthDate { get; set; }

    [Required]
    [RegularExpression("^[MF]$")]
    public string Gender { get; set; } = "M";

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string BirthCity { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^[A-Z][0-9]{3}$")]
    public string BirthCityCode { get; set; } = string.Empty;

    [EmailAddress]
    [StringLength(150)]
    public string? PersonalEmail { get; set; }

    [Phone]
    [StringLength(30)]
    public string? PhoneNumber { get; set; }

    [Range(1, int.MaxValue)]
    public int? JobRoleId { get; set; }

    public Company? Company { get; set; }
    public Branch? Branch { get; set; }
    public Department? Department { get; set; }
    public JobRole? JobRoleNavigation { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }
    public ICollection<EmployeeRisk> EmployeeRisks { get; set; } = new List<EmployeeRisk>();
    public ICollection<MedicalVisit> MedicalVisits { get; set; } = new List<MedicalVisit>();
    public ICollection<PersonalProtocol> PersonalProtocols { get; set; } = new List<PersonalProtocol>();
    public ICollection<ScheduledExam> ScheduledExams { get; set; } = new List<ScheduledExam>();
    public ICollection<Vaccination> Vaccinations { get; set; } = new List<Vaccination>();
    public ICollection<NotificationLog> NotificationLogs { get; set; } = new List<NotificationLog>();
}
