using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedWork.Api.Models
{
    public class CardiologistReport
    {
        public int Id { get; set; }

        // Link to the VisitExam (or MedicalVisit) that this report is for
        public int VisitExamId { get; set; }
        public VisitExam VisitExam { get; set; } = null!;

        // The cardiologist (doctor) who created the report
        public int CardiologistId { get; set; }
        public Doctor Cardiologist { get; set; } = null!;

        // The report content (findings, conclusion, etc.)
        [Required]
        public string ReportContent { get; set; } = string.Empty;

        // Status of the report: Pending, Completed, etc.
        public string Status { get; set; } = "Pending";

        // For multi-tenancy - links to company
        public int CompanyId { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Optional: if the cardiologist signs off, we might want a signature or confirmation
        public bool IsSignedOff { get; set; } = false;
        public DateTime? SignedOffAt { get; set; }
    }
}