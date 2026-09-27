# MedWork Manager — Implemented Features
**Data**: Settembre 2026
**Stato**: BETA HARDENING PHASE

Storico delle feature consegnate, ordinate per fase e priorità.

## Sprint 5 — Mansione Anamnesis Checklist & Auth/Proxy Hardening (Settembre 2026)

| Feature / Miglioria | Dettaglio Implementativo | Stato |
|---|---|---|
| **Checklist Anamnestica Dinamica per Mansione & Rischi (Allegato 3A)** | `MedicalVisitStepper.jsx`: Sostituito il vecchio dropdown "Frasi Rapide" con checklist clinica strutturata su 7 categorie di rischio (VDT, MMC, Rumore & Vibrazioni, Chimico & Polveri, Lavoro Notturno, Guida & Quota, Negatività Generale). Auto-matching con `jobRole` del lavoratore, badge `★ Suggerito`, 1-click apply standard e toggles individuali. | ✅ Conforme |
| **Auth & Context Bootstrap Root Cause Resolution** | `App.tsx`: `handleLoginSuccess` e bootstrap effect ora caricano esplicitamente `/api/master-data/companies` impostando `activeCompanyId`, eliminando il problema delle API calls 401 a cascata. | ✅ Conforme |
| **Navigation & ReferenceError Fix** | `App.tsx`: Eliminato residuo `setSelectedCompanyTab` orfano in `handleAreaNavigation` che causava errore silenzioso e blocco montaggio vista lavoratori. | ✅ Conforme |
| **Vite Preview Proxy Support** | `vite.config.js`: Aggiunto blocco `preview.proxy` identico a `server.proxy` per consentire validazioni E2E e QA sia su dev server (5173) che preview server (4173). | ✅ Conforme |
| **Rimozione Voci Orfane "Frasi Tipo"** | `App.tsx`: Rimozione di `phrase-templates` da chip navigation, macro-aree e routing. | ✅ Conforme |

## Sprint 4 — Active Company Context & Single Source of Truth Architecture (Settembre 2026)

| Feature / Miglioria | Dettaglio Implementativo | Stato |
|---|---|---|
| **Global Active Company Selector (Topbar)** | `App.tsx`: Selettore unificato `🏢 Azienda:` con supporto per `🌐 Tutte le Aziende (Globale)` e singola azienda con visualizzazione sedi operative collegate. | ✅ Conforme |
| **Active Branch / Sede Selector** | `App.tsx`: Selettore dinamico sede (`📍 Tutte le Sedi` o specifica sede) che si attiva quando un'azienda è selezionata. | ✅ Conforme |
| **Persistent Clinical Context Banner** | `App.tsx`: Banner sticky ad alta visibilità presente in testa a ogni pagina con indicazione di Ragione Sociale, Sede, stato di isolamento e shortcut "Torna a Vista Globale". | ✅ Conforme |
| **Removal of Duplicate Local Filtering** | Rimossi tutti i selettori/filtri locali ridondanti di azienda in presenza di contesto attivo (`WorkersCenter`, `GiudizioIdoneitaCenter`, `ReportsCenter`, `Allegato3BCenter`, `RecallCampaignsCenter`, `AppointmentsCalendar`, `SiteVisitDeadlinesCenter`, `EmployerPortalView`). L'azienda attiva è ora l'unica fonte di verità (Single Source of Truth). | ✅ Conforme |
| **Full Context Propagation across 100% of Screens** | Propagazione e scoping automatico di lavoratori, visite, giudizi, scadenze, campagne e reportistica su tutti i moduli (`WorkersCenter`, `GiudizioIdoneitaCenter`, `CartellaSanitariaCenter`, `MedicalVisitStepper`, `ReportsCenter`, `Allegato3BCenter`, `Dashboard`, `DashboardMedico`, `DashboardScadenze`, `ComplianceCenter`, `RecallCampaignsCenter`, `AppointmentsCalendar`, `BillingCenter`, `ActivityDeadlinesCenter`, `NominationsDeadlinesCenter`, `VaccinationDeadlinesCenter`, `SiteVisitDeadlinesCenter`, `EmployerPortalView` e viste `CrudEntityView`). | ✅ Conforme |
| **Backend Query Filtering Alignment** | `DoctorCrudController.cs`: Aggiunto parametro query `companyId` agli endpoint `dashboard`, `calendar-events`, `compliance-alerts`, consentendo il calcolo automatico di KPI, calendari e allerte scoped all'azienda attiva. | ✅ Conforme |
| **Context Persistence** | Persistenza automatica di `activeCompanyId` e `activeBranchId` in `localStorage` (`medwork.runtime.settings`) con ripristino istantaneo al ricaricamento o login. | ✅ Conforme |

