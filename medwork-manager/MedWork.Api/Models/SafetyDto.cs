using System;

namespace MedWork.Api.Models
{
    /// <summary>
    /// DTO per la segnalazione di un incidente sul lavoro
    /// </summary>
    public class IncidentReportDto
    {
        public int EmployeeId { get; set; }
        public int CompanyId { get; set; }
        public int? BranchId { get; set; }
        public int? DepartmentId { get; set; }
        public DateTime IncidentDate { get; set; } = DateTime.UtcNow;
        public string IncidentType { get; set; } = default!; // e.g., "Infortunio", "Malattia professionale", "Near miss"
        public string Description { get; set; } = default!;
        public string Location { get; set; } = default!;
        public bool IsFatal { get; set; }
        public int? LostWorkDays { get; set; }
        public bool WasReportedToAuthorities { get; set; }
        public string? Witnesses { get; set; }
        public string? ImmediateActionsTaken { get; set; }
    }

    /// <summary>
    /// DTO per l'aggiornamento di una valutazione del rischio
    /// </summary>
    public class RiskAssessmentUpdateDto
    {
        public int RiskFactorId { get; set; }
        public int? JobRoleId { get; set; }
        public int? TaskId { get; set; } // Se si vuole valutare il rischio per un task specifico
        public int CurrentRiskLevel { get; set; } // Livello di rischio attuale (1-5)
        public int TargetRiskLevel { get; set; } // Livello di rischio obiettivo dopo le misure (1-5)
        public string? ControlMeasures { get; set; } // Misure di controllo implementate o da implementare
        public DateTime? ReviewDate { get; set; } // Data di revisione prevista
        public string? ResponsiblePerson { get; set; } // Persona responsabile per l'implementazione delle misure
    }

    /// <summary>
    /// DTO per la segnalazione di un near-miss
    /// </summary>
    public class NearMissReportDto
    {
        public int EmployeeId { get; set; }
        public int CompanyId { get; set; }
        public int? BranchId { get; set; }
        public int? DepartmentId { get; set; }
        public DateTime IncidentDate { get; set; } = DateTime.UtcNow;
        public string Description { get; set; } = default!;
        public string Location { get; set; } = default!;
        public string? PotentialConsequence { get; set; } // Cosa avrebbe potuto accadere
        public string? RootCauseAnalysis { get; set; } // Analisi della causa principale (se già nota)
        public string? PreventiveActions { get; set; } // Azioni preventive suggerite o implementate
    }

    /// <summary>
    /// DTO per le statistiche di sicurezza
    /// </summary>
    public class SafetyStatisticsDto
    {
        public int TotalIncidents { get; set; }
        public int FatalInjuries { get; set; }
        public int LostTimeInjuries { get; set; }
        public int RecordableInjuries { get; set; }
        public int NearMissReports { get; set; }
        public double IncidentRatePer1000Employees { get; set; }
        public double LostTimeRatePer1000Employees { get; set; }
        public double SeverityRate { get; set; } // Giorni di lavoro persi per milione di ore lavorate
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }
}