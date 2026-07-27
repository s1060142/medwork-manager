namespace MedWork.Api.Security;

public static class AppRole
{
    /// <summary>Amministratore di sistema: gestione completa anagrafiche e utenti.</summary>
    public const string Admin = "Admin";
    /// <summary>Medico competente: vede TUTTI i dati clinici (categoria particolare art. 9 GDPR).</summary>
    public const string Doctor = "Doctor";
    /// <summary>Segreteria/amministrazione: gestione anagrafiche, nessun dato clinico.</summary>
    public const string Secretary = "Secretary";
    /// <summary>RSPP: vede rischi/mansioni/protocolli, non i dettagli clinici dei singoli lavoratori.</summary>
    public const string Rspp = "RSPP";
    /// <summary>Datore di lavoro: vede SOLO l'esito di idoneità, mai i dettagli clinici.</summary>
    public const string Employer = "Employer";
    /// <summary>Lavoratore: accede al proprio fascicolo sanitario elettronico (Portale Lavoratori).</summary>
    public const string Worker = "Worker";

    /// <summary>Ruoli che hanno accesso ai dati clinici sensibili (cartelle sanitarie).</summary>
    public static IReadOnlyList<string> ClinicalRoles { get; } = new[] { Admin, Doctor };

    /// <summary>Ruoli che possono gestire (CRUD) le anagrafiche aziendali/lavoratori.</summary>
    public static IReadOnlyList<string> ManagementRoles { get; } = new[] { Admin, Doctor, Secretary };
}
