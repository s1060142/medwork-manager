using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ReportJobRoleProtocols
{
    public int Id { get; set; }

    public int JobRoleId { get; set; }
    public JobRole? JobRole { get; set; }

    public int ProtocolId { get; set; }
    public Protocol? Protocol { get; set; }

    public int PeriodicityMonths { get; set; }
    public bool IsMandatory { get; set; } = true;
}
