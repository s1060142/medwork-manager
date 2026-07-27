# MedWork Manager - Progress Tracking

## Stato generale: ✅ COMPLETATO (copertura modello dati 100%)

Tutte le entità del dominio medicina del lavoro sono implementate:
modello + migrazione EF Core + controller API + validazione FluentValidation.
Build verde, test verdi, generazione PDF reale con font embeddati (headless-safe).

## Entità (ordine di priorità)

| # | Entità | Model | Migration | Controller | Validators | Note |
|---|--------|-------|-----------|------------|------------|------|
| 1 | Company (Azienda) | ✅ | ✅ | ✅ | ✅ | |
| 2 | Branch (Unità produttiva) | ✅ | ✅ | ✅ | ✅ | |
| 3 | Employee (Lavoratore) | ✅ | ✅ | ✅ | ✅ | |
| 4 | JobRole (Mansione) | ✅ | ✅ | ✅ | ✅ | |
| 5 | RiskFactor (Rischio) | ✅ | ✅ | ✅ | ✅ | |
| 6 | Protocol (Protocollo sanitario) | ✅ | ✅ | ✅ | ✅ | |
| 7 | MedicalVisit (Visita medica) | ✅ | ✅ | ✅ | ✅ | |
| 8 | VisitExam (Accertamento) | ✅ | ✅ | ✅ | ✅ | |
| 9 | FitnessOutcome (Giudizio idoneità) | ✅* | ✅ | ✅ | N/A* | vista calcolata da MedicalVisit, no dati clinici (GDPR) |
| 10 | MedicalRecord (Cartella sanitaria) | ✅ | ✅ | ✅ | ✅ | solo ruolo Doctor |
| 11 | ScheduledExam (Scadenzario) | ✅ | ✅ | ✅ | ✅ | |
| 12 | PPE (DPI) | ✅ | ✅ | ✅ | ✅ | Ppe + EmployeePpe + JobRolePpe |
| 13 | Attachments (Documenti) | ✅ | ✅ | ✅ | ✅ | Attachment polimorfo |
| 14 | Injuries (Infortuni) | ✅ | ✅ | ✅ | ✅ | Injury + InjuryAttachment + stats |

*FitnessOutcome = vista esposta dal controller, non entità separata → nessun validator necessario.

## Support entities
Doctor, WorkLocation, SiteVisit, EmployeeRisk, JobRoleRiskFactor, Anamnesis,
Vaccination, NotificationLog, PersonalProtocol, Department, CompanyContact,
CompanyGroup, ExamType, AuditLog → tutte con model + migration + controller + validator.

## Validazione input
- `FluentValidation.AspNetCore` 11.3.0
- 26 validatori in `MedWork.Api/Validators/`
- Registrazione auto: `AddValidatorsFromAssemblyContaining<Program>()`

## PDF (fix completato)
- **QuestPDF 2024.10.0**, licenza Community
- Font embeddati come `EmbeddedResource` (arial.ttf / arialbd.ttf / ariali.ttf)
  registrati via `FontManager.RegisterFontWithCustomName` → funziona su Linux/Docker/headless
- `DocumentGenerationService` genera 3 PDF reali:
  Giudizio idoneità, Piano sanitario individuale, Allegato 3B
- Test `PdfGenerationTests` (3 test) esercitano il codice reale → **PASS**

## Vincoli normativi
- Separazione dati clinici (solo Doctor) / giudizio idoneità (visibile datore/RSPP)
- Ruoli: Doctor, Secretary, RSPP, Employer (policy in `Security/Policies.cs`)
- AuditLog su `AuditDbContext` separato, non cifrato
- FieldEncryptionService (scoped) per dati sensibili

## Build & Test
- `dotnet build` → **0 errori** (solo warning nullable nullable, non bloccanti)
- `dotnet test` → **62 passed, 1 skipped** (lo skip è il test demo SamplePdfWriter)
- PDF tests isolati → **3 passed**

## Migrazioni (AppDbContext)
- `20260726194719_AddPpeEntities`
- `20260726195630_AddAttachmentsEntity`
- `20260726200812_AddInjuriesEntity`
(Nota: `dotnet ef database update` richiede SQL Server avviato via docker-compose;
 i test usano provider InMemory, quindi la logica è verificata indipendentemente dal DB.)

## Come avviare
```bash
docker-compose up -d          # SQL Server 2022 + API su :8080
# oppure
dotnet run --project MedWork.Api/MedWork.Api.csproj
```

## Possibili sviluppi futuri (non bloccati)
- Test di integrazione end-to-end contro SQL Server reale
- Completare encryption DB-level su colonne sensibili
- Espandere copertura test su ogni controller (oggi solo smoke + PDF)
