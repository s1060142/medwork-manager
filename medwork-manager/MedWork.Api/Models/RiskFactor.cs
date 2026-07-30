using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models
{
    public class RiskFactor
    {
        public int Id { get; set; }

        [Required]
        [StringLength(120)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(120)]
        public string? Allegato3BCategory { get; set; }

        [StringLength(20)]
        public string? Code { get; set; }

        /// <summary>
        /// Livello di gravità (1-5)
        /// </summary>
        [Range(1, 5)]
        public int SeverityLevel { get; set; } = 1;

        /// <summary>
        /// Data dell'ultima valutazione
        /// </summary>
        public DateTime? LastAssessed { get; set; }

        /// <summary>
        /// Note sulla valutazione del rischio
        /// </summary>
        public string? AssessmentNotes { get; set; }

        public ICollection<EmployeeRisk> EmployeeRisks { get; set; } = new List<EmployeeRisk>();
        public ICollection<JobRoleRiskFactor> JobRoleRiskFactors { get; set; } = new List<JobRoleRiskFactor>();
        public ICollection<VisitRisk> VisitRisks { get; set; } = new List<VisitRisk>();
        public ICollection<Ppe> Ppes { get; set; } = new List<Ppe>();
    }
}