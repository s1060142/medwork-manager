# MedWork Manager — Current Capabilities
**Data**: Settembre 2026

Cosa funziona oggi, organizzato per modulo.

---

## 🔐 Autenticazione

- Login email/password con tenant slug
- JWT Bearer + refresh token
- "Ricordami" checkbox
- RBAC: Admin, Doctor, RSPP con Role → Permission
- TenantContextFilter per isolamento multi-tenant
- BCrypt password hashing
- SPID/CIE: stub HTTP client (non integrato)
- AI charting: `AIChartingService.cs` implementato

---

## 🔄 Universal Migration Engine (Migrazione & Import)

- **Multi-Format Ingestion**: Parser nativi per Winasped / WinAspi, CartSan, Zucchetti e CSV/Excel unificato.
- **Dry-Run Validation Pipeline**: Validazione preventiva a due fasi (rilevamento KPI, conteggio aziende/lavoratori/visite, deduping codice fiscale, normalizzazione esiti di idoneità).
- **Transactional Commit**: Inserimento atomico transazionale con isolamento per TenantId (`LegacyMigrationService.cs`, `MigrationController.cs`, `MigrationCenter.jsx`).

---

## 📬 PEC Delivery Hub (Notifiche Legali & Giudizi)

- **Configurazione Server PEC**: Gestione parametri SMTP PEC (Host, Porta, SSL, credenziali cifrate con `IFieldEncryptionService`) per singolo tenant.
- **Test Connessione Handshake**: Verifica istantanea autenticazione server PEC da `SettingsCenter.jsx`.
- **Invio Singolo & Massivo con PDF Allegato**: Trasmissione automatica giudizi di idoneità via PEC con certificato PDF QuestPDF generato in-memory (`PecDeliveryService.cs`, `AlertsController.cs`, `GiudizioIdoneitaCenter.jsx`).
- **Audit & Legal Logging**: Tracciamento di ogni tentativo di invio in `NotificationLogs` con stato e data/ora.

---

## 🏢 Portale Datore di Lavoro & RSPP

- **Cruscotto di Conformità (D.Lgs. 81/08)**: Visualizzazione organico sorvegliato, idoneità attive, scadenze entro 60 giorni e scadenze superate (`EmployerPortalView.jsx`).
- **Isolamento GDPR Dati Sanitari**: Accesso limitato alle sole conclusioni legali e prescrizioni operative, con blocco rigido di anamnesi e dati clinici.
- **Download Massivo Archivio Giudizi (ZIP)**: Generazione archivio ZIP in-memory con tutti i certificati PDF più recenti dell'azienda (`DocumentsController.cs`).
- **Segnalazione Nuove Assunzioni / Variazioni**: Modulo per il Datore di Lavoro per richiedere visite preventive o cambi mansione direttamente al Medico Competente.

---

## 🏭 Gestione Aziende

- CRUD completo aziende (nome, P.IVA, ATECO, PEC, SDI)
- Gestione sedi/branche + figure aziendali
- **Company Groups** (`CompanyGroupsController` + `CompanyGroupsCenter.jsx`) con flag `Archivio Documentale Unico`
- Master Data (`MasterDataController`)
- Company Nominations (`CompanyNominationsController`)
- Import CSV/Excel aziende (EPPlus)
- Dashboard con KPI aziendali

---

## 👤 Gestione Lavoratori

- CRUD dipendenti (23+ campi, migration applicata)
- `EmployeeProfileDialog` con tab: Anagrafica, Sorveglianza, Fattori di rischio, Cartella sanitaria
- Fattori di rischio assegnabili (`JobRoleRiskFactor`)
- Stato archiviato server-side (non localStorage)
- `GlobalSearchModal` per ricerca rapida
- Vaccinazioni tracciate
- `HrImportExportDialog.tsx` per import/export HR

---

## 🏥 Visite Mediche

- `MedicalVisitStepper` — flusso step-by-step (anamnesi → obiettivo → giudizio)
- `MedicalVisitsController` — CRUD completo
- `MedicalRecordsController` — CRUD completo cartelle sanitarie
- `VisitJudgmentController` — Giudizi strutturati (OutcomeCode, Prescrizioni, Limitazioni, NextReviewDate)
- Calcolo automatico prossima scadenza da protocollo
- JobRole protocol fallback (se nessun PersonalProtocol, usa protocollo di mansione)
- Age-based cadence reduction (>50 anni: -20%, floor 30gg)
- `MedicalVisitAIController` — endpoint AI per supporto visita (implementato)
- `VisitExamsController` — esami specifici per visita

