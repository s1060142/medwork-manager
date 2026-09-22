# MedWork Manager — Implemented Features
**Data**: Settembre 2026
**Stato**: BETA HARDENING PHASE

Storico delle feature consegnate, ordinate per fase e priorità.

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
