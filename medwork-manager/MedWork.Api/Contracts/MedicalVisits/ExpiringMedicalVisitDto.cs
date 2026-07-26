namespace MedWork.Api.Contracts.MedicalVisits;

public class ExpiringMedicalVisitDto
{
    public int MedicalVisitId { get; set; }
    public string EmployeeFullName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public DateTime NextDeadlineDate { get; set; }
    public string Outcome { get; set; } = string.Empty;
    public List<VisitExamSummaryDto> Exams { get; set; } = new();
}

public class VisitExamSummaryDto
{
    public string ExamTypeName { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
}
