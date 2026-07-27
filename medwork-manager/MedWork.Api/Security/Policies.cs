using Microsoft.AspNetCore.Authorization;

namespace MedWork.Api.Security;

/// <summary>
/// Nomi delle policy basate su ruoli, usate per l'autorizzazione fine-grained.
/// Principio chiave (D.Lgs 81/08 + GDPR art. 9):
/// - i dati clinici sono visibili SOLO a Doctor/Admin;
/// - il datore di lavoro (Employer) vede solo l'esito di idoneità, mai i dettagli medici.
/// </summary>
public static class Policies
{
    /// <summary>Accesso ai dati clinici sensibili (cartelle sanitarie, esami, anamnesi).</summary>
    public const string CanViewClinicalData = "CanViewClinicalData";

    /// <summary>Gestione anagrafiche (aziende, lavoratori, sedi, mansioni).</summary>
    public const string CanManageMasterData = "CanManageMasterData";

    /// <summary>Accesso in sola lettura alle informazioni di rischio/mansione/protocollo (RSPP + sopra).</summary>
    public const string CanViewRiskData = "CanViewRiskData";

    /// <summary>Il datore di lavoro può vedere esclusivamente l'esito di idoneità aggregato.</summary>
    public const string CanViewFitnessOutcomeOnly = "CanViewFitnessOutcomeOnly";
}

public static class PolicyBuilder
{
    public static void AddMedWorkAuthorizationPolicies(this AuthorizationOptions options)
    {
        options.AddPolicy(Policies.CanViewClinicalData, policy =>
            policy.RequireRole(AppRole.ClinicalRoles.ToArray()));

        options.AddPolicy(Policies.CanManageMasterData, policy =>
            policy.RequireRole(AppRole.ManagementRoles.ToArray()));

        options.AddPolicy(Policies.CanViewRiskData, policy =>
            policy.RequireRole(AppRole.Admin, AppRole.Doctor, AppRole.Secretary, AppRole.Rspp));

        options.AddPolicy(Policies.CanViewFitnessOutcomeOnly, policy =>
            policy.RequireRole(AppRole.Admin, AppRole.Doctor, AppRole.Secretary, AppRole.Rspp, AppRole.Employer));
    }
}
