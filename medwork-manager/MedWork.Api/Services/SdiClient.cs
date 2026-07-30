using System.Net.Http.Headers;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Xml;
using MedWork.Api.Models;
using Microsoft.Extensions.Logging;

namespace MedWork.Api.Services;

/// <summary>
/// Client per invio/ricezione fatture elettroniche via SDI (Sistema di Interscambio)
/// Supporta canali: SDICoop (web service), SDIFtp, PEC
/// </summary>
public interface ISdiClient
{
    Task<SdiSendResult> SendInvoiceAsync(ElectronicInvoice invoice, string xmlContent, SdiConfiguration config, CancellationToken ct = default);
    Task<SdiResponseResult> CheckStatusAsync(string sdiIdentifier, SdiConfiguration config, CancellationToken ct = default);
    Task<List<SdiNotification>> FetchNotificationsAsync(SdiConfiguration config, DateTime since, CancellationToken ct = default);
}

/// <summary>
/// Risultato invio fattura a SDI
/// </summary>
public class SdiSendResult
{
    public bool Success { get; set; }
    public string? SdiIdentifier { get; set; }
    public string? FileName { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public string? RawResponse { get; set; }
}

/// <summary>
/// Risultato controllo stato fattura
/// </summary>
public class SdiResponseResult
{
    public bool Success { get; set; }
    public string? Status { get; set; }
    public string? ResultCode { get; set; }
    public string? ResultDescription { get; set; }
    public DateTime? ResponseDate { get; set; }
    public string? RawResponse { get; set; }

    // Alias for compatibility with controller
    public string? ErrorCode 
    { 
        get => ResultCode; 
        set => ResultCode = value; 
    }
    public string? ErrorMessage 
    { 
        get => ResultDescription; 
        set => ResultDescription = value; 
    }
}

/// <summary>
/// Notifica SDI (ricezione, consegna/mancata consegna/decorrenza termini)
/// </summary>
public class SdiNotification
{
    public string NotificationType { get; set; } = string.Empty;
    public string SdiIdentifier { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? ResultCode { get; set; }
    public string? Description { get; set; }
    public string? PayloadBase64 { get; set; }
}

/// <summary>
/// Implementazione client SDI via canale SDICoop (web service)
/// </summary>
public class SdiCoopClient : ISdiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SdiCoopClient> _logger;

