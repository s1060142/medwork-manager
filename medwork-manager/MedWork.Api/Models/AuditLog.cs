namespace MedWork.Api.Models;

/// <summary>
/// Tracciamento delle modifiche ai dati sensibili (cartelle sanitarie e di rischio).
/// Obbligatorio per dati di categoria particolare (GDPR art. 9) e per la tenuta
/// della Cartella Sanitaria e di Rischio (D.Lgs 81/08).
/// </summary>
public class AuditLog
{
    public long Id { get; set; }

    /// <summary>Utente (username dal token JWT) che ha effettuato l'operazione.</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>Ruolo dell'utente al momento dell'operazione.</summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>Tipo di azione: Create, Update, Delete, View, Export, Login.</summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>Entità coinvolta (es. MedicalVisit, MedicalRecord, Employee).</summary>
    public string EntityName { get; set; } = string.Empty;

    /// <summary>Id dell'entità coinvolta, se applicabile.</summary>
    public int? EntityId { get; set; }

    /// <summary>Descrizione leggibile dell'operazione.</summary>
    public string? Description { get; set; }

    /// <summary>Indirizzo IP/Origine della richiesta (se disponibile).</summary>
    public string? Source { get; set; }

    /// <summary>Timestamp UTC dell'evento.</summary>
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}
