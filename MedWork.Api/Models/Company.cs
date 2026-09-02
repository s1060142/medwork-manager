using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Company
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(100)]
    public string? LegalName { get; set; }

    [RegularExpression("^[A-Z]{2}[0-9]{11}$|^[0-9]{11}$")]
    public string? VATNumber { get; set; }

    [StringLength(16)]
    public string? TaxCode { get; set; }

    [StringLength(10)]
    public string? ATECOCode { get; set; }

    [StringLength(50)]
    public string? REANumber { get; set; }

    [EmailAddress]
    [StringLength(150)]
    public string? ContactEmail { get; set; }

    [EmailAddress]
    [StringLength(150)]
    public string? PEC { get; set; }

    // Phone fields: accept realistic Italian/international formats (digits, +, spaces,
    // dashes, dots, parentheses, slashes). The strict [Phone] data annotation built into
    // .NET rejects common real-world values (e.g. "02 1234567", "+39 02/1234567",
    // "02-1234-5678") which made it impossible to save otherwise-valid company profiles.
    [RegularExpression(@"^[\d+\-\s\.\(\)/]{0,30}$", ErrorMessage = "Il campo Telefono contiene caratteri non ammessi.")]
    [StringLength(30)]
    public string? ContactPhone { get; set; }

    [RegularExpression(@"^[\d+\-\s\.\(\)/]{0,30}$", ErrorMessage = "Il campo Fax contiene caratteri non ammessi.")]
    [StringLength(30)]
    public string? Fax { get; set; }

    [StringLength(500)]
    public string? LegalAddress { get; set; }

    [StringLength(500)]
    public string? OperationalAddress { get; set; }

    [StringLength(120)]
    public string? LegalRepresentative { get; set; }

    [StringLength(150)]
    public string? RSPP { get; set; }

    [StringLength(150)]
    public string? RLS { get; set; }

    [StringLength(100)]
    public string? RiskClass { get; set; }

    [StringLength(100)]
    public string? INAILPosition { get; set; }

    [StringLength(100)]
    public string? INAILPolicyNumber { get; set; }

    public bool IsActive { get; set; } = true;

    // Extended fields added in 2026-09 to align with frontend entityConfigs.js.
    // All nullable so existing data is preserved.
    [StringLength(500)] public string? Activity { get; set; }
    [StringLength(200)] public string? OperationalUnitName { get; set; }
    [StringLength(50)] public string? Type { get; set; }
    [StringLength(120)] public string? Reference { get; set; }
    [StringLength(50)] public string? Status { get; set; }
    [StringLength(100)] public string? OperationalCity { get; set; }
    [StringLength(10)] public string? OperationalPostalCode { get; set; }
    [StringLength(100)] public string? OperationalProvince { get; set; }
    [StringLength(100)] public string? LegalCity { get; set; }
    [StringLength(10)] public string? LegalPostalCode { get; set; }
    [StringLength(100)] public string? LegalProvince { get; set; }
    [StringLength(100)] public string? Country { get; set; }
    [StringLength(250)] public string? DocumentStorageLocation { get; set; }
    [StringLength(250)] public string? UsualVisitLocation { get; set; }
    [StringLength(250)] public string? Clinic { get; set; }
    [EmailAddress] [StringLength(150)] public string? CommunicationsEmail { get; set; }
    [EmailAddress] [StringLength(150)] public string? BillingEmail { get; set; }
    [StringLength(120)] public string? InternalContactName { get; set; }
    [EmailAddress] [StringLength(150)] public string? InternalContactEmail { get; set; }
    [StringLength(50)] public string? ExternalCode { get; set; }
    [StringLength(1000)] public string? Notes { get; set; }
    [StringLength(10)] public string? RecipientCode { get; set; }
    [StringLength(50)] public string? ContractIdentifier { get; set; }
    [StringLength(50)] public string? OrderCode { get; set; }
    [StringLength(50)] public string? CUPCode { get; set; }
    [StringLength(50)] public string? CIGCode { get; set; }
    [StringLength(50)] public string? PaymentTerms { get; set; }
    [StringLength(50)] public string? PaymentMethod { get; set; }
    [StringLength(150)] public string? AccountHolder { get; set; }
    [StringLength(150)] public string? BankName { get; set; }
    [StringLength(34)] public string? IBAN { get; set; }
    [StringLength(11)] public string? BICSwift { get; set; }
    [StringLength(5)] public string? ABI { get; set; }
    [StringLength(5)] public string? CAB { get; set; }
    [StringLength(50)] public string? IntentLetterNumber { get; set; }
    public DateTime? IntentLetterDate { get; set; }
    public DateTime? IntentLetterExpiry { get; set; }
    [StringLength(200)] public string? BankChargesDebit { get; set; }
    public decimal? BankChargesAmount { get; set; }
    [StringLength(50)] public string? SplitPayment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<CompanyContact> CompanyContacts { get; set; } = new List<CompanyContact>();
    public ICollection<Department> Departments { get; set; } = new List<Department>();
    public ICollection<WorkLocation> WorkLocations { get; set; } = new List<WorkLocation>();
    public ICollection<SiteVisit> SiteVisits { get; set; } = new List<SiteVisit>();
    public ICollection<CompanyDoctor> CompanyDoctors { get; set; } = new List<CompanyDoctor>();
}