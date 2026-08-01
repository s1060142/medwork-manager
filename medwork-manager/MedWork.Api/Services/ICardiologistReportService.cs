using MedWork.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MedWork.Api.Services;

/// <summary>
/// Service for managing cardiologist reports (tele-reporting of ECG exams).
/// </summary>
public interface ICardiologistReportService
{
    Task<CardiologistReport?> GetByIdAsync(int id);
    Task<IEnumerable<CardiologistReport>> GetPendingReportsAsync(int cardiologistId);
    Task<IEnumerable<CardiologistReport>> GetReportsByVisitExamIdAsync(int visitExamId);

    /// <summary>Restituisce gli esami ECG (VisitExam di tipo cardiologico) ancora senza referto firmato.</summary>
    Task<IEnumerable<CardiologistReportService.EcgExamSummary>> GetEcgQueueAsync();

    /// <summary>Restituisce tutti i referti cardiologici (opzionalmente filtrati per stato).</summary>
    Task<IEnumerable<CardiologistReport>> GetAllReportsAsync(string? status = null);

    Task<CardiologistReport> CreateAsync(CardiologistReport report);
    Task<CardiologistReport?> UpdateAsync(int id, CardiologistReport report);
    Task<bool> DeleteAsync(int id);
    Task<bool> SignOffAsync(int id, string cardiologistId);
}