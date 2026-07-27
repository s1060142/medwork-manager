using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MedWork.Api.Security;

namespace MedWork.Api.Models;

/// <summary>
/// Utente di applicazione. Le password NON sono mai salvate in chiaro:
/// si memorizza solo l'hash Argon2id (parameterifornio da salt univo).
/// </summary>
public class AppUser
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Username { get; set; } = string.Empty;

    /// <summary>Hash Argon2id (formato Lib9Argument: $argon2id$v=19$m=...,t=...,p=...$salt$hash).</summary>
    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [StringLength(40)]
    public string Role { get; set; } = AppRole.Admin;

    /// <summary>Codice fiscale (lavoratore) o CF/PIVA (azienda) per i portali dedicati.</summary>
    [StringLength(32)]
    public string? TaxCode { get; set; }

    /// <summary>Se false, l'utente non può autenticarsi (revoca senza cancellare lo storico).</summary>
    public bool IsActive { get; set; } = true;

    [StringLength(120)]
    public string? Email { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAtUtc { get; set; }

    /// <summary>Imposta a true dopo il primo login, per forzare il cambio password iniziale.</summary>
    public bool MustChangePassword { get; set; }
}
