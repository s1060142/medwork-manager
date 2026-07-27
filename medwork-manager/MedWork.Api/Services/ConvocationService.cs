using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MedWork.Api.Services;

public interface IConvocationService
{
    Task<byte[]> GenerateConvocationPdfAsync(int employeeId, DateTime visitDate, string visitType, string? location, CancellationToken cancellationToken = default);
    Task<NotificationLog> SendConvocationAsync(int employeeId, DateTime visitDate, string visitType, string? location, CancellationToken cancellationToken = default);
    Task<List<NotificationLog>> SendMassConvocationAsync(List<int> employeeIds, DateTime visitDate, string visitType, string? location, CancellationToken cancellationToken = default);
}

public class ConvocationService : IConvocationService
{
    private readonly AppDbContext _dbContext;
    private readonly IEmailService _emailService;

    public ConvocationService(AppDbContext dbContext, IEmailService emailService)
    {
        _dbContext = dbContext;
        _emailService = emailService;
    }

    public async Task<byte[]> GenerateConvocationPdfAsync(int employeeId, DateTime visitDate, string visitType, string? location, CancellationToken cancellationToken = default)
    {
        var employee = await _dbContext.Employees.AsNoTracking()
            .Include(e => e.Company)
            .FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken)
            ?? throw new KeyNotFoundException($"Lavoratore {employeeId} non trovato.");

        var companyName = employee.Company?.Name ?? "";
        var visitLocation = location ?? "Sede MedWork";

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Column(col =>
                {
                    col.Item().Text("SUITE MEDWORK").FontSize(20).SemiBold().FontColor(Colors.Blue.Medium);
                    col.Item().Text("Medicina del Lavoro - Sorveglianza Sanitaria").FontSize(11).FontColor(Colors.Grey.Medium);
                    col.Item().LineHorizontal(1).LineColor(Colors.Blue.Medium);
                });

                page.Content().PaddingTop(20).Column(col =>
                {
                    col.Item().Text("CONVOCAZIONE ALLA VISITA MEDICA").FontSize(16).SemiBold();
                    col.Item().PaddingTop(10).Text($"Spett.le {employee.FirstName} {employee.LastName}");
                    col.Item().Text($"Azienda: {companyName}");
                    col.Item().Text($"Mansione: {employee.JobRole}");
                    col.Item().PaddingTop(12).Text("Si convoca il lavoratore sopra indicato per la seguente visita medica:");

                    col.Item().PaddingTop(8).Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(1);
                            c.RelativeColumn(2);
                        });
                        table.Cell().Text("Data e ora:").SemiBold();
                        table.Cell().Text(visitDate.ToString("dd/MM/yyyy HH:mm"));
                        table.Cell().Text("Tipologia:").SemiBold();
                        table.Cell().Text(visitType);
                        table.Cell().Text("Luogo:").SemiBold();
                        table.Cell().Text(visitLocation);
                    });

                    col.Item().PaddingTop(12).Text(
                        "La visita rientra nel programma di Sorveglianza Sanitaria ai sensi del D.Lgs. 81/08. " +
                        "Si prega di presentarsi munito di documento identificativo. Eventuali terapie in corso " +
                        "devono essere comunicate al medico competente.");
                });

                page.Footer().Text(x =>
                {
                    x.Span("Documento generato da Suite MedWork - ").FontSize(8);
                    x.Span(DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm")).FontSize(8);
                });
            });
        });

        return doc.GeneratePdf();
    }

    public async Task<NotificationLog> SendConvocationAsync(int employeeId, DateTime visitDate, string visitType, string? location, CancellationToken cancellationToken = default)
    {
        var employee = await _dbContext.Employees.AsNoTracking()
            .Include(e => e.Company)
            .FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken)
            ?? throw new KeyNotFoundException($"Lavoratore {employeeId} non trovato.");

        var pdf = await GenerateConvocationPdfAsync(employeeId, visitDate, visitType, location, cancellationToken);

        var subject = $"Convocazione visita medica - {employee.FirstName} {employee.LastName}";
        var body = $"<p>Gentile {employee.FirstName} {employee.LastName},</p>" +
                   $"<p>Le inviamo in allegato la convocazione per la visita medica <strong>{visitType}</strong> " +
                   $"programmata il <strong>{visitDate:dd/MM/yyyy HH:mm}</strong>.</p>" +
                   $"<p>Cordiali saluti,<br/>Suite MedWork - Medicina del Lavoro</p>";

        var destination = employee.PersonalEmail
            ?? employee.Company?.ContactEmail
            ?? "";

        if (!string.IsNullOrWhiteSpace(destination))
        {
            await _emailService.SendAsync(destination, subject, body, pdf, $"convocazione-{employee.Id}.pdf", cancellationToken);
        }

        var entry = new NotificationLog
        {
            EmployeeId = employeeId,
            Channel = NotificationChannel.Email,
            SentDate = DateTime.UtcNow,
            MessageText = $"Convocazione {visitType} per {visitDate:dd/MM/yyyy HH:mm} inviata a {destination}"
        };

        _dbContext.NotificationLogs.Add(entry);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entry;
    }

    public async Task<List<NotificationLog>> SendMassConvocationAsync(List<int> employeeIds, DateTime visitDate, string visitType, string? location, CancellationToken cancellationToken = default)
    {
        var results = new List<NotificationLog>();
        foreach (var id in employeeIds)
        {
            try
            {
                results.Add(await SendConvocationAsync(id, visitDate, visitType, location, cancellationToken));
            }
            catch (KeyNotFoundException)
            {
                // Salta i dipendenti non trovati senza interrompere la massa.
                Console.WriteLine($"[ConvocationService] Dipendente {id} non trovato, skip.");
            }
        }
        return results;
    }
}
