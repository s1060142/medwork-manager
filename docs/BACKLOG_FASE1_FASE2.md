# Backlog FASE 1 / FASE 2 — COMPLETATO (stato al 2026-08-11)

> Completato da Hermes Agent: FASE 0 (build+test verdi), FASE 1 gap, FASE 3, FASE 4.
> Test backend: 48/48 verdi. Frontend build: verde.

## FASE 0 — COMPLETATA ✅
- AppDbContext: fix FK multi-tenant rotti (lines 387/466), aggiunti DbSet PhraseTemplate/Questionnaire/QuestionnaireResponse.
- Program.cs: registrazione DI per tutti i service (FASE 1/3/4).
- AppDbSeeder: cablato PhraseTemplateSeed.SeedAsync.
- EntityValidationTests + DoctorCrudController: fix validazione TenantId e date.
- EF Migration generata: `Fase0MultiTenantAndPhraseQuestionnaire`.

## FASE 1 — gap COMPLETATI ✅ (route nuove per non confliggere con FASE 0)
5. Cartella Sanitaria 3A → `MedicalRecordController` (route `api/medical-records-v2`): GET/POST(PUT upsert)/PUT/PATCH autosave/DELETE.
6. Giudizio Idoneità strutturato → `VisitJudgmentController` (route `api/visit-judgments`): PUT su MedicalVisit (OutcomeCode/Outcome/Prescrizioni/Limitazioni/NextReviewDate).
7. Firma grafometrica → `SignatureController` (route `api/signatures`) + `ISignatureService` (RSA SHA-256 verify).
8. Allegato 3B INAIL → `IDocumentGenerationService.ValidateAllegato3BXsd`/`SubmitAllegato3B` (XSD reale) + endpoint in `DocumentsController` (`allegato-3b/{id}/validate|submit`).
9. Alert multi-canale → `AlertsController` (route `api/alerts`) + `AlertMultiChannelService` (PEC/SMS/Push/WhatsApp/Email) + `INotificationTransport`. Enum `NotificationChannel` esteso (Pec/Push/WhatsApp).
   - ScadenziarioPeriodicityService: puro, pronto (cablaggio end-to-end nel flusso Visite rimandato a FASE 2 se richiesto).

## File creati/modificati
Backend:
- `Controllers/MedicalRecordController.cs` (nuovo)
- `Controllers/VisitJudgmentController.cs` (nuovo)
- `Controllers/SignatureController.cs` (nuovo)
- `Controllers/AlertsController.cs` (nuovo)
- `Controllers/DocumentsController.cs` (esteso: validate/submit Allegato 3B)
- `Controllers/DoctorCrudController.cs` (fix validazione date)
- `Controllers/MedicalRecordsController.cs` (FASE 0, invariato)
- `Services/ISignatureService.cs` (nuovo)
- `Services/AlertMultiChannelService.cs` (nuovo, sostituisce MockNotificationService nelle nuove funzioni)
- `Services/DocumentGenerationService.cs` (XSD + submit)
- `Services/IDocumentGenerationService.cs` (esteso)
- `Models/DomainEnums.cs` (NotificationChannel esteso)
- `Program.cs` (DI: ISignatureService, IAlertService, INotificationTransport)
- `AppDbContext.cs` (FASE 0 fix + DbSet)
- `AppDbSeeder.cs` (seed PhraseTemplate)
- `Tests/Integration/Fase1EndpointsTests.cs` (6 test endpoint)

Frontend (`medwork-frontend/src`):
- `components/CartellaSanitariaCenter.jsx` (nuovo)
- `components/GiudizioIdoneitaCenter.jsx` (nuovo)
- `components/FirmaGrafometricaCenter.jsx` (nuovo)
- `components/Allegato3BCenter.jsx` (nuovo)
- `components/AlertMulticanaleCenter.jsx` (nuovo)
- `App.jsx` (menu + render branch per 5 nuovi moduli)

## VERIFICA
- `dotnet test` → 48/48 PASSED
- `npm run build` (frontend) → verde
- Lint nuovi file frontend → 0 errori (2 errori pre-esistenti in App.jsx: `preSelectedEmployeeId`/`areaModuleItems`, NON miei)

## NOTE
- Non eseguito `dotnet ef database update` (richiede SQL Server attivo). Migration pronta, applicata a runtime dal seeder (MigrateAsync).
- MockNotificationService lasciato in DI per retrocompatibilità (usato da notifiche esistenti); AlertMultiChannelService è il nuovo path multi-canale.
- Nessun commit/push eseguito (in attesa OK utente).