---

## Sprint 3 — UX Modernization, Full Modules Integration & Hardening (Settembre 2026)

| Feature / Miglioria | Dettaglio Implementativo | Stato |
|---|---|---|
| **Ripristino Cockpit "Il Mio Giorno"** | `App.tsx`: reintrodotti `import Dashboard` e il case `moduleKey === 'dashboard'`; la voce `{ key: 'dashboard', label: 'Il Mio Giorno' }` è la **prima** chip dell'area *Sorveglianza Sanitaria* e il **landing di default per il ruolo Medico** (login + reload). | ✅ Conforme |
| **Reintegrazione Completa 27 Centri Specialistici** | `App.tsx`: integrati tutti i moduli orfani nelle 7 macro-aree (`giudizio-idoneita`, `cartella-sanitaria`, `firma-grafometrica`, `compliance`, `allegato-3b`, `analytics`, `agenda`, `appointments`, `recall-campaigns`, `activity-deadlines`, `nominations`, `vaccination-deadlines`, `alert-multicanale`, `company-groups-workspace`, `medical-staff`, `migration`, `phrase-templates`, `questionnaires`, `employer-portal`). Zero vicoli ciechi. | ✅ Conforme |
| **Allineamento DTO API & Notifiche PEC** | `RecallCampaignsCenter.jsx`: allineato payload `/api/alerts/send` (`channel: 3` per PEC, array `recipients`). | ✅ Conforme |
| **Barra Tab Reportistica & Relazione Art. 40** | `ReportsCenter.jsx`: aggiunta barra tab `ANALYSIS_TABS` per navigazione immediata fra visite, attività, relazioni aziendali e grafici. | ✅ Conforme |
| **Suite Test E2E & Physician Scenarios** | Allineati tutti i test Playwright (`tests/physician-scenarios.spec.ts`, `tests/p0-p1-features.spec.ts`, `tests/ui.smoke.spec.ts`, `tests/company-groups-ui-validation.spec.ts`, `tests/sprint-documents-signature.spec.ts`, `tests/acceptance-scenarios.spec.ts`) con esito 100% verde. | ✅ Conforme |


## Sprint 2 — Frontend UX Modernization & SaaS Shell Refactoring (Settembre 2026)

| Feature / Miglioria | Dettaglio Implementativo | Stato |
|---|---|---|
| **LocalizationProvider Integration** | `main.jsx`: Configurato `LocalizationProvider` root con `AdapterDateFns` e locale `it`, risolvendo i crash di data picker in Sorveglianza Sanitaria e Reportistica. | ✅ Conforme |
| **Doctor Cockpit Hub & Landing** | `App.tsx` + `DashboardMedico.jsx`: Default automatico per ruolo Medico su `DashboardMedico` con triage clinico, scadenze a 7 giorni e pulsanti diretti *"⚡ Avvia Visita"*. | ✅ Conforme |
| **SaaS Navigation Shell & Context Header** | `App.tsx` + `App.css`: Sostituito topbar/sidebar legacy con layout SaaS moderno; inserito Company Context Switcher rapido nell'header, rimosso il form legacy a 7 campi orizzontali, aggiunta breadcrumb bar e limitazione viewport a 1600px max-width per monitor ultrawide. | ✅ Conforme |
| **Clean Build & JSX Audit** | `WorkersCenter.jsx` + `ReportsCenter.jsx` + `CrudEntityView.jsx`: Eliminati attributi JSX duplicati e warning di build, assicurando bundle di produzione a zero errori. | ✅ Conforme |

---

## Sprint 1 — Quick Wins UX & Navigation Refactoring (Settembre 2026)

