using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MedWork.Api.Services;

/// <summary>
/// Service for managing cardiologist reports (tele-reporting of ECG exams).
/// </summary>
public class CardiologistReportService : ICardiologistReportService
{
    private readonly AppDbContext _dbContext;

    public CardiologistReportService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CardiologistReport?> GetByIdAsync(int id)
    {
        return await _dbContext.CardiologistReports
            .AsNoTracking()
            .Include(r => r.VisitExam)
            .Include(r => r.Cardiologist)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<CardiologistReport>> GetPendingReportsAsync(int cardiologistId)
    {
        return await _dbContext.CardiologistReports
            .AsNoTracking()
            .Include(r => r.VisitExam)
            .ThenInclude(v => v.MedicalVisit)
            .ThenInclude(m => m.Employee)
            .Include(r => r.Cardiologist)
            .Where(r => r.CardiologistId == cardiologistId && r.Status == "Pending")
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<CardiologistReport>> GetReportsByVisitExamIdAsync(int visitExamId)
    {
        return await _dbContext.CardiologistReports
            .AsNoTracking()
            .Include(r => r.VisitExam)
            .Include(r => r.Cardiologist)
            .Where(r => r.VisitExamId == visitExamId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<CardiologistReport> CreateAsync(CardiologistReport report)
    {
        _dbContext.CardiologistReports.Add(report);
        await _dbContext.SaveChangesAsync();
        return report;
    }

    public async Task<CardiologistReport?> UpdateAsync(int id, CardiologistReport report)
    {
        var existing = await _dbContext.CardiologistReports.FindAsync(id);
        if (existing == null)
        {
            return null;
        }

        existing.ReportContent = report.ReportContent;
        existing.Status = report.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _dbContext.CardiologistReports.FindAsync(id);
        if (existing == null)
        {
            return false;
        }

        _dbContext.CardiologistReports.Remove(existing);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SignOffAsync(int id, string cardiologistId)
    {
        var existing = await _dbContext.CardiologistReports.FindAsync(id);
        if (existing == null)
        {
            return false;
        }

        existing.IsSignedOff = true;
        existing.SignedOffAt = DateTime.UtcNow;
        existing.Status = "Completed";

        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Riepilogo di un esame ECG in coda presso i cardiologi (telerefertazione).
    /// </summary>
    public sealed record EcgExamSummary(
        int VisitExamId,
        int MedicalVisitId,
        int EmployeeId,
        string EmployeeName,
        string CompanyName,
        string ExamTypeName,
        string Result,
        DateTime VisitDate,
        bool HasReport);

    public async Task<IEnumerable<EcgExamSummary>> GetEcgQueueAsync()
    {
        // Esami di tipo cardiologico (es. ECG) ancora privi di referto firmato.
        var ecgExams = await _dbContext.VisitExams
            .AsNoTracking()
            .Include(v => v.ExamType)
            .Include(v => v.MedicalVisit!)
                .ThenInclude(m => m.Employee!)
                .ThenInclude(e => e.Company)
            .Where(v => v.ExamType != null && v.ExamType.Category == "Cardiologico")
            .OrderByDescending(v => v.MedicalVisit!.VisitDate)
            .Select(v => new
            {
                v.Id,
                v.MedicalVisitId,
                EmployeeId = v.MedicalVisit!.EmployeeId,
                EmployeeName = (v.MedicalVisit.Employee.FirstName + " " + v.MedicalVisit.Employee.LastName),
                CompanyName = v.MedicalVisit.Employee.Company != null ? v.MedicalVisit.Employee.Company.Name : "-",
                v.ExamType!.Name,
                v.Result,
                VisitDate = v.MedicalVisit.VisitDate,
            })
            .ToListAsync();

        // Referti già esistenti per quegli esami (qualsiasi stato).
        var visitExamIds = ecgExams.Select(x => x.Id).ToList();
        var reportedIds = await _dbContext.CardiologistReports
            .AsNoTracking()
            .Where(r => visitExamIds.Contains(r.VisitExamId))
            .Select(r => r.VisitExamId)
            .ToListAsync();

        var reportedSet = new HashSet<int>(reportedIds);

        return ecgExams
            .Where(x => !reportedSet.Contains(x.Id))
            .Select(x => new EcgExamSummary(
                x.Id,
                x.MedicalVisitId,
                x.EmployeeId,
                x.EmployeeName,
                x.CompanyName,
                x.Name,
                x.Result,
                x.VisitDate,
                false))
            .ToList();
    }

    public async Task<IEnumerable<CardiologistReport>> GetAllReportsAsync(string? status = null)
    {
        var query = _dbContext.CardiologistReports
            .AsNoTracking()
            .Include(r => r.VisitExam)
                .ThenInclude(v => v.MedicalVisit)
                .ThenInclude(m => m.Employee)
            .Include(r => r.Cardiologist)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.Status == status);
        }

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }
}