    public SdiCoopClient(HttpClient httpClient, ILogger<SdiCoopClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<SdiSendResult> SendInvoiceAsync(ElectronicInvoice invoice, string xmlContent, SdiConfiguration config, CancellationToken ct = default)
    {
        try
        {
            var fileName = $"IT{config.TransmitterId}_{invoice.SdiIdentifier ?? GenerateFileName()}.xml";
            var xmlBytes = Encoding.UTF8.GetBytes(xmlContent);
            
            var endpoint = config.IsTestEnvironment 
                ? "https://sdi.coop.agenziaentrate.gov.it/test" 
                : "https://sdi.coop.agenziaentrate.gov.it";

            using var content = new MultipartFormDataContent();
            var fileContent = new ByteArrayContent(xmlBytes);
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/xml");
            content.Add(fileContent, "file", fileName);

            var response = await _httpClient.PostAsync($"{endpoint}/invio", content, ct);
            var responseContent = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                var sdiId = ExtractSdiIdentifier(responseContent);
                return new SdiSendResult
                {
                    Success = true,
                    SdiIdentifier = sdiId,
                    FileName = fileName,
                    RawResponse = responseContent
                };
            }
            else
            {
                return new SdiSendResult
                {
                    Success = false,
                    ErrorCode = ((int)response.StatusCode).ToString(),
                    ErrorMessage = responseContent,
                    RawResponse = responseContent
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore invio fattura a SDI");
            return new SdiSendResult
            {
                Success = false,
                ErrorCode = "EXCEPTION",
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<SdiResponseResult> CheckStatusAsync(string sdiIdentifier, SdiConfiguration config, CancellationToken ct = default)
    {
        try
        {
            var endpoint = config.IsTestEnvironment 
                ? "https://sdi.coop.agenziaentrate.gov.it/test" 
                : "https://sdi.coop.agenziaentrate.gov.it";

            var response = await _httpClient.GetAsync($"{endpoint}/stato/{sdiIdentifier}", ct);
            var content = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                return ParseStatusResponse(content);
            }

            return new SdiResponseResult
            {
                Success = false,
                ErrorCode = ((int)response.StatusCode).ToString(),
                ErrorMessage = content,
                RawResponse = content
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore controllo stato SDI");
            return new SdiResponseResult
            {
                Success = false,
                ErrorCode = "EXCEPTION",
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<List<SdiNotification>> FetchNotificationsAsync(SdiConfiguration config, DateTime since, CancellationToken ct = default)
    {
        var notifications = new List<SdiNotification>();
        
        try
        {
            var endpoint = config.IsTestEnvironment 
                ? "https://sdi.coop.agenziaentrate.gov.it/test" 
                : "https://sdi.coop.agenziaentrate.gov.it";

            var response = await _httpClient.GetAsync($"{endpoint}/notifiche?since={since:yyyy-MM-ddTHH:mm:ss}", ct);
            var content = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                notifications = ParseNotifications(content);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore recupero notifiche SDI");
        }

        return notifications;
    }

    private static string GenerateFileName() => $"{DateTime.UtcNow:yyyyMMddHHmmssfff}";

    private static string ExtractSdiIdentifier(string responseXml)
    {
        try
        {
            var doc = new XmlDocument();
            doc.LoadXml(responseXml);
            var node = doc.SelectSingleNode("//*[local-name()='IdentificativoSdi']");
            return node?.InnerText ?? "";
        }
        catch
        {
            return "";
        }
    }

    private static SdiResponseResult ParseStatusResponse(string xml)
    {
        try
        {
            var doc = new XmlDocument();
            doc.LoadXml(xml);
            
            var result = new SdiResponseResult { Success = true, RawResponse = xml };
            
            var statoNode = doc.SelectSingleNode("//*[local-name()='Stato']");
            if (statoNode != null)
                result.Status = statoNode.InnerText;

            var codiceNode = doc.SelectSingleNode("//*[local-name()='CodiceEsito']");
            if (codiceNode != null)
                result.ResultCode = codiceNode.InnerText;

            var descNode = doc.SelectSingleNode("//*[local-name()='DescrizioneEsito']");
            if (descNode != null)
                result.ResultDescription = descNode.InnerText;

            var dataNode = doc.SelectSingleNode("//*[local-name()='DataOraRicezione']");
            if (dataNode != null && DateTime.TryParse(dataNode.InnerText, out var dt))
                result.ResponseDate = dt;

            return result;
        }
        catch
        {
            return new SdiResponseResult { Success = false, RawResponse = xml };
        }
    }

    private static List<SdiNotification> ParseNotifications(string xml)
    {
        var list = new List<SdiNotification>();
        try
        {
            var doc = new XmlDocument();
            doc.LoadXml(xml);
            
            var nodes = doc.SelectNodes("//*[local-name()='Notifica']");
            if (nodes != null)
            {
                foreach (XmlNode node in nodes)
                {
                    var notif = new SdiNotification
                    {
                        NotificationType = node.SelectSingleNode("*[local-name()='TipoNotifica']")?.InnerText ?? "",
                        SdiIdentifier = node.SelectSingleNode("*[local-name()='IdentificativoSdi']")?.InnerText ?? "",
                        FileName = node.SelectSingleNode("*[local-name()='NomeFile']")?.InnerText ?? "",
                        ResultCode = node.SelectSingleNode("*[local-name()='CodiceEsito']")?.InnerText,
                        Description = node.SelectSingleNode("*[local-name()='Descrizione']")?.InnerText,
                        PayloadBase64 = node.SelectSingleNode("*[local-name()='Payload']")?.InnerText
                    };
                    
                    if (DateTime.TryParse(node.SelectSingleNode("*[local-name()='DataOra']")?.InnerText, out var dt))
                        notif.Timestamp = dt;

                    list.Add(notif);
                }
            }
        }
        catch
        {
            // Ignore parse errors
        }
        return list;
    }
}

/// <summary>
/// Client SDI via canale PEC
/// </summary>
public class SdiPecClient : ISdiClient
{
    private readonly ILogger<SdiPecClient> _logger;

    public SdiPecClient(ILogger<SdiPecClient> logger)
    {
        _logger = logger;
    }

    public async Task<SdiSendResult> SendInvoiceAsync(ElectronicInvoice invoice, string xmlContent, SdiConfiguration config, CancellationToken ct = default)
    {
        try
        {
            var fileName = $"IT{config.TransmitterId}_{invoice.SdiIdentifier ?? GenerateFileName()}.xml";
            var zipContent = CreateZipAttachment(xmlContent, fileName);
            
            // Implementazione invio PEC - richiede libreria MimeKit/MailKit
            // Placeholder: log e restituisce successo simulato
            _logger.LogInformation("Simulazione invio PEC fattura {FileName}", fileName);
            
            return new SdiSendResult
            {
                Success = true,
                FileName = fileName,
                SdiIdentifier = invoice.SdiIdentifier,
                RawResponse = "Inviato via PEC (simulato)"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore invio fattura via PEC");
            return new SdiSendResult
            {
                Success = false,
                ErrorCode = "EXCEPTION",
                ErrorMessage = ex.Message
            };
        }
    }

    public Task<SdiResponseResult> CheckStatusAsync(string sdiIdentifier, SdiConfiguration config, CancellationToken ct = default)
    {
        return Task.FromResult(new SdiResponseResult 
        { 
            Success = true, 
            Status = "InviatoViaPEC",
            ResultDescription = "Inviato via PEC, in attesa notifiche" 
        });
    }

    public Task<List<SdiNotification>> FetchNotificationsAsync(SdiConfiguration config, DateTime since, CancellationToken ct = default)
    {
        return Task.FromResult(new List<SdiNotification>());
    }

    private static string GenerateFileName() => $"{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    private static byte[] CreateZipAttachment(string xml, string fileName)
    {
        using var ms = new MemoryStream();
        using (var archive = new System.IO.Compression.ZipArchive(ms, System.IO.Compression.ZipArchiveMode.Create, true))
        {
            var entry = archive.CreateEntry(fileName);
            using var entryStream = entry.Open();
            using var writer = new StreamWriter(entryStream, Encoding.UTF8);
            writer.Write(xml);
        }
        return ms.ToArray();
    }
}

/// <summary>
/// Factory per ottenere il client SDI corretto in base alla configurazione
/// </summary>
public class SdiClientFactory
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SdiClientFactory> _logger;

    public SdiClientFactory(IServiceProvider serviceProvider, ILogger<SdiClientFactory> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public ISdiClient CreateClient(SdiConfiguration config)
    {
        return config.Channel.ToUpperInvariant() switch
        {
            "SDICOOP" => _serviceProvider.GetRequiredService<SdiCoopClient>(),
            "PEC" => _serviceProvider.GetRequiredService<SdiPecClient>(),
            "SDIFTP" => throw new NotImplementedException("Canale SDIFtp non ancora implementato"),
            _ => throw new ArgumentException($"Canale SDI sconosciuto: {config.Channel}")
        };
    }
}