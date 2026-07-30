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
}