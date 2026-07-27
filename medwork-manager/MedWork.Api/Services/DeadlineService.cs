using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Services;

public record DeadlineAlert(
    int EmployeeId,
    string EmployeeName,
    string CompanyName,
    string Kind,          // "Visita" | "Accertamento"
    DateTime DueDate,
    int DaysRemaining,
    string Severity);     // "Scaduta" | "Urgente" (<=30gg) | "InScadenza" (<=60gg) | "Pianificata" (<=90gg)

public interface IDeadlineService
{
    Task<IReadOnlyList<DeadlineAlert>> GetUpcomingDeadlinesAsync(int horizonDays = 90, CancellationToken ct = default);
    Task<int> GenerateRemindersAsync(int horizonDays = 30, CancellationToken ct = default);
}

public class DeadlineService : IDeadlineService
{
    private readonly AppDbContext _db;
    private readonly ILogger<DeadlineService> _logger;

    public DeadlineService(AppDbContext db, ILogger<DeadlineService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<IReadOnlyList<DeadlineAlert>> GetUpcomingDeadlinesAsync(int horizonDays = 90, CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;
        var horizon = today.AddDays(horizonDays);
        var alerts = new List<DeadlineAlert>();

        // Ultima visita per lavoratore -> NextDeadlineDate in scadenza o scaduta
        var visits = await _db.MedicalVisits
            .AsNoTracking()
            .Include(v => v.Employee)!.ThenInclude(e => e!.Company)
            .Where(v => v.NextDeadlineDate <= horizon)
            .ToListAsync(ct);

        var visitDeadlines = visits
            .GroupBy(v => v.EmployeeId)
            .Select(g => g.OrderByDescending(v => v.VisitDate).First())
            .ToList();

        foreach (var v in visitDeadlines)
        {
            var days = (int)(v.NextDeadlineDate.Date - today).TotalDays;
            alerts.Add(new DeadlineAlert(
                v.EmployeeId,
                $"{v.Employee?.FirstName} {v.Employee?.LastName}".Trim(),
                v.Employee?.Company?.Name ?? "-",
                "Visita",
                v.NextDeadlineDate,
                days,
                Classify(days)));
        }

        // Accertamenti pianificati in scadenza
        var examDeadlines = await _db.ScheduledExams
            .AsNoTracking()
            .Include(s => s.Employee)!.ThenInclude(e => e!.Company)
            .Where(s => s.Status == ScheduledExamStatus.Planned && s.DueDate <= horizon)
            .ToListAsync(ct);

        foreach (var s in examDeadlines)
        {
            var days = (int)(s.DueDate.Date - today).TotalDays;
            alerts.Add(new DeadlineAlert(
                s.EmployeeId,
                $"{s.Employee?.FirstName} {s.Employee?.LastName}".Trim(),
                s.Employee?.Company?.Name ?? "-",
                "Accertamento",
                s.DueDate,
                days,
                Classify(days)));
        }

        return alerts.OrderBy(a => a.DueDate).ToList();
    }

    public async Task<int> GenerateRemindersAsync(int horizonDays = 30, CancellationToken ct = default)
    {
        var alerts = await GetUpcomingDeadlinesAsync(horizonDays, ct);
        var today = DateTime.UtcNow.Date;
        var created = 0;

        foreach (var alert in alerts)
        {
            // Dedup: max un promemoria per lavoratore/tipo al giorno.
            // Usa ReminderKey (colonna NON cifrata) con uguaglianza esatta invece di LIKE su
            // MessageText (cifrato): un predicato LIKE sul testo cifrato genera Error 506
            // "invalid escape character in LIKE" per via dei caratteri _ [ ] nel payload.
            var marker = $"[SCADENZARIO:{alert.Kind}:{alert.DueDate:yyyy-MM-dd}]";
            var alreadySent = await _db.NotificationLogs
                .IgnoreQueryFilters()
                .AnyAsync(n => n.EmployeeId == alert.EmployeeId
                    && n.SentDate >= today
                    && n.ReminderKey == marker, ct);

            if (alreadySent) continue;

            _db.NotificationLogs.Add(new NotificationLog
            {
                EmployeeId = alert.EmployeeId,
                Channel = NotificationChannel.Email,
                SentDate = DateTime.UtcNow,
                ReminderKey = marker,
                MessageText = $"{marker} {alert.Kind} in scadenza il {alert.DueDate:dd/MM/yyyy} " +
                              $"({(alert.DaysRemaining < 0 ? $"SCADUTA da {-alert.DaysRemaining} giorni" : $"tra {alert.DaysRemaining} giorni")}) " +
                              $"per {alert.EmployeeName} — {alert.CompanyName}."
            });
            created++;
        }

        if (created > 0)
        {
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Scadenzario: creati {Count} promemoria", created);
        }

        return created;
    }

    private static string Classify(int days) => days switch
    {
        < 0 => "Scaduta",
        <= 30 => "Urgente",
        <= 60 => "InScadenza",
        _ => "Pianificata"
    };
}

/// <summary>
/// Job notturno: ogni 24h calcola le scadenze e genera i promemoria nel NotificationLog.
/// </summary>
public class DeadlineBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DeadlineBackgroundService> _logger;

    public DeadlineBackgroundService(IServiceScopeFactory scopeFactory, ILogger<DeadlineBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Prima esecuzione 30s dopo l'avvio, poi ogni 24 ore
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var deadlineService = scope.ServiceProvider.GetRequiredService<IDeadlineService>();
                var count = await deadlineService.GenerateRemindersAsync(30, stoppingToken);
                _logger.LogInformation("DeadlineBackgroundService: run completata, {Count} promemoria generati", count);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DeadlineBackgroundService: errore durante la run");
            }

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}
