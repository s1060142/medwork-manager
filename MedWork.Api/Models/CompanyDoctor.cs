namespace MedWork.Api.Models;

/// <summary>
/// Join entity linking a doctor to a company. A company can have many coordinated
/// doctors and optionally one coordinator. Assignments are scoped per company.
/// </summary>
public class CompanyDoctor
{
    public int Id { get; set; }

    public int CompanyId { get; set; }

    public int DoctorId { get; set; }

    /// <summary>
    /// True when this doctor is the single coordinating doctor for the company.
    /// </summary>
    public bool IsCoordinator { get; set; }

    public virtual Company? Company { get; set; }

    public virtual Doctor? Doctor { get; set; }
}
