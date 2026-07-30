using System;
using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models
{
    /// <summary>
    /// Rappresenta una valutazione del rischio per una mansione o un'attività
    /// </summary>
    public class RiskAssessment
    {
        public int Id { get; set; }
        
        public int RiskFactorId { get; set; }
        public RiskFactor? RiskFactor { get; set; }
        
        public int? JobRoleId { get; set; }
        public JobRole? JobRole { get; set; }
        
        public int CurrentRiskLevel { get; set; } // Livello di rischio attuale (1-5)
        public int TargetRiskLevel { get; set; } // Livello di rischio obiettivo dopo le misure (1-5)
        
        public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;
        public string? Assessor { get; set; } // Persona che ha effettuato la valutazione
        public string? ControlMeasures { get; set; } // Misure di controllo implementate o da implementare
        public DateTime? NextReviewDate { get; set; } // Data di revisione prevista
        
        public string? AssessmentNotes { get; set; } // Note sulla valutazione
        
        // Denormalized properties for display purposes (not mapped to database)
        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public string? RiskFactorName => RiskFactor?.Name;
        
        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public string? JobRoleName => JobRole?.Name;
    }
}