using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Employee
{
    public int Id { get; set; }

    [StringLength(100)]
    public string? ExternalId { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }

    [Range(1, int.MaxValue)]
    public int BranchId { get; set; }

    [Range(1, int.MaxValue)]
    public int? DepartmentId { get; set; }

    [Range(1, int.MaxValue)]
    public int? WorkLocationId { get; set; }

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

    [StringLength(120)]
    public string? BirthProvince { get; set; }

    [StringLength(2)]
    public string? BirthCountryCode { get; set; } = "IT";

    [EmailAddress]
    [StringLength(150)]
    public string? PersonalEmail { get; set; }

    [Phone]
    [StringLength(30)]
    public string? PhoneNumber { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [StringLength(120)]
    public string? City { get; set; }

    [StringLength(100)]
    public string? Province { get; set; }

    [StringLength(10)]
    public string? PostalCode { get; set; }

    [StringLength(50)]
    public string? Nationality { get; set; } = "IT";

    [StringLength(100)]
    public string? EducationLevel { get; set; }

    public DateTime HireDate { get; set; } = DateTime.UtcNow;

    public DateTime? TerminationDate { get; set; }

    [StringLength(50)]
    public string? ContractType { get; set; }

    [StringLength(100)]
    public string? Qualification { get; set; }

    [Range(1, int.MaxValue)]
    public int? JobRoleId { get; set; }

    [Range(1, int.MaxValue)]
    public int? RiskLevelId { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsArchived { get; set; } = false;

    public bool ConsentGDPR { get; set; } = false;

    public DateTime? ConsentGDPRDate { get; set; }

    public bool ConsentHealthData { get; set; } = false;

    public DateTime? ConsentHealthDataDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Company? Company { get; set; }
    public Branch? Branch { get; set; }
    public Department? Department { get; set; }
    public WorkLocation? WorkLocation { get; set; }
    public JobRole? JobRoleNavigation { get; set; }
    public RiskLevel? RiskLevel { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }
    public ICollection<EmployeeRisk> EmployeeRisks { get; set; } = new List<EmployeeRisk>();
    public ICollection<MedicalVisit> MedicalVisits { get; set; } = new List<MedicalVisit>();
    public ICollection<PersonalProtocol> PersonalProtocols { get; set; } = new List<PersonalProtocol>();
    public ICollection<ScheduledExam> ScheduledExams { get; set; } = new List<ScheduledExam>();
    public ICollection<Vaccination> Vaccinations { get; set; } = new List<Vaccination>();
    public ICollection<NotificationLog> NotificationLogs { get; set; } = new List<NotificationLog>();
}