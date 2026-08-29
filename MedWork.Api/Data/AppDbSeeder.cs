using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace MedWork.Api.Data;

public static class AppDbSeeder
{
    public static async Task SeedAsync(AppDbContext dbContext, bool isTesting = false)
    {
        if (isTesting)
        {
            // InMemory provider auto-creates schema; EnsureCreatedAsync is relational-specific.
            await Task.CompletedTask;
        }
        else
        {
            await dbContext.Database.MigrateAsync();
        }

        // Ensure a default tenant exists (multi-tenant model requires TenantId on every entity)
        var defaultTenant = await dbContext.Tenants.FirstOrDefaultAsync(t => t.Slug == "default");
        if (defaultTenant == null)
        {
            defaultTenant = new Tenant
            {
                Name = "Default Tenant",
                Slug = "default",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Tenants.Add(defaultTenant);
            await dbContext.SaveChangesAsync();
        }
        var tid = defaultTenant.Id;

                if (!isTesting)
                {
                    await EnsureEncryptedDataReadableAsync(dbContext);
                }

                var companySeeds = new[]
                {
                    new Company { Name = "Acme Industria S.p.A.", VATNumber = "IT01234567890", ContactEmail = "hr@acme-industria.it", ContactPhone = "+39 02 1234567", TenantId = tid },
            new Company { Name = "Nord Logistics S.r.l.", VATNumber = "IT09876543210", ContactEmail = "people@nordlogistics.it", ContactPhone = "+39 035 7654321", TenantId = tid },
            new Company { Name = "TechFab Engineering S.p.A.", VATNumber = "IT04561230987", ContactEmail = "hr@techfab.it", ContactPhone = "+39 011 5557788", TenantId = tid },
        };

        var existingVat = (await dbContext.Companies.Select(x => x.VATNumber).ToListAsync()).ToHashSet();
        var newCompanies = companySeeds.Where(x => !existingVat.Contains(x.VATNumber)).ToList();
        if (newCompanies.Count > 0)
        {
            dbContext.Companies.AddRange(newCompanies);
            await dbContext.SaveChangesAsync();
        }

        var companiesByVat = await dbContext.Companies
            .Where(x => x.VATNumber != null)
            .ToDictionaryAsync(x => x.VATNumber!, x => x);

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
                TenantId = tid,
                Address = seed.Address,
                City = seed.City,
                Province = seed.Province,
                PostalCode = seed.PostalCode
            });
        }

        await dbContext.SaveChangesAsync();

        var jobRoleSeeds = new[]
        {
            new JobRole { Name = "Operatore Linea", Description = "Mansione operativa con esposizione a rumore e movimentazione.", TenantId = tid },
            new JobRole { Name = "Magazziniere", Description = "Gestione logistica interna e movimentazione merci.", TenantId = tid },
            new JobRole { Name = "Saldatore", Description = "Lavorazioni con esposizione a fumi metallici e calore.", TenantId = tid },
            new JobRole { Name = "Impiegato Amministrativo", Description = "Attività VDT e carico mentale.", TenantId = tid },
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
            new Doctor { FirstName = "Laura", LastName = "Bianchi", MedicalLicenseNumber = "MED-LOM-98765", Specialty = "Medicina del Lavoro", Email = "laura.bianchi@medwork.it", TenantId = tid },
            new Doctor { FirstName = "Paolo", LastName = "Verdi", MedicalLicenseNumber = "MED-PIE-44112", Specialty = "Medicina del Lavoro", Email = "paolo.verdi@medwork.it", TenantId = tid },
            new Doctor { FirstName = "Giulia", LastName = "Neri", MedicalLicenseNumber = "MED-LOM-77231", Specialty = "Igiene industriale", Email = "giulia.neri@medwork.it", TenantId = tid },
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
                TenantId = tid,
                DayOfWeek = seed.Day,
                StartTime = seed.Start,
                EndTime = seed.End
            });
        }

        await dbContext.SaveChangesAsync();

        var riskSeeds = new[]
        {
            new RiskFactor { Name = "Rumore", Description = "Esposizione continuativa a rumore industriale.", SeverityLevel = 4, Allegato3BCategory = "Agenti fisici", TenantId = tid },
            new RiskFactor { Name = "Agenti Chimici", Description = "Esposizione a solventi e detergenti tecnici.", SeverityLevel = 3, Allegato3BCategory = "Agenti chimici", TenantId = tid },
            new RiskFactor { Name = "Movimentazione Carichi", Description = "Rischio biomeccanico da sollevamento e trasporto.", SeverityLevel = 4, Allegato3BCategory = "Movimentazione manuale carichi", TenantId = tid },
            new RiskFactor { Name = "Videoterminali", Description = "Esposizione prolungata a videoterminali.", SeverityLevel = 2, Allegato3BCategory = "Rischi ergonomici", TenantId = tid },
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
            new ExamType { Name = "Esame Ematochimico", Category = "Laboratorio", TenantId = tid },
            new ExamType { Name = "Spirometria", Category = "Funzionale Respiratorio", TenantId = tid },
            new ExamType { Name = "Audiometria", Category = "Funzionale Uditivo", TenantId = tid },
            new ExamType { Name = "Visiotest", Category = "Screening", TenantId = tid },
            new ExamType { Name = "ECG", Category = "Cardiologico", TenantId = tid },
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
                RiskFactorId = risk.Id,
                TenantId = tid
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
                JobRoleId = role.Id,
                TenantId = tid
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
                TenantId = tid,
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
                RiskFactorId = risk.Id,
                TenantId = tid
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
                TenantId = tid,
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
                TenantId = tid,
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
                TenantId = tid,
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
                    TenantId = tid,
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
                    TenantId = tid,
                    ExamTypeId = examTypesByName["Esame Ematochimico"].Id,
                    Result = "Valori ematici nella norma",
                    Notes = "Nessuna alterazione significativa.",
                    ReferenceRange = "Hb 13-17 g/dL"
                });

                dbContext.VisitExams.Add(new VisitExam
                {
                    MedicalVisitId = visitId,
                    TenantId = tid,
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
                    TenantId = tid,
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
                    TenantId = tid,
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
                    TenantId = tid,
                    Channel = employee.Id % 2 == 0 ? NotificationChannel.Email : NotificationChannel.Sms,
                    SentDate = DateTime.UtcNow.AddDays(-employee.Id),
                    MessageText = "Convocazione visita medica periodica inviata (dataset demo)."
                });
            }
        }

        await dbContext.SaveChangesAsync();

        await dbContext.SaveChangesAsync();

        // Seed default permissions, roles, and users
        await SeedDefaultPermissionsAsync(dbContext, tid);

        await dbContext.SaveChangesAsync();

        // FASE 1 - seed phrase library for the Cartella Sanitaria 3A.
        await PhraseTemplateSeed.SeedAsync(dbContext);

        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedDefaultPermissionsAsync(AppDbContext dbContext, int tenantId)
    {
        var defaultPermissions = new[]
        {
            // Companies
            new { Name = "companies.read", Description = "View companies", Category = "Companies" },
            new { Name = "companies.write", Description = "Create/edit companies", Category = "Companies" },
            new { Name = "companies.delete", Description = "Delete companies", Category = "Companies" },

            // Employees
            new { Name = "employees.read", Description = "View employees", Category = "Employees" },
            new { Name = "employees.write", Description = "Create/edit employees", Category = "Employees" },
            new { Name = "employees.delete", Description = "Delete employees", Category = "Employees" },

            // Doctors
            new { Name = "doctors.read", Description = "View doctors", Category = "Doctors" },
            new { Name = "doctors.write", Description = "Create/edit doctors", Category = "Doctors" },
            new { Name = "doctors.delete", Description = "Delete doctors", Category = "Doctors" },

            // Protocols
            new { Name = "protocols.read", Description = "View protocols", Category = "Protocols" },
            new { Name = "protocols.write", Description = "Create/edit protocols", Category = "Protocols" },
            new { Name = "protocols.delete", Description = "Delete protocols", Category = "Protocols" },

            // Medical Visits
            new { Name = "visits.read", Description = "View medical visits", Category = "MedicalVisits" },
            new { Name = "visits.write", Description = "Create/edit medical visits", Category = "MedicalVisits" },
            new { Name = "visits.sign", Description = "Sign medical visits", Category = "MedicalVisits" },

            // Scheduling
            new { Name = "scheduling.read", Description = "View scheduling", Category = "Scheduling" },
            new { Name = "scheduling.write", Description = "Manage scheduling", Category = "Scheduling" },

            // Reports
            new { Name = "reports.read", Description = "View reports", Category = "Reports" },
            new { Name = "reports.export", Description = "Export reports", Category = "Reports" },

            // Administration
            new { Name = "admin.users", Description = "Manage users", Category = "Administration" },
            new { Name = "admin.roles", Description = "Manage roles", Category = "Administration" },
            new { Name = "admin.tenants", Description = "Manage tenants", Category = "Administration" },
            new { Name = "admin.settings", Description = "Manage system settings", Category = "Administration" },
            new { Name = "admin.audit", Description = "View audit logs", Category = "Administration" },

            // Integrations
            new { Name = "integrations.hr", Description = "HR system integration", Category = "Integrations" },
            new { Name = "integrations.pec", Description = "PEC integration", Category = "Integrations" },
            new { Name = "integrations.sdi", Description = "SDI/Fatturazione integration", Category = "Integrations" },

            // AI Features
            new { Name = "ai.charting", Description = "AI-assisted charting", Category = "AI" },
            new { Name = "ai.scheduling", Description = "AI scheduling optimization", Category = "AI" },

            // Mobile
            new { Name = "mobile.offline", Description = "Mobile offline access", Category = "Mobile" },
        };

        foreach (var perm in defaultPermissions)
        {
            var exists = await dbContext.Permissions.AnyAsync(p => p.Name == perm.Name);
            if (!exists)
            {
                dbContext.Permissions.Add(new Permission
                {
                    Name = perm.Name,
                    Description = perm.Description,
                    Category = perm.Category,
                    IsSystem = true
                });
            }
        }

        await dbContext.SaveChangesAsync();

        var permissions = await dbContext.Permissions.ToDictionaryAsync(p => p.Name, p => p);

        // Seed roles
        var adminRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.TenantId == tenantId && r.Name == "Admin");
        if (adminRole == null)
        {
            adminRole = new Role { Name = "Admin", Description = "Administrator", TenantId = tenantId, IsSystem = true };
            dbContext.Roles.Add(adminRole);
            await dbContext.SaveChangesAsync();
        }

        var doctorRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.TenantId == tenantId && r.Name == "Doctor");
        if (doctorRole == null)
        {
            doctorRole = new Role { Name = "Doctor", Description = "Doctor", TenantId = tenantId, IsSystem = true };
            dbContext.Roles.Add(doctorRole);
            await dbContext.SaveChangesAsync();
        }

        var patientRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.TenantId == tenantId && r.Name == "Patient");
        if (patientRole == null)
        {
            patientRole = new Role { Name = "Patient", Description = "Patient", TenantId = tenantId, IsSystem = true };
            dbContext.Roles.Add(patientRole);
            await dbContext.SaveChangesAsync();
        }

        // Assign all permissions to Admin role
        foreach (var perm in permissions.Values)
        {
            var exists = await dbContext.RolePermissions.AnyAsync(rp => rp.RoleId == adminRole.Id && rp.PermissionId == perm.Id);
            if (!exists)
            {
                dbContext.RolePermissions.Add(new RolePermission
                {
                    RoleId = adminRole.Id,
                    PermissionId = perm.Id,
                    AssignedAt = DateTime.UtcNow
                });
            }
        }

        // Assign limited permissions to Doctor role
        var doctorPermissions = new[]
        {
            "companies.read", "employees.read", "doctors.read",
            "protocols.read", "protocols.write",
            "visits.read", "visits.write", "visits.sign",
            "scheduling.read", "reports.read"
        };

        foreach (var permName in doctorPermissions)
        {
            if (permissions.TryGetValue(permName, out var perm))
            {
                var exists = await dbContext.RolePermissions.AnyAsync(rp => rp.RoleId == doctorRole.Id && rp.PermissionId == perm.Id);
                if (!exists)
                {
                    dbContext.RolePermissions.Add(new RolePermission
                    {
                        RoleId = doctorRole.Id,
                        PermissionId = perm.Id,
                        AssignedAt = DateTime.UtcNow
                    });
            }
            }
        }

        await dbContext.SaveChangesAsync();

        // Seed users
        var adminUser = await dbContext.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email == "admin");
        if (adminUser == null)
        {
            adminUser = new User
            {
                Email = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                FirstName = "Admin",
                LastName = "User",
                TenantId = tenantId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(adminUser);
            await dbContext.SaveChangesAsync();
        }

        var doctorUser = await dbContext.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email == "doctor");
        if (doctorUser == null)
        {
            doctorUser = new User
            {
                Email = "doctor",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Doctor123!"),
                FirstName = "Doctor",
                LastName = "User",
                TenantId = tenantId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(doctorUser);
            await dbContext.SaveChangesAsync();
        }

        // Assign roles to users
        var adminUserRole = await dbContext.UserRoles.FirstOrDefaultAsync(ur => ur.UserId == adminUser.Id && ur.RoleId == adminRole.Id);
        if (adminUserRole == null)
        {
            dbContext.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id, AssignedAt = DateTime.UtcNow, AssignedByUserId = adminUser.Id });
        }

        var doctorUserRole = await dbContext.UserRoles.FirstOrDefaultAsync(ur => ur.UserId == doctorUser.Id && ur.RoleId == doctorRole.Id);
        if (doctorUserRole == null)
        {
            dbContext.UserRoles.Add(new UserRole { UserId = doctorUser.Id, RoleId = doctorRole.Id, AssignedAt = DateTime.UtcNow, AssignedByUserId = adminUser.Id });
        }

        // Seed patient user
        var patientUser = await dbContext.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email == "patient");
        if (patientUser == null)
        {
            patientUser = new User
            {
                Email = "patient",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Patient123!"),
                FirstName = "Patient",
                LastName = "User",
                TenantId = tenantId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(patientUser);
            await dbContext.SaveChangesAsync();
        }

        // Ensure patient user has a corresponding employee record so the patient portal can resolve the employee ID
        if (!dbContext.Employees.Any(e => e.Id == patientUser.Id))
        {
            var firstCompany = await dbContext.Companies.FirstOrDefaultAsync();
            var firstBranch = await dbContext.Branches.FirstOrDefaultAsync(b => b.CompanyId == firstCompany.Id);
            var firstJobRole = await dbContext.JobRoles.FirstOrDefaultAsync();
            var firstDoctor = await dbContext.Doctors.FirstOrDefaultAsync();

            dbContext.Employees.Add(new Employee
            {
                Id = patientUser.Id,
                CompanyId = firstCompany.Id,
                TenantId = tenantId,
                BranchId = firstBranch.Id,
                JobRole = firstJobRole.Name,
                JobRoleId = firstJobRole.Id,
                FirstName = patientUser.FirstName,
                LastName = patientUser.LastName,
                TaxCode = $"PATIENT{patientUser.Id:D8}",
                BirthDate = new DateTime(1990, 1, 1),
                Gender = "M",
                BirthCity = "Roma",
                BirthCityCode = "H501",
                PersonalEmail = patientUser.Email,
                PhoneNumber = "+39 000 0000000"
            });

            dbContext.MedicalVisits.Add(new MedicalVisit
            {
                EmployeeId = patientUser.Id,
                DoctorId = firstDoctor.Id,
                TenantId = tenantId,
                VisitDate = DateTime.UtcNow.Date.AddDays(-10),
                NextDeadlineDate = DateTime.UtcNow.Date.AddDays(20),
                Outcome = "Idoneo senza limitazioni",
                ClinicalNotes = "Visita demo per paziente test.",
                VisitType = MedicalVisitType.Periodic,
                TargetOrgans = "Apparato respiratorio",
                ObjectiveExam = "Esame obiettivo nella norma."
            });

            await dbContext.SaveChangesAsync();

            var patientVisit = await dbContext.MedicalVisits.FirstOrDefaultAsync(v => v.EmployeeId == patientUser.Id);
            if (patientVisit != null && !dbContext.Anamneses.Any(a => a.MedicalVisitId == patientVisit.Id))
            {
                dbContext.Anamneses.Add(new Anamnesis
                {
                    MedicalVisitId = patientVisit.Id,
                    TenantId = tenantId,
                    WorkHistory = "Anamnesi lavorativa per paziente test.",
                    PersonalHistory = "Anamnesi personale negativa.",
                    FamilyHistory = "Nessuna familiarità rilevante.",
                    RemotePathology = "Nessuna patologia remota.",
                    RecentPathology = "Nessuna patologia recente."
                });
            }

            await dbContext.SaveChangesAsync();
        }

        var patientUserRole = await dbContext.UserRoles.FirstOrDefaultAsync(ur => ur.UserId == patientUser.Id && ur.RoleId == patientRole.Id);
        if (patientUserRole == null)
        {
            dbContext.UserRoles.Add(new UserRole { UserId = patientUser.Id, RoleId = patientRole.Id, AssignedAt = DateTime.UtcNow, AssignedByUserId = adminUser.Id });
        }

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