| Feature / Miglioria | Dettaglio Implementativo | Stato |
|---|---|---|
| **Navigation Consolidation** | `App.tsx`: Rimosso sottomenu Checklist da Aziende, spostata Cartella 3A sotto Sorveglianza Sanitaria, rimosse entry duplicate di visite/reporting, ridotta frammentazione tab orizzontali. | ✅ Conforme |
| **Centro Giudizi & Firma Massiva Unificati** | `GiudizioIdoneitaCenter.jsx`: Unificata Firma Massiva nel Centro Giudizi; rimossa tab Batch Signature separata; aggiunta selezione bulk con checkbox, pulsante `Firma e Invia PEC Selezionati`, modal di conferma con PIN e auto-dispatch. | ✅ Conforme |
| **Tunnel 1-Click "Avvia Visita" in Scadenze** | `DashboardScadenze.jsx` + `MedicalVisitsController.cs` + `ExpiringMedicalVisitDto.cs`: Azione diretta rapida per visite in scadenza/scadute con pre-selezione automatica di lavoratore, azienda e protocollo attivo. | ✅ Conforme |
| **Worker Quick Add (Reverse CF Parsing)** | `taxCode.js` + `EmployeeProfileDialog.jsx`: Parsing automatico Codice Fiscale italiano con calcolo data di nascita, sesso, codice Belfiore e comune di nascita. | ✅ Conforme |
| **Employer Portal 1-Click ZIP Download** | `EmployerPortalView.jsx`: Pulsante in evidenza nell'header "Scarica tutti i giudizi validi (ZIP)" con visual feedback e download immediato archivio certificati. | ✅ Conforme |
| **Medical Staff Validation Hardening** | `MedicalStaffCenter.jsx` + `MedicalStaffController.cs` + `apiClient.ts`: Campi obbligatori espliciti (*), sanitizzazione stringhe vuote a `null` (evita falsi errori su PEC/Phone/Email opzionali), rimozione alert browser e introduzione alert inline Material-UI con validazione client-side e parsing RFC9110 problem+json. | ✅ Conforme |

---

## P0 Commercial & P1 Enterprise Competitor Hardening (Settembre 2026)

| Feature / Modulo | Dettaglio Architetturale | Stato |
|---|---|---|
| **Universal Migration Engine** | `LegacyMigrationService.cs` + `MigrationController.cs` (import ZIP da CartSan, Winasped, Zucchetti) | ✅ Conforme |
| **Keyboard Fast Track & Macro Expander** | `useTextExpander.js` (shortcode `.norm`, `.vdt`, `.mmc`, `.rum`, `.guida`, `.notte`, `.chim`, `.rach`, `.udito`, `.derma` + tasto `F4`) | ✅ Conforme |
| **PEC Automation Pipeline** | `PecDeliveryService.cs` + certificazione AgID e tracking ricevute di consegna | ✅ Conforme |
| **Smart Deadline Engine** | `DeadlineRuleEngine.cs` + `DeadlineEngineController.cs` (calcolo automatico scadenze D.Lgs. 81/08) | ✅ Conforme |
| **Smart Mansiogramma & Matrice Rischi** | `JobRoleRiskMatrix.jsx` integrato nella scheda azienda (Tab 4 Mansiogramma Dinamico) | ✅ Conforme |
| **Portale RSPP / Datore di Lavoro** | `EmployerPortalView.jsx` (Tab 4 App, KPI conformità, scadenzario e certificati senza dati clinici sensibili) | ✅ Conforme |
| **Firma FEA su Tablet (AgID)** | `SignaturePadModal.jsx` + tracciamento biometrico e hash SHA-256 per visite e giudizi | ✅ Conforme |
| **Portale Pre-Visita Anamnesi** | `PatientPortalController.cs` + `QuestionnairesController.cs` compilazione pre-visita | ✅ Conforme |
| **Prefatturazione & Listini Prestazioni** | `BillingController.cs` endpoint `price-lists` e `pre-invoicing-summary` per centro medico | ✅ Conforme |
| **No-Show Management & Diffide Formali** | `RecallCampaignsCenter.jsx` gestione mancata presentazione e invio sollecito formale ex Art. 20 D.Lgs. 81/08 | ✅ Conforme |
| **Centro Gestione Personale Sanitario** | `MedicalStaffController.cs` + `MedicalStaffCenter.jsx` (gestione Medici Competenti/Coordinati/Sostituti, Infermieri, Segreteria, Codice Fiscale, Ordine, PEC, Firma Digitale, assenze/ferie e assegnazione aziende/sedi) | ✅ Conforme |
| **Zero-Docker Native Host Dev & SQLite DB** | Backend e Frontend su Host nativo (`dotnet run` + `npm run dev`) con SQLite locale (`medwork.db`), auto-seeding e scripts di avvio rapido (`start-medwork.bat`, `start.medwork.bat`, `start-medwork.ps1`, `start.medwork.ps1` con `cmd /k` per visibilità errori) | ✅ Conforme |

