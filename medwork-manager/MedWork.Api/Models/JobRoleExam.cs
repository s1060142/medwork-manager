using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class JobRoleExam
{
    public int JobRoleId { get; set; }
    public JobRole? JobRole { get; set; }

    public int ExamTypeId { get; set; }
    public ExamType? ExamType { get; set; }

    public int PeriodicityMonths { get; set; } = 12;
    public bool IsMandatory { get; set; } = true;
}
