using System;
using System.Collections.Generic;
using System.Linq;

namespace MedWork.Api.Services;

public record DeadlineCalculationResult(
    DateTime NextDeadlineDate,
    int CadenceDays,
    string RuleApplied,
    string LegalReference
);

public interface IDeadlineRuleEngine
{
    DeadlineCalculationResult CalculateNextDeadline(
        DateTime visitDate,
        DateTime? dateOfBirth,
        string? jobRole,
        IEnumerable<string>? riskFactors,
        string? outcomeCode,
        string? prescriptions,
        string? limitations);
}

public class DeadlineRuleEngine : IDeadlineRuleEngine
{
    public DeadlineCalculationResult CalculateNextDeadline(
        DateTime visitDate,
        DateTime? dateOfBirth,
        string? jobRole,
        IEnumerable<string>? riskFactors,
        string? outcomeCode,
        string? prescriptions,
        string? limitations)
    {
        var risks = riskFactors?.Select(r => r.ToLowerInvariant()).ToList() ?? new List<string>();
        var role = jobRole?.ToLowerInvariant() ?? "";
        var presc = (prescriptions ?? "").ToLowerInvariant();
        var limit = (limitations ?? "").ToLowerInvariant();
        var combinedRestrictions = presc + " " + limit;

        int age = 35; // Default reference age if birthdate not available
        if (dateOfBirth.HasValue)
        {
            var today = visitDate;
            age = today.Year - dateOfBirth.Value.Year;
            if (dateOfBirth.Value.Date > today.AddYears(-age)) age--;
        }

        // 1. Temporary Infitness / Temporary Prescriptions (Short-term review)
        if (outcomeCode == "NONIDONE0" && (combinedRestrictions.Contains("temporan") || combinedRestrictions.Contains("mesi") || combinedRestrictions.Contains("giorni")))
        {
            // Default 90 or 180 days for temporary limitations
            int tempDays = 180;
            if (combinedRestrictions.Contains("3 mesi") || combinedRestrictions.Contains("90")) tempDays = 90;
            if (combinedRestrictions.Contains("1 mese") || combinedRestrictions.Contains("30")) tempDays = 30;
            if (combinedRestrictions.Contains("6 mesi") || combinedRestrictions.Contains("180")) tempDays = 180;

            return new DeadlineCalculationResult(
                visitDate.AddDays(tempDays),
                tempDays,
                $"Rivalutazione temporanea inidoneità/limitazione ({tempDays} giorni)",
                "D.Lgs. 81/08 Art. 41 c.6");
        }

        // 2. Ionizing Radiation (Semestrale o Annuale per categoria A/B)
        if (risks.Any(r => r.Contains("radiazion") || r.Contains("rx") || r.Contains("ionizz")) || role.Contains("radiolog"))
        {
            int radDays = 180; // 6 months for high risk
            return new DeadlineCalculationResult(
                visitDate.AddDays(radDays),
                radDays,
                "Sorveglianza Radiazioni Ionizzanti (Semestrale)",
                "D.Lgs. 101/2020");
        }

        // 3. VDT (Videoterminale) Specific Age-Dependent Law Rule (Art. 176)
        // Under 50 without vision prescriptions: 5 years (1825 days)
        // 50 or over OR with refractive/vision prescriptions: 2 years (730 days)
        bool isVdtOnly = (risks.Any(r => r.Contains("vdt") || r.Contains("videoterminal")) || role.Contains("ufficio") || role.Contains("amministrativ") || role.Contains("impiegat"))
                         && !risks.Any(r => r.Contains("rumor") || r.Contains("chimic") || r.Contains("carich") || r.Contains("mmc") || r.Contains("polver") || r.Contains("notturn"));

        if (isVdtOnly)
        {
            bool hasEyePrescription = combinedRestrictions.Contains("lent") || combinedRestrictions.Contains("occhial") || combinedRestrictions.Contains("visiv") || combinedRestrictions.Contains("vdt");

            if (age >= 50 || hasEyePrescription)
            {
                int days = 730; // 2 years
                string reason = age >= 50 ? $"VDT Lavoratore over-50 ({age} anni): periodicità biennale" : "VDT con prescrizione lenti correttive: periodicità biennale";
                return new DeadlineCalculationResult(
                    visitDate.AddDays(days),
                    days,
                    reason,
                    "D.Lgs. 81/08 Art. 176 c.3");
            }
            else
            {
                int days = 1825; // 5 years
                return new DeadlineCalculationResult(
                    visitDate.AddDays(days),
                    days,
                    $"VDT Lavoratore under-50 ({age} anni) senza limitazioni: periodicità quinquennale",
                    "D.Lgs. 81/08 Art. 176 c.3");
            }
        }

        // 4. Lavoro Notturno (D.Lgs. 66/2003) -> Annuale o Biennale in base a protocollo
        if (risks.Any(r => r.Contains("notturn") || r.Contains("notte")) || role.Contains("notturn"))
        {
            int days = 730; // 2 years standard, or 1 year if over 50
            if (age >= 50) days = 365;
            return new DeadlineCalculationResult(
                visitDate.AddDays(days),
                days,
                $"Lavoro Notturno (cadenza {(days == 365 ? "annuale over-50" : "biennale")})",
                "D.Lgs. 66/2003 Art. 14");
        }

        // 5. Standard High Risks: Rumore, MMC, Chimico, Polveri, Spazi Confinati, Guida (Annuale - 365 days)
        if (risks.Any(r => r.Contains("rumor") || r.Contains("mmc") || r.Contains("carich") || r.Contains("chimic") || r.Contains("biologic") || r.Contains("guida") || r.Contains("mulett") || r.Contains("fumi") || r.Contains("amiant")))
        {
            int days = 365;
            return new DeadlineCalculationResult(
                visitDate.AddDays(days),
                days,
                "Sorveglianza Sanitaria Annuale per rischi specifici (Rumore/MMC/Chimico/Guida)",
                "D.Lgs. 81/08 Art. 41 c.2");
        }

        // Default: 1 Year (365 days)
        return new DeadlineCalculationResult(
            visitDate.AddDays(365),
            365,
            "Sorveglianza Sanitaria Periodica Annuale Standard",
            "D.Lgs. 81/08 Art. 41");
    }
}
