using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class EmployeeCountHistory
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int Year { get; set; }

    public int Male30June { get; set; }
    public int Male31Dec { get; set; }
    public int Female30June { get; set; }
    public int Female31Dec { get; set; }

    public int? BranchId { get; set; }
    public Branch? Branch { get; set; }
}