---

## P0 — Productivity Improvements (Fase 3)

| Feature | Dettaglio | Stato |
|---|---|---|
| Refresh token + remember me | `LoginCard.jsx` con `rememberMe` e `refreshToken` | ✅ |
| TenantId server-side | `TenantContextFilter` inietta TenantId dal JWT | ✅ |
| Fix Admin123! backdoor | Rimosso da codice produzione | ✅ |
| Fix protocol localStorage → DB | `ProtocolsCenter.jsx` ora persiste nel DB | ✅ |
| Fix AdminCrudController copy-paste | `LegalName` duplicato risolto | ✅ |
| Fix tipo visita italiano | Non più solo inglese | ✅ |
| Fix worker archive → server-side | Non più localStorage | ✅ |

---

## P1 — Productivity Improvements (Fase 4)

| Feature | Dettaglio | Stato |
|---|---|---|
| Legal Documents Sprint | QuestPDF: FitnessJudgment + Allegato3A + AnnualHealthReport | ✅ |
| `DocumentsController` | Endpoint `allegato-3b/{id}/validate` e `allegato-3b/{id}/submit` | ✅ |
| Company Groups UI | `CompanyGroupsController` + `CompanyGroupsCenter.jsx` | ✅ |
| Master Data API | `MasterDataController` | ✅ |
| AI Charting Sprint | `AIChartingService.cs` implementato | ✅ |
| `MedicalVisitAIController` | Endpoint AI per supporto visita | ✅ |
| CompanyNominationsController | Gestione nomine | ✅ |
| PhraseTemplatesController | Template frasi anamnestiche | ✅ |
| QuestionnairesController | Questionari compliance con scoring | ✅ |
| RecallCampaignsCenter | Campagne di richiamo | ✅ |
| HealthPlanPreview | Antepiano piano sanitario | ✅ |
| BatchSignatureCenter | Firma batch documenti | ✅ |
| ActivityDeadlinesController | Scadenze attività | ✅ |
| AppointmentsCenter + Calendar | Gestione appuntamenti | ✅ |
| GlobalSearchModal | Ricerca globale lavoratore | ✅ |
| 23 Employee fields | Migration applicata | ✅ |
| Grid sync | 5 file, 5/5 PASS (Companies, Employees, Protocols, Visits, Medical Records) | ✅ |

---

## Legal Documents Sprint

| Documento | Componente | Stato |
|---|---|---|
| **Fitness Judgment PDF** | `FitnessJudgmentPdfDocument.cs` (QuestPDF) | ✅ |
| **Cartella Sanitaria 3A** | `Allegato3APdfDocument.cs` (QuestPDF) | ✅ |
| **Relazione Annuale Art. 40** | `AnnualHealthReportPdfDocument.cs` (QuestPDF) | ✅ |
| **Allegato 3B INAIL** | `DocumentsController` con XSD validation + submit | ✅ |
| **Firma Grafometrica** | `SignatureController` + `ISignatureService` (RSA SHA-256) | ✅ |

---

## Critical Improvements Sprint

