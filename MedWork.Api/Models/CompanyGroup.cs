using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedWork.Api.Models;

public enum GroupType
{
    Holding = 1,
    Consorzio = 2,
    ATI = 3,
    ReteImprese = 4,
    Franchising = 5,
    JointVenture = 6,
    Altro = 99
}

public enum GroupStatus
{
    Attivo = 1,
    InLiquidazione = 2,
    Sciolto = 3,
    Sospeso = 4,
    InCostituzione = 5
}

public enum MembershipStatus
{
    Active = 1,
    Pending = 2,
    Suspended = 3,
    Left = 4
}

public enum GroupDoctorRole
{
    Coordinatore = 1,
    MedicoCompetente = 2,
    Collaboratore = 3
}

public enum BillingFrequency
{
    Mensile = 1,
    Trimestrale = 2,
    Semestrale = 3,
    Annuale = 4,
    PerVisita = 5
}

/// <summary>
/// A logical grouping of companies that share economic control, common ownership, or belong to the same corporate holding/consortium.
/// Used for consolidated reporting, shared medical protocols, common risk factors, unified billing and administrative processes,
/// and group-wide health and safety policies (D.Lgs 81/08 compliance).
/// </summary>
public class CompanyGroup
{
    public int Id { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(200)]
    public string? LegalName { get; set; }

    [StringLength(250)]
    public string? Address { get; set; }

    [StringLength(100)]
    public string? City { get; set; }

    [StringLength(10)]
    public string? PostalCode { get; set; }

    [StringLength(100)]
    public string? Province { get; set; }

    [StringLength(13)]
    [RegularExpression("^[A-Z]{2}[0-9]{11}$|^[0-9]{11}$", ErrorMessage = "Formato Partita IVA non valido: XX123456789 o 12345678901")]
    public string? VATNumber { get; set; }

    [StringLength(16)]
    [RegularExpression("^[A-Z0-9]{11,16}$", ErrorMessage = "Formato Codice Fiscale non valido")]
    public string? TaxCode { get; set; }

    public bool SingleArchive { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // NEW: Group-level configuration
    [Required]
    public GroupType Type { get; set; } = GroupType.Altro;

    [Required]
    public GroupStatus Status { get; set; } = GroupStatus.Attivo;

    [StringLength(50)]
    public string? LegalForm { get; set; }

    [StringLength(50)]
    public string? ShareCapital { get; set; }

    [StringLength(20)]
    public string? RegistrationNumber { get; set; }

    [StringLength(100)]
    public string? PEC { get; set; }

    [StringLength(150)]
    public string? ContactEmail { get; set; }

    [StringLength(30)]
    public string? ContactPhone { get; set; }

    // NEW: Inheritance / propagation configuration
    [Required]
    public bool PropagateProtocols { get; set; } = true;

    [Required]
    public bool PropagateRiskFactors { get; set; } = true;

    [Required]
    public bool PropagateDoctors { get; set; } = false;

    [Required]
    public bool PropagateVisitSchedules { get; set; } = false;

    [Required]
    public bool ConsolidatedBilling { get; set; } = false;

    // NEW: Compliance / governance
    [StringLength(100)]
    public string? LegalRepresentative { get; set; }

    [StringLength(16)]
    [RegularExpression("^[A-Z0-9]{11,16}$", ErrorMessage = "Formato Codice Fiscale non valido")]
    public string? LegalRepTaxCode { get; set; }

    [StringLength(100)]
    public string? RSPPGroup { get; set; }

    [StringLength(100)]
    public string? MedicoCompetenteGroup { get; set; }

    public DateTime? LastComplianceReview { get; set; }

    [StringLength(500)]
    public string? ComplianceNotes { get; set; }

    // Navigation properties
    [Required]
    public int TenantId { get; set; }

    [ForeignKey("TenantId")]
    public Tenant? Tenant { get; set; }

    public virtual ICollection<Company> Companies { get; set; } = new List<Company>();

    public virtual ICollection<GroupProtocol> GroupProtocols { get; set; } = new List<GroupProtocol>();

    public virtual ICollection<GroupRiskFactor> GroupRiskFactors { get; set; } = new List<GroupRiskFactor>();

    public virtual ICollection<GroupDoctor> GroupDoctors { get; set; } = new List<GroupDoctor>();

    public virtual ICollection<GroupBillingConfig> GroupBillingConfigs { get; set; } = new List<GroupBillingConfig>();

    public virtual ICollection<CompanyGroupMembership> GroupMemberships { get; set; } = new List<CompanyGroupMembership>();
}

/// <summary>
/// Gruppo protocollo - assegnazione di protocolli al livello di gruppo.
/// Ogni GroupProtocol determina quali protocolli sanitari/deadline devono essere applicati alle aziende appartenenti al gruppo.
/// </summary>
public class GroupProtocol
{
    public int Id { get; set; }