---

## 📋 Protocolli Sanitari

- CRUD protocolli con **DB persistence** (risolto da localStorage)
- Assegnazione a JobRole con cadenza e scadenza automatica
- Toggle active/inactive
- Steps JSON con N esami e N cadenze diverse
- `QuestionnairesController` + `QuestionnaireScoringService` per compliance
- `ComplianceController` + `ComplianceCenter.jsx` (5+ regole D.Lgs. 81/08)

---

## 📅 Scadenziario

- `DeadlineCalculationService` — calcolo automatico con JobRole fallback
- `ScadenziarioPeriodicityService` — service puro, integrato nel flusso visite
- `ActivityDeadlinesCenter.jsx`, `NominationsDeadlinesCenter.jsx`, `VaccinationDeadlinesCenter.jsx`, `SiteVisitDeadlinesCenter.jsx`
- `AppointmentsCenter.jsx` + `AppointmentsCalendar.jsx` + `AgendaCenter.jsx`
- `DashboardScadenze.jsx`

---

## 📝 Documenti e PDF (QuestPDF, server-side)

- `FitnessJudgmentPdfDocument.cs` — PDF giudizio idoneità legale (DPR 445/2000)
- `Allegato3APdfDocument.cs` — Cartella Sanitaria 3A conforme DM 9/7/2012
- `AnnualHealthReportPdfDocument.cs` — Relazione annuale art. 40
- `DocumentsController` — endpoint `allegato-3b/{id}/validate` e `allegato-3b/{id}/submit`
- `Allegato3BCenter.jsx` + `Allegato3BPreview.jsx`
- `SignatureController` + `ISignatureService` (RSA SHA-256)
- `BatchSignatureCenter.jsx` — firma batch
- `HealthPlanPreview.jsx` — antepiano piano sanitario

---

## 🔔 Notifiche e Comunicazioni

- `AlertsController` + `AlertMultiChannelService` — service multi-canale
- `INotificationTransport` interface (PEC, SMS, Push, WhatsApp, Email)
- `NotificationChannel` enum esteso (Pec/Push/WhatsApp)
- Log notifiche con TenantId server-side corretto
- `MockNotificationService` per retrocompatibilità
- ⚠️ Trasporti reali (PEC/Email) definiti come interface, non implementati

---

## ⚖️ Compliance e Audit

- `ComplianceController` con `ComplianceRuleEngine` (5+ regole D.Lgs. 81/08)
- `AuditController` — audit trail server-side immutabile
- `AuditCenter.jsx` — UI visualizzazione log
- GDPR-compliant: nessun dato cross-tenant, audit immutabile

---

## 📊 Reports e Analisi

- `ReportsCenter.jsx` — generazione report
- `AnalyticsCenter.jsx` — KPI generali
- `EnterpriseAnalyticsDashboard.jsx` — dashboard enterprise
- `BillingCenter.jsx` — gestione fatturazione

---

## 🏗️ Moduli Aggiuntivi

- `CompanyGroupsController` + `CompanyGroupsCenter.jsx`
- `MasterDataController`
- `CompanyNominationsController`
- `MedicalVisitAIController`
- `PhraseTemplatesController` + `PhraseTemplatesCenter.jsx`
- `QuestionnairesController` + `QuestionnairesCenter.jsx`
- `RecallCampaignsCenter.jsx`
- `ActivityDeadlinesController` + center
- `AppointmentsController` + Calendar
- `GlobalSearchModal.jsx`
- `BatchSignatureCenter.jsx`
- `HealthPlanPreview.jsx`
- `VisitPlanningCenter.jsx`
- `CrudEntityView.jsx`

---

## 🔒 Sicurezza

- Admin123! backdoor rimosso da produzione (solo in test fixtures)
- TenantId fallback → 401 (non più = 1)
- AlertMultiChannelService: TenantId iniettato dal contesto reale
- Audit trail server-side immutabile
- JWT secret: placeholder ancora presente (richiede Key Vault)
- EPPlus 8.7.0 license issue (richiede aggiornamento a 5+ o ClosedXML)

---

Vedere `SECURITY_AND_MULTI_TENANCY.md` per dettagli sulla sicurezza.