| Fix | Dettaglio | Stato |
|---|---|---|
| Admin123! rimosso | Solo in test fixtures (`appsettings.Testing.json`) | ✅ |
| TenantId fallback → 401 | `TenantContextFilter` non usa più fallback = 1 | ✅ |
| AlertMultiChannelService TenantId | Inietta TenantId reale dal contesto | ✅ |
| Audit trail → server-side | `AuditController.cs` + `AuditCenter.jsx` (non più localStorage) | ✅ |
| DocumentGenerationService → QuestPDF | Non più stub | ✅ |
| Protocol multi-step → DB | Protocol con Steps JSON nel DB | ✅ |
| LoginCard refresh | Refresh token + remember me | ✅ |
| Type visita italiano | Localizzazione completata | ✅ |
| **GlobalSearchModal.jsx `Stack` ReferenceError** | Aggiunto `Stack` all'import `@mui/material` in `GlobalSearchModal.jsx` — era usato il componente `<Stack>` senza importazione, causando `Uncaught ReferenceError: Stack is not defined` | ✅ Risolto |
| **GlobalSearchModal doppio click → CartellaSanitaria** | Due bug collegati: (1) `App.tsx` `onSelectWorker` navigava a `medical-visit-stepper` invece di `cartella-sanitaria` quando si selezionava un lavoratore dalla search; (2) `REINTEGRATED_MODULES['cartella-sanitaria']` non passava `employeeId={selectedEmployeeIdForVisit}` a `CartellaSanitariaCenter`, causando la visualizzazione del selector dropdown invece del caricamento automatico della cartella. Aggiunto `useEffect` in `CartellaSanitariaCenter` per sincronizzare i cambiamenti di `employeeIdProp` allo stato interno | ✅ Risolto |
| Porte dev bloccate dal SO (frontend non si avvia) | `fix-dev-ports.ps1`: diagnostica e sblocca in modo permanente 5173/5279 quando Hyper-V/WSL/Docker (HNS + `winnat`) le riservano come *excluded port range* (Vite `EACCES`, Kestrel socket `10013`). Preflight `-CheckOnly` integrato in `start-medwork.ps1` e `start-medwork.bat`, che interrompe l'avvio con istruzioni chiare invece di fallire in modo opaco | ✅ |

---

## ECC Remediation (Completato — Settembre 2026)

| Issue | Severity | Stato |
|---|---|---|
| Hardcoded master password | CRITICAL | ✅ Risolto |
| TenantId fallback = 1 | CRITICAL | ✅ Risolto |
| AlertMultiChannelService TenantId hardcoded | CRITICAL | ✅ Risolto |
| Audit trail localStorage | HIGH | ✅ Risolto |
| Protocol localStorage | HIGH | ✅ Risolto |
| JWT secret placeholder | HIGH | ⚠️ Richiede vault |
| EPPlus licenza | HIGH | ⚠️ Richiede upgrade |
| CORS produzione | MEDIUM | ⚠️ Richiede config |
| Global exception handler | MEDIUM | ⚠️ Non implementato |
| Structured logging | MEDIUM | ⚠️ Non implementato |
| Paginazione API | MEDIUM | ✅ Risolto |
| DTOs mancanti | MEDIUM | ⚠️ Parziale |
| Duplicate JWT claims (tenant_id + TenantId) | CRITICAL | ✅ Risolto |
| N+1 queries in GetDashboard | CRITICAL | ✅ Risolto |
| Integer division in compliance score | CRITICAL | ✅ Risolto |
| TenantContextFilter over-aggressive ModelState | CRITICAL | ✅ Risolto |
| Sync-over-async in DocumentGenerationService | CRITICAL | ✅ Risolto |
| GroupProtocols wrong group ID | CRITICAL | ✅ Risolto |
| Duplicate GetTenantId across 14 controllers | HIGH | ✅ Risolto |
| Claim name mismatch (TenantId vs tenant_id) | HIGH | ✅ Risolto |
| Create endpoints missing ModelState validation | HIGH | ✅ Risolto |
| BatchSignVisits no error handling | HIGH | ✅ Risolto |
| WorkersCenter.jsx dead code | HIGH | ✅ Risolto |
| AuthContext stale state | HIGH | ✅ Risolto |
| TestAuthHandler claim mismatch | HIGH | ✅ Risolto |
| Controller GetTenantId missing fallback (5) | HIGH | ✅ Risolto |
| Employer/RSPP IDOR Object-Level Authorization | CRITICAL | ✅ Risolto |
| Eradication of native browser alerts (Global MUI Notification/Snackbar) | HIGH | ✅ Risolto |

---

## Archiviato (Pre-Settembre 2026)

- ~~FASE 0: AppDbContext FK fix, DI registration, PhraseTemplate seed~~
- ~~FASE 1: MedicalRecordController, VisitJudgmentController, SignatureController~~
- ~~FASE 2: Company Groups UI, Playwright campaign, grid-sync~~
- ~~FASE 3-4: Tutte le feature sopra elencate~~

---

*Vedere `PRODUCT_VISION.md` per il contesto, `CURRENT_CAPABILITIES.md` per lo stato attuale.*