    [Required]
    public int CompanyGroupId { get; set; }

    [Required]
    public int ProtocolId { get; set; }

    [Required]
    public bool IsMandatory { get; set; } = true;

    [StringLength(50)]
    public string? FrequencyOverride { get; set; }

    public int? FrequencyMonthsOverride { get; set; }

    public string? Notes { get; set; }

    [Required]
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("CompanyGroupId")]
    public virtual CompanyGroup? CompanyGroup { get; set; }

    [ForeignKey("ProtocolId")]
        public virtual Protocol? Protocol { get; set; }
    }

/// <summary>
/// Gruppo fattore di rischio - assegnazione di fattori di rischio al livello di gruppo.
/// </summary>
public class GroupRiskFactor
{
    public int Id { get; set; }

    [Required]
    public int CompanyGroupId { get; set; }

    [Required]
    public int RiskFactorId { get; set; }

    [Required]
    public RiskLevel Level { get; set; }

    [Required]
    public bool AppliesToAllCompanies { get; set; } = true;

    [StringLength(500)]
    public string? SpecificCompanyIds { get; set; } // JSON array if not all

    public string? Notes { get; set; }

    [Required]
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("CompanyGroupId")]
    public virtual CompanyGroup? CompanyGroup { get; set; }

    [ForeignKey("RiskFactorId")]
        public virtual RiskFactor? RiskFactor { get; set; }
    }

/// <summary>
/// Gruppo medico - assegnazione di medici al livello di gruppo (coordinatori, medici competenti, collaboratori).
/// </summary>
public class GroupDoctor
{
    public int Id { get; set; }

    [Required]
    public int CompanyGroupId { get; set; }

    [Required]
    public int DoctorId { get; set; }

    [Required]
    public GroupDoctorRole Role { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    [StringLength(50)]
    public string? UntilDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    // Navigation
    [ForeignKey("CompanyGroupId")]
    public virtual CompanyGroup? CompanyGroup { get; set; }

    [ForeignKey("DoctorId")]
        public virtual Doctor? Doctor { get; set; }
    }

/// <summary>
/// Configurazione di fatturazione a livello di gruppo.
/// Definisce come fatturare i servizi per tutte le aziende del gruppo (fatturazione consolidata o per singola azienda).
/// </summary>
public class GroupBillingConfig
{
    public int Id { get; set; }

    [Required]
    public int CompanyGroupId { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public BillingFrequency Frequency { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? FixedFee { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PerVisitFee { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PerEmployeeFee { get; set; }

    [StringLength(50)]
    public int? PaymentTermsDays { get; set; }

    [StringLength(20)]
    public string? PaymentMethod { get; set; }

    [StringLength(20)]
    public string? IBAN { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime ValidFrom { get; set; }

    [StringLength(50)]
    public DateTime? ValidUntil { get; set; }

    // Navigation
    [ForeignKey("CompanyGroupId")]
    public virtual CompanyGroup? CompanyGroup { get; set; }
}

/// <summary>
/// Membriership di un'azienda in un gruppo, con metadati temporali e stato.
/// </summary>
public class CompanyGroupMembership
{
    public int Id { get; set; }

    [Required]
    public int CompanyGroupId { get; set; }

    [Required]
    public int CompanyId { get; set; }

    [Required]
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    [StringLength(50)]
    public DateTime? LeftAt { get; set; }

    [Required]
    public MembershipStatus Status { get; set; } = MembershipStatus.Active;

    [StringLength(500)]
    public string? Notes { get; set; }

    // Navigation
    [ForeignKey("CompanyGroupId")]
    public virtual CompanyGroup? CompanyGroup { get; set; }

    [ForeignKey("CompanyId")]
        public virtual Company? Company { get; set; }
    }