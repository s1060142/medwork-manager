# MedWork Manager — QA Checklist
**Data**: Settembre 2026
**Stato**: BETA HARDENING PHASE

---

## Scopo

Checklist operativa per validare ogni feature prima del rilascio. Basata sui requisiti di produzione definiti in AGENTS.md e `PLAYWRIGHT_E2E_CAMPAIGN.md`.

---

## Pre-Lancio Checklist (Ogni Feature)

### 🔨 Build & Code Quality
- [ ] `dotnet build` passa senza errori
- [ ] `npm run build` (frontend) passa senza errori
- [ ] `dotnet test` — tutti i test passano (backend)
- [ ] Nessun warning nuovo introdotto
- [ ] Lint frontend: 0 errori
- [ ] Nessuna dipendenza obsoleta o vulnerabile

### 🧪 Test
- [ ] Unit test per nuova logica di business
- [ ] Integration test per nuovo endpoint API
- [ ] Playwright E2E test per nuova UI
- [ ] Grid sync test (se applicabile)
- [ ] Test di regressione: nessun modulo esistente rotto
- [ ] Test di performance: nessun timeout con dataset realistico

### 🔒 Sicurezza & Multi-Tenancy
- [ ] **TenantId filtering**: ogni query filtra per TenantId
- [ ] **No cross-tenant data leak**: test di isolamento multi-tenant superato
- [ ] **Authorization**: ruolo corretto per ogni endpoint (Admin/Doctor/RSPP)
- [ ] **No hardcoded secrets**: nessuna credential in appsettings.json committed
- [ ] **JWT**: token con scadenza ragionevole, refresh token funzionante
- [ ] **Audit trail**: ogni operazione registrata lato server

### 📱 UI & UX
- [ ] **Build validation**: Vite build verde
- [ ] **UI validation**: Playwright test per UI nuovo componente
- [ ] **Workflow validation**: flusso utente completo testato
- [ ] **Click count**: nessun click superfluo introdotto
- [ ] **Responsive**: UI funziona su desktop e tablet
- [ ] **Accessibility**: elementi interattivi con ruoli ARIA corretti

### 📝 Documentazione
- [ ] **Documentazione aggiornata**: se il comportamento cambia, aggiornare docs
- [ ] **AGENTS.md**: se la feature cambia le regole di progetto, aggiornare AGENTS.md
- [ ] **Product Bible**: riflettere lo stato attuale del modulo
- [ ] **Release Notes**: changelog per l'utente finale

---

## Modulo per Modulo: Checklist di Validazione

### 🏭 Aziende & Company Groups
- [ ] CRUD aziende funzionante (nome, P.IVA, ATECO, sedi)
- [ ] Company Groups CRUD (`CompanyGroupsController` + UI)
- [ ] Archivio Documentale Unico flag funziona
- [ ] Import CSV/Excel funziona
- [ ] **Tenant isolation**: nessuna azienda di altro tenant visibile
- [ ] Master Data aggiornato

### 👤 Lavoratori
- [ ] CRUD dipendenti completo (23+ campi)
- [ ] EmployeeProfileDialog con tutte le tab
- [ ] Fattori di rischio assegnabili
- [ ] Stato archiviato server-side (non localStorage)
- [ ] **Tenant isolation**: nessun dato di altro tenant visibile
- [ ] GlobalSearchModal funziona

### 🏥 Visite Mediche
- [ ] `MedicalVisitStepper` funzionante
- [ ] `MedicalVisitsController` CRUD completo
- [ ] Giudizio di idoneità con OutcomeCode + Prescrizioni + Limitazioni
- [ ] **Calcolo automatico prossima scadenza** da protocollo
- [ ] JobRole protocol fallback funzionante
- [ ] Age-based cadence reduction (>50 anni)
- [ ] `VisitJudgmentController` endpoint operativo
- [ ] **Tenant isolation**: nessuna visita di altro tenant visibile

### 📋 Protocolli
- [ ] CRUD protocolli nel DB (non localStorage!)
- [ ] Assegnazione a JobRole funzionante
- [ ] Toggle active/inactive funzionante
- [ ] Steps JSON con N esami e N cadenze
- [ ] Compliance check integrato
- [ ] QuestionnairesController funzionante
- [ ] **Tenant isolation**: nessun protocollo di altro tenant visibile

### 📅 Scadenziario
- [ ] `DeadlineCalculationService` integrato nel flusso visite
- [ ] `ActivityDeadlinesCenter` funzionante
- [ ] `VaccinationDeadlinesCenter` funzionante
- [ ] `SiteVisitDeadlinesCenter` funzionante
- [ ] `AppointmentsCenter` + `AppointmentsCalendar` funzionanti
- [ ] `DashboardScadenze` carica con paginazione
- [ ] Auto-calcolo scadenza post-visita

### 📝 Documenti & PDF
- [ ] `FitnessJudgmentPdfDocument` genera PDF corretto
- [ ] `Allegato3APdfDocument` genera cartella 3A conforme
- [ ] `AnnualHealthReportPdfDocument` genera relazione art. 40
- [ ] `DocumentsController` endpoint validate/submit Allegato 3B
- [ ] `SignatureController` + `ISignatureService` funzionanti
- [ ] `BatchSignatureCenter` operativo
- [ ] PDF legalmente valido (firmabile)
- [ ] **Tenant isolation**: nessun documento di altro tenant scaricabile

### 🔔 Notifiche
- [ ] `AlertsController` endpoint funzionante
- [ ] `AlertMultiChannelService` con TenantId corretto
- [ ] `NotificationChannel` enum esteso
- [ ] Log notifiche con TenantId corretto (non hardcoded = 1)
- [ ] **Tenant isolation**: nessuna notifica di altro tenant inviata

### ⚖️ Compliance
- [ ] `ComplianceController` funzionante
- [ ] `ComplianceCenter.jsx` UI funzionante
- [ ] 5+ regole D.Lgs. 81/08 implementate
- [ ] `QuestionnairesController` + scoring funzionanti
- [ ] Audit trail server-side (`AuditController.cs`)
- [ ] `AuditCenter.jsx` UI funzionante

### 🔐 Autenticazione
- [ ] Login con tenant slug
- [ ] JWT Bearer con refresh token
- [ ] Remember me funzionante
- [ ] Logout con cleanup token
- [ ] RBAC Admin/Doctor/RSPP
- [ ] **No hardcoded credentials** in produzione
- [ ] **TenantContextFilter** inietta TenantId corretto (non fallback = 1)

### 📊 Reports
- [ ] `ReportsCenter.jsx` genera PDF server-side
- [ ] `AnalyticsCenter.jsx` KPI visibili
- [ ] `EnterpriseAnalyticsDashboard` funzionante
- [ ] Relazione art. 40 server-side
- [ ] Export CSV/Excel funziona

### 🏗️ Module Aggiuntivi
- [ ] `CompanyGroupsController` + UI
- [ ] `MasterDataController` operativo
- [ ] `CompanyNominationsController` funzionante
- [ ] `MedicalVisitAIController` endpoint funzionante
- [ ] `PhraseTemplatesController` + UI
- [ ] `QuestionnairesController` + UI
- [ ] `RecallCampaignsCenter.jsx` funzionante
- [ ] `HealthPlanPreview.jsx` funzionante
- [ ] `GlobalSearchModal.jsx` funzionante
- [ ] `ActivityDeadlinesController` + UI
- [ ] `AppointmentsController` + Calendar
- [ ] `VisitPlanningCenter.jsx` funzionante

---

## Checklist Sicurezza (Critical)

### 🔴 Must Fix (Prima di Ogni Deploy)
- [ ] **Admin123! backdoor**: rimosso da codice produzione
- [ ] **JWT secret**: non hardcoded, da gestire con vault
- [ ] **TenantId fallback**: nessun fallback a tenant 1, restituire 401/403
- [ ] **AlertMultiChannelService**: TenantId iniettato dal contesto reale
- [ ] **Audit trail**: server-side, immutabile, non cancellabile
- [ ] **CORS**: configurato per ambiente, non localhost in produzione
- [ ] **No hardcoded secrets** in appsettings.json committed

### 🟠 Must Fix (Entro 30 Giorni)
- [ ] **Global exception handler**: nessuno stack trace esposto al client
- [ ] **Structured logging**: `ILogger<T>` in tutti i servizi
- [ ] **EPPlus licenza**: aggiornare a 5+ o sostituire con ClosedXML
- [ ] **DTOs**: separare entità EF da API responses
- [ ] **Paginazione**: su tutti gli endpoint di lista
- [ ] **Rate limiting**: configurato su endpoint sensibili

---

## Checklist Multi-Tenancy (Obbligatoria)

Per ogni nuova query o modifica:
- [ ] **TenantId filter**: incluso in ogni query EF
- [ ] **No `Any()` senza filtro**: nessun accesso a dati di altri tenant
- [ ] **Test di isolamento**: verifica che tenant A non vede tenant B
- [ ] **Audit**: log del TenantId per ogni operazione
- [ ] **Migration**: nessun dato di fallback hardcoded

---

## Checklist Playwright (E2E)

Per ogni nuova feature:
- [ ] Nuovo test Playwright creato (P0/P1/P2)
- [ ] Test incluso in `grid-sync-*.spec.ts` o nuovo spec file
- [ ] Test di isolamento multi-tenant incluso
- [ ] Test di autorizzazione per ruolo incluso
- [ ] Test di regressione: nessun test esistente rotto
- [ ] **Beta gate**: test incluso nella lista 13 P0 (se P0)

---

## Regole QA

1. **Nessuna feature senza test**: se non è testata, non è completa
2. **Nessun cross-tenant data leak**: mai, per nessun motivo
3. **Nessun hardcoded secret**: mai, per nessun motivo
4. **Nessun stub in produzione**: ciò che è annunciato deve funzionare
5. **Ogni cambiamento di comportamento richiede aggiornamento della documentazione**
6. **Testare come utente finale**: interpretare Medico Competente, Segreteria, Datore di Lavoro, RSPP

---

## Metriche QA

| Metric | Target | Stato |
|---|---|---|
| Backend test pass rate | 100% | ✅ 48+ pass |
| Frontend build | verde | ✅ Pass |
| Playwright Beta gate | 13/13 P0 | 🔴 In verifica |
| Grid sync | 5/5 PASS | ✅ Pass |
| Security critical fix rate | 100% | 🔴 Parziale |
| Cross-tenant leak tests | 0 fail | ✅ Pass (6 moduli) |
| Documentation in sync | 100% | ✅ Questo documento |

---

*Aggiornato: Settembre 2026 — BETA HARDENING PHASE*
*Fonte: `PLAYWRIGHT_E2E_CAMPAIGN.md`, `AGENTS.md`, codice sorgente*
