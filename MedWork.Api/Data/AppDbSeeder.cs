using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace MedWork.Api.Data;

public static class AppDbSeeder
{
    public static async Task SeedAsync(AppDbContext dbContext)
    {
        await dbContext.Database.MigrateAsync();

        await EnsureEncryptedDataReadableAsync(dbContext);

        var companySeeds = new[]
        {
            new Company { Name = "Acme Industria S.p.A.", VATNumber = "IT01234567890", ContactEmail = "hr@acme-industria.it", ContactPhone = "+39 02 1234567" },
            new Company { Name = "Nord Logistics S.r.l.", VATNumber = "IT09876543210", ContactEmail = "people@nordlogistics.it", ContactPhone = "+39 035 7654321" },
            new Company { Name = "TechFab Engineering S.p.A.", VATNumber = "IT04561230987", ContactEmail = "hr@techfab.it", ContactPhone = "+39 011 5557788" },
        };

        var existingVat = (await dbContext.Companies.Select(x => x.VATNumber).ToListAsync()).ToHashSet();
        var newCompanies = companySeeds.Where(x => !existingVat.Contains(x.VATNumber)).ToList();
        if (newCompanies.Count > 0)
        {
            dbContext.Companies.AddRange(newCompanies);
            await dbContext.SaveChangesAsync();
        }

        var companiesByVat = await dbContext.Companies.ToDictionaryAsync(x => x.VATNumber, x => x);

        var branchSeeds = new[]
        {
            new { Vat = "IT01234567890", Address = "Via Roma 10", City = "Milano", Province = "MI", PostalCode = "20100" },
            new { Vat = "IT01234567890", Address = "Via Torino 74", City = "Monza", Province = "MB", PostalCode = "20900" },
            new { Vat = "IT09876543210", Address = "Via delle Industrie 44", City = "Bergamo", Province = "BG", PostalCode = "24100" },
            new { Vat = "IT04561230987", Address = "Corso Francia 112", City = "Torino", Province = "TO", PostalCode = "10143" },
        };

        var existingBranches = await dbContext.Branches
            .Select(x => new { x.CompanyId, x.Address })
            .ToListAsync();

        foreach (var seed in branchSeeds)
        {
            if (!companiesByVat.TryGetValue(seed.Vat, out var company)) continue;
            if (existingBranches.Any(x => x.CompanyId == company.Id && x.Address == seed.Address)) continue;

            dbContext.Branches.Add(new Branch
            {
                CompanyId = company.Id,
                Address = seed.Address,
                City = seed.City,
                Province = seed.Province,
                PostalCode = seed.PostalCode
            });
        }

        await dbContext.SaveChangesAsync();

        var jobRoleSeeds = new[]
        {
            new JobRole { Name = "Operatore Linea", Description = "Mansione operativa con esposizione a rumore e movimentazione." },
            new JobRole { Name = "Magazziniere", Description = "Gestione logistica interna e movimentazione merci." },
            new JobRole { Name = "Saldatore", Description = "Lavorazioni con esposizione a fumi metallici e calore." },
            new JobRole { Name = "Impiegato Amministrativo", Description = "Attività VDT e carico mentale." },
        };

        var existingRoles = (await dbContext.JobRoles.Select(x => x.Name).ToListAsync()).ToHashSet();
        var newRoles = jobRoleSeeds.Where(x => !existingRoles.Contains(x.Name)).ToList();
        if (newRoles.Count > 0)
        {
            dbContext.JobRoles.AddRange(newRoles);
            await dbContext.SaveChangesAsync();
        }

        var rolesByName = await dbContext.JobRoles.ToDictionaryAsync(x => x.Name, x => x);

        var doctorSeeds = new[]
        {
            new Doctor { FirstName = "Laura", LastName = "Bianchi", MedicalLicenseNumber = "MED-LOM-98765", Specialty = "Medicina del Lavoro", Email = "laura.bianchi@medwork.it" },
            new Doctor { FirstName = "Paolo", LastName = "Verdi", MedicalLicenseNumber = "MED-PIE-44112", Specialty = "Medicina del Lavoro", Email = "paolo.verdi@medwork.it" },
            new Doctor { FirstName = "Giulia", LastName = "Neri", MedicalLicenseNumber = "MED-LOM-77231", Specialty = "Igiene industriale", Email = "giulia.neri@medwork.it" },
        };

        var existingDoctors = (await dbContext.Doctors.Select(x => x.MedicalLicenseNumber).ToListAsync()).ToHashSet();
        var newDoctors = doctorSeeds.Where(x => !existingDoctors.Contains(x.MedicalLicenseNumber)).ToList();
        if (newDoctors.Count > 0)
        {
            dbContext.Doctors.AddRange(newDoctors);
            await dbContext.SaveChangesAsync();
        }

        var doctorsByLicense = await dbContext.Doctors.ToDictionaryAsync(x => x.MedicalLicenseNumber, x => x);

        var availabilitySeeds = new[]
        {
            new { License = "MED-LOM-98765", Day = DayOfWeek.Monday, Start = new TimeSpan(8, 30, 0), End = new TimeSpan(12, 30, 0) },
            new { License = "MED-LOM-98765", Day = DayOfWeek.Wednesday, Start = new TimeSpan(14, 0, 0), End = new TimeSpan(18, 0, 0) },
            new { License = "MED-PIE-44112", Day = DayOfWeek.Tuesday, Start = new TimeSpan(9, 0, 0), End = new TimeSpan(13, 0, 0) },
            new { License = "MED-PIE-44112", Day = DayOfWeek.Thursday, Start = new TimeSpan(14, 30, 0), End = new TimeSpan(18, 30, 0) },
            new { License = "MED-LOM-77231", Day = DayOfWeek.Friday, Start = new TimeSpan(8, 0, 0), End = new TimeSpan(12, 0, 0) },
        };

        var existingAvailabilities = await dbContext.DoctorAvailabilities
            .Select(x => new { x.DoctorId, x.DayOfWeek, x.StartTime, x.EndTime })
            .ToListAsync();

        foreach (var seed in availabilitySeeds)
        {
            if (!doctorsByLicense.TryGetValue(seed.License, out var doctor)) continue;

            var alreadyExists = existingAvailabilities.Any(x =>
                x.DoctorId == doctor.Id &&
                x.DayOfWeek == seed.Day &&
                x.StartTime == seed.Start &&
                x.EndTime == seed.End);

            if (alreadyExists) continue;

            dbContext.DoctorAvailabilities.Add(new DoctorAvailability
            {
                DoctorId = doctor.Id,
                DayOfWeek = seed.Day,
                StartTime = seed.Start,
                EndTime = seed.End
            });
        }

        await dbContext.SaveChangesAsync();

        var riskSeeds = new[]
        {
            new RiskFactor { Name = "Rumore", Description = "Esposizione continuativa a rumore industriale.", SeverityLevel = 4, Allegato3BCategory = "Agenti fisici" },
            new RiskFactor { Name = "Agenti Chimici", Description = "Esposizione a solventi e detergenti tecnici.", SeverityLevel = 3, Allegato3BCategory = "Agenti chimici" },
            new RiskFactor { Name = "Movimentazione Carichi", Description = "Rischio biomeccanico da sollevamento e trasporto.", SeverityLevel = 4, Allegato3BCategory = "Movimentazione manuale carichi" },
            new RiskFactor { Name = "Videoterminali", Description = "Esposizione prolungata a videoterminali.", SeverityLevel = 2, Allegato3BCategory = "Rischi ergonomici" },
        };

        var existingRisks = (await dbContext.RiskFactors.Select(x => x.Name).ToListAsync()).ToHashSet();
        var newRisks = riskSeeds.Where(x => !existingRisks.Contains(x.Name)).ToList();
        if (newRisks.Count > 0)
        {
            dbContext.RiskFactors.AddRange(newRisks);
            await dbContext.SaveChangesAsync();
        }

        var risksByName = await dbContext.RiskFactors.ToDictionaryAsync(x => x.Name, x => x);

        var examTypeSeeds = new[]
        {
            new ExamType { Name = "Esame Ematochimico", Category = "Laboratorio" },
            new ExamType { Name = "Spirometria", Category = "Funzionale Respiratorio" },
            new ExamType { Name = "Audiometria", Category = "Funzionale Uditivo" },
            new ExamType { Name = "Visiotest", Category = "Screening" },
            new ExamType { Name = "ECG", Category = "Cardiologico" },
        };

        var existingExamTypes = (await dbContext.ExamTypes.Select(x => x.Name).ToListAsync()).ToHashSet();
        var newExamTypes = examTypeSeeds.Where(x => !existingExamTypes.Contains(x.Name)).ToList();
        if (newExamTypes.Count > 0)
        {
            dbContext.ExamTypes.AddRange(newExamTypes);
            await dbContext.SaveChangesAsync();
        }

        var examTypesByName = await dbContext.ExamTypes.ToDictionaryAsync(x => x.Name, x => x);

        var roleRiskSeeds = new[]
        {
            new { Role = "Operatore Linea", Risk = "Rumore" },
            new { Role = "Operatore Linea", Risk = "Movimentazione Carichi" },
            new { Role = "Magazziniere", Risk = "Movimentazione Carichi" },
            new { Role = "Saldatore", Risk = "Agenti Chimici" },
            new { Role = "Impiegato Amministrativo", Risk = "Videoterminali" },
        };

        var existingRoleRisks = await dbContext.JobRoleRiskFactors
            .Select(x => new { x.JobRoleId, x.RiskFactorId })
            .ToListAsync();

        foreach (var seed in roleRiskSeeds)
        {
            if (!rolesByName.TryGetValue(seed.Role, out var role)) continue;
            if (!risksByName.TryGetValue(seed.Risk, out var risk)) continue;
            if (existingRoleRisks.Any(x => x.JobRoleId == role.Id && x.RiskFactorId == risk.Id)) continue;

            dbContext.JobRoleRiskFactors.Add(new JobRoleRiskFactor
            {
                JobRoleId = role.Id,
                RiskFactorId = risk.Id
            });
        }

        await dbContext.SaveChangesAsync();

        var protocolSeeds = new[]
        {
            new { Name = "Protocollo Operatore Linea", Law = "81/08", Cadence = 365, Objective = "Sorveglianza annuale apparato uditivo e respiratorio.", Role = "Operatore Linea" },
            new { Name = "Protocollo Magazzino", Law = "81/08", Cadence = 365, Objective = "Monitoraggio ergonomico e postura.", Role = "Magazziniere" },
            new { Name = "Protocollo Saldatura", Law = "81/08", Cadence = 180, Objective = "Controllo respiratorio e tossicologico periodico.", Role = "Saldatore" },
            new { Name = "Protocollo VDT", Law = "81/08", Cadence = 730, Objective = "Valutazione visiva e benessere posturale.", Role = "Impiegato Amministrativo" },
            new { Name = "Protocollo Radioprotezione", Law = "101/20", Cadence = 365, Objective = "Monitoraggio esposizione radiazioni ionizzanti.", Role = "Operatore Linea" },
        };

        var existingProtocols = (await dbContext.Protocols.Select(x => x.Name).ToListAsync()).ToHashSet();
        foreach (var seed in protocolSeeds)
        {
            if (existingProtocols.Contains(seed.Name)) continue;
            if (!rolesByName.TryGetValue(seed.Role, out var role)) continue;

            dbContext.Protocols.Add(new Protocol
            {
                Name = seed.Name,
                LawReference = seed.Law,
                CadenceDays = seed.Cadence,
                Objective = seed.Objective,
                JobRoleId = role.Id
            });
        }

        await dbContext.SaveChangesAsync();

        var branches = await dbContext.Branches
            .Include(x => x.Company)
            .ToListAsync();

        int ResolveBranchId(string vat, string city)
        {
            return branches.First(x => x.Company!.VATNumber == vat && x.City == city).Id;
        }

        var employeeSeeds = new[]
        {
            new { Vat = "IT01234567890", City = "Milano", Role = "Operatore Linea", First = "Mario", Last = "Rossi", Tax = "RSSMRA80A01F205X", Birth = new DateTime(1980,1,1), Gender = "M", BirthCity = "Milano", BirthCode = "F205", Mail = "mario.rossi@example.com", Phone = "+39 333 1234567" },
            new { Vat = "IT01234567890", City = "Monza", Role = "Magazziniere", First = "Luca", Last = "Colombo", Tax = "CLMLCU85B12F704Y", Birth = new DateTime(1985,2,12), Gender = "M", BirthCity = "Monza", BirthCode = "F704", Mail = "luca.colombo@example.com", Phone = "+39 334 2234567" },
            new { Vat = "IT09876543210", City = "Bergamo", Role = "Magazziniere", First = "Elena", Last = "Galli", Tax = "GLLLNE90C53A794L", Birth = new DateTime(1990,3,13), Gender = "F", BirthCity = "Bergamo", BirthCode = "A794", Mail = "elena.galli@example.com", Phone = "+39 335 3234567" },
            new { Vat = "IT04561230987", City = "Torino", Role = "Saldatore", First = "Davide", Last = "Greco", Tax = "GRCDVD78D15L219M", Birth = new DateTime(1978,4,15), Gender = "M", BirthCity = "Torino", BirthCode = "L219", Mail = "davide.greco@example.com", Phone = "+39 336 4234567" },
            new { Vat = "IT04561230987", City = "Torino", Role = "Impiegato Amministrativo", First = "Sara", Last = "Ferrari", Tax = "FRRSRA92E47L219N", Birth = new DateTime(1992,5,7), Gender = "F", BirthCity = "Torino", BirthCode = "L219", Mail = "sara.ferrari@example.com", Phone = "+39 337 5234567" },
        };

        var existingTaxCodes = (await dbContext.Employees.Select(x => x.TaxCode).ToListAsync()).ToHashSet();
        foreach (var seed in employeeSeeds)
        {
            if (existingTaxCodes.Contains(seed.Tax)) continue;
            if (!companiesByVat.TryGetValue(seed.Vat, out var company)) continue;
            if (!rolesByName.TryGetValue(seed.Role, out var role)) continue;

            dbContext.Employees.Add(new Employee
            {
                CompanyId = company.Id,
                BranchId = ResolveBranchId(seed.Vat, seed.City),
                JobRole = seed.Role,
                JobRoleId = role.Id,
                FirstName = seed.First,
                LastName = seed.Last,
                TaxCode = seed.Tax,
                BirthDate = seed.Birth,
                Gender = seed.Gender,
                BirthCity = seed.BirthCity,
                BirthCityCode = seed.BirthCode,
                PersonalEmail = seed.Mail,
                PhoneNumber = seed.Phone
            });
        }

        await dbContext.SaveChangesAsync();

        var employeesByTax = await dbContext.Employees.ToDictionaryAsync(x => x.TaxCode, x => x);

        var employeeRiskSeeds = new[]
        {
            new { Tax = "RSSMRA80A01F205X", Risk = "Rumore" },
            new { Tax = "RSSMRA80A01F205X", Risk = "Movimentazione Carichi" },
            new { Tax = "CLMLCU85B12F704Y", Risk = "Movimentazione Carichi" },
            new { Tax = "GLLLNE90C53A794L", Risk = "Movimentazione Carichi" },
            new { Tax = "GRCDVD78D15L219M", Risk = "Agenti Chimici" },
            new { Tax = "FRRSRA92E47L219N", Risk = "Videoterminali" },
        };

        var existingEmployeeRisks = await dbContext.EmployeeRisks
            .Select(x => new { x.EmployeeId, x.RiskFactorId })
            .ToListAsync();

        foreach (var seed in employeeRiskSeeds)
        {
            if (!employeesByTax.TryGetValue(seed.Tax, out var employee)) continue;
            if (!risksByName.TryGetValue(seed.Risk, out var risk)) continue;
            if (existingEmployeeRisks.Any(x => x.EmployeeId == employee.Id && x.RiskFactorId == risk.Id)) continue;

            dbContext.EmployeeRisks.Add(new EmployeeRisk
            {
                EmployeeId = employee.Id,
                RiskFactorId = risk.Id
            });
        }

        await dbContext.SaveChangesAsync();

        var protocolsByName = await dbContext.Protocols.ToDictionaryAsync(x => x.Name, x => x);

        var personalProtocolSeeds = new[]
        {
            new { Tax = "RSSMRA80A01F205X", Protocol = "Protocollo Operatore Linea" },
            new { Tax = "RSSMRA80A01F205X", Protocol = "Protocollo Radioprotezione" },
            new { Tax = "CLMLCU85B12F704Y", Protocol = "Protocollo Magazzino" },
            new { Tax = "GLLLNE90C53A794L", Protocol = "Protocollo Magazzino" },
            new { Tax = "GRCDVD78D15L219M", Protocol = "Protocollo Saldatura" },
            new { Tax = "FRRSRA92E47L219N", Protocol = "Protocollo VDT" },
        };

        var existingPersonalProtocols = await dbContext.PersonalProtocols
            .Select(x => new { x.EmployeeId, x.ProtocolId })
            .ToListAsync();

        foreach (var seed in personalProtocolSeeds)
        {
            if (!employeesByTax.TryGetValue(seed.Tax, out var employee)) continue;
            if (!protocolsByName.TryGetValue(seed.Protocol, out var protocol)) continue;
            if (existingPersonalProtocols.Any(x => x.EmployeeId == employee.Id && x.ProtocolId == protocol.Id)) continue;

            dbContext.PersonalProtocols.Add(new PersonalProtocol
            {
                EmployeeId = employee.Id,
                ProtocolId = protocol.Id,
                AssignedAt = DateTime.UtcNow,
                IsOverride = false,
                Notes = "Auto demo assignment"
            });
        }

        await dbContext.SaveChangesAsync();

        foreach (var employee in employeesByTax.Values)
        {
            var exists = await dbContext.MedicalRecords.AnyAsync(x => x.EmployeeId == employee.Id);
            if (exists) continue;

            dbContext.MedicalRecords.Add(new MedicalRecord
            {
                EmployeeId = employee.Id,
                MedicalHistory = "Anamnesi demo completa: nessuna patologia invalidante, monitoraggio periodico previsto dal protocollo.",
                Notes = "Dati di test per validazione UX e reportistica.",
                CurrentTherapies = "Nessuna terapia continuativa rilevante.",
                Status = MedicalRecordStatus.Active
            });
        }

        await dbContext.SaveChangesAsync();

        var employeeList = employeesByTax.Values.OrderBy(x => x.Id).ToList();
        var doctorList = doctorsByLicense.Values.OrderBy(x => x.Id).ToList();

        foreach (var employee in employeeList)
        {
            var hasVisit = await dbContext.MedicalVisits.AnyAsync(x => x.EmployeeId == employee.Id);
            if (hasVisit) continue;

            var doctor = doctorList[employee.Id % doctorList.Count];

            dbContext.MedicalVisits.Add(new MedicalVisit
            {
                EmployeeId = employee.Id,
                DoctorId = doctor.Id,
                VisitDate = DateTime.UtcNow.Date.AddDays(-(15 + employee.Id * 3)),
                NextDeadlineDate = DateTime.UtcNow.Date.AddDays(20 + employee.Id * 5),
                Outcome = employee.Id % 4 == 0 ? "Parzialmente idoneo con limitazioni" : "Idoneo con prescrizioni",
                ClinicalNotes = "Visita demo per simulazione workflow clinico completo.",
                VisitType = employee.Id % 2 == 0 ? MedicalVisitType.Periodic : MedicalVisitType.Preventive,
                TargetOrgans = "Apparato respiratorio, apparato muscolo-scheletrico",
                ObjectiveExam = "Esame obiettivo nei limiti, lieve rigidità rachidea."
            });
        }

        await dbContext.SaveChangesAsync();

        var visitIds = await dbContext.MedicalVisits
            .Select(x => x.Id)
            .ToListAsync();

        foreach (var visitId in visitIds)
        {
            var hasAnamnesis = await dbContext.Anamneses.AnyAsync(x => x.MedicalVisitId == visitId);
            if (!hasAnamnesis)
            {
                dbContext.Anamneses.Add(new Anamnesis
                {
                    MedicalVisitId = visitId,
                    WorkHistory = "Storico lavorativo test con esposizioni coerenti alla mansione.",
                    PersonalHistory = "Anamnesi personale negativa per patologie maggiori.",
                    FamilyHistory = "Familiarità per ipertensione.",
                    RemotePathology = "Lombalgia episodica in anamnesi remota.",
                    RecentPathology = "Nessuna patologia recente significativa."
                });
            }

            var hasExams = await dbContext.VisitExams.AnyAsync(x => x.MedicalVisitId == visitId);
            if (!hasExams)
            {
                dbContext.VisitExams.Add(new VisitExam
                {
                    MedicalVisitId = visitId,
                    ExamTypeId = examTypesByName["Esame Ematochimico"].Id,
                    Result = "Valori ematici nella norma",
                    Notes = "Nessuna alterazione significativa.",
                    ReferenceRange = "Hb 13-17 g/dL"
                });

                dbContext.VisitExams.Add(new VisitExam
                {
                    MedicalVisitId = visitId,
                    ExamTypeId = examTypesByName["Spirometria"].Id,
                    Result = "Funzionalità respiratoria regolare",
                    Notes = "Controllo periodico consigliato.",
                    ReferenceRange = "FEV1 > 80%"
                });
            }
        }

        await dbContext.SaveChangesAsync();

        foreach (var employee in employeeList)
        {
            var hasScheduled = await dbContext.ScheduledExams.AnyAsync(x => x.EmployeeId == employee.Id);
            if (!hasScheduled)
            {
                dbContext.ScheduledExams.Add(new ScheduledExam
                {
                    EmployeeId = employee.Id,
                    ExamTypeId = examTypesByName[employee.Id % 2 == 0 ? "Audiometria" : "Spirometria"].Id,
                    DueDate = DateTime.UtcNow.Date.AddDays(25 + employee.Id * 4),
                    Status = ScheduledExamStatus.Planned
                });
            }

            var hasVax = await dbContext.Vaccinations.AnyAsync(x => x.EmployeeId == employee.Id);
            if (!hasVax)
            {
                dbContext.Vaccinations.Add(new Vaccination
                {
                    EmployeeId = employee.Id,
                    VaccineName = employee.Id % 2 == 0 ? "Antitetanica" : "Antinfluenzale",
                    DateAdministered = DateTime.UtcNow.Date.AddMonths(-(8 + employee.Id)),
                    NextDueDate = DateTime.UtcNow.Date.AddMonths(6 + employee.Id)
                });
            }

            var hasLog = await dbContext.NotificationLogs.AnyAsync(x => x.EmployeeId == employee.Id);
            if (!hasLog)
            {
                dbContext.NotificationLogs.Add(new NotificationLog
                {
                    EmployeeId = employee.Id,
                    Channel = employee.Id % 2 == 0 ? NotificationChannel.Email : NotificationChannel.Sms,
                    SentDate = DateTime.UtcNow.AddDays(-employee.Id),
                    MessageText = "Convocazione visita medica periodica inviata (dataset demo)."
                });
            }
        }

        await dbContext.SaveChangesAsync();

        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureEncryptedDataReadableAsync(AppDbContext dbContext)
    {
        try
        {
            _ = await dbContext.MedicalRecords.AsNoTracking().Select(x => x.MedicalHistory).FirstOrDefaultAsync();
            _ = await dbContext.MedicalVisits.AsNoTracking().Select(x => x.ClinicalNotes).FirstOrDefaultAsync();
            _ = await dbContext.Anamneses.AsNoTracking().Select(x => x.WorkHistory).FirstOrDefaultAsync();
            _ = await dbContext.VisitExams.AsNoTracking().Select(x => x.Result).FirstOrDefaultAsync();
            _ = await dbContext.NotificationLogs.AsNoTracking().Select(x => x.MessageText).FirstOrDefaultAsync();
        }
        catch (CryptographicException)
        {
            await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM [Anamneses]");
            await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM [VisitExams]");
            await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM [MedicalVisits]");
            await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM [MedicalRecords]");
            await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM [ScheduledExams]");
            await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM [Vaccinations]");
            await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM [NotificationLogs]");
        }
    }
}
