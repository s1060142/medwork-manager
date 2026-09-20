# MedWork Manager — Product Bible
**Ruolo**: Product Owner + CTO + UX Lead + Medico Competente + QA Lead
**Data**: Settembre 2026
**Stato**: BETA HARDENING PHASE

---

## 📖 Cosa è MedWork

MedWork Manager è un software di **medicina del lavoro** basato su D.Lgs. 81/08. Gestisce:
- Anagrafica aziende e lavoratori
- Visite mediche e giudizi di idoneità
- Protocolli sanitari e scadenziario
- Cartella Sanitaria 3A (Allegato 3A DM 9/7/2012)
- Allegato 3B INAIL
- Relazione annuale art. 40
- Compliance e audit trail
- Notifiche multi-canale
- AI charting supporto visita (AIChartingService)

---

## 🏗️ Stack Tecnologico (Attuale)

| Layer | Tecnologia |
|---|---|
| **Backend** | ASP.NET Core 10 |
| **ORM** | Entity Framework Core 10.0.12 |
| **Database** | SQL Server LocalDB (dev) / SQL Server 2025 (Docker) |
| **Frontend** | React + Vite + Material UI (MUI) |
| **PDF** | QuestPDF (server-side) |
| **Testing BE** | xUnit + WebApplicationFactory |
| **Testing FE** | Vitest + Testing Library + Playwright |
| **Auth** | JWT Bearer custom + refresh token |
| **Multi-tenancy** | TenantId su ogni entità + TenantContextFilter |
| **Excel** | EPPlus 8.7.0 |

---

## 🎯 Principi di Prodotto

MedWork deve essere:
- **Faster di CartSan**
- **Faster di Winasped**
- **Faster di 81ML**

Sempre preferire:
- meno click
- meno digitazione
- più automazione
- compliance legale
- produttività del medico

---

## 📐 Architettura

**Monolite REST** (non microservizi):
- Singolo progetto ASP.NET Core con tutti i layer
- Frontend Vite + React + MUI (SPA)
- API REST JSON / JWT
- Nessun API gateway, nessun event bus, nessun cache layer

**Componenti backend principali**:
- `Controllers/` — 30 controller REST
- `Services/` — 23 servizi di logica di business
- `Data/` — AppDbContext + EF Core 10 + Migrations
- `Documents/` — generatori PDF via QuestPDF

**Controller chiave** (30):
`AdminCrudController`, `DoctorCrudController`, `MedicalVisitsController`, `MedicalRecordController`, `MedicalRecordsController`, `VisitJudgmentController`, `DocumentsController`, `SignatureController`, `AlertsController`, `CompanyGroupsController`, `MasterDataController`, `AuditController`, `PatientPortalController`, `MedicalVisitAIController`, `AppointmentsController`, `ActivityDeadlinesController`, `BillingController`, `CompanyNominationsController`, `ComplianceController`, `IntegrationController`, `AnalyticsController`, `PhraseTemplatesController`, `QuestionnairesController`, `VisitExamsController`, `AgendaController`, `AdminController`, `AuthController`, `BaseController`, `DeadlineEngineController`, `MigrationController`.

---

## 🔒 Sicurezza e Multi-Tenancy

### Regole fondamentali
1. **TenantId filtering** — ogni query deve filtrare per TenantId
2. **Authorization boundaries** — RBAC con Role → Permission
3. **Data leakage prevention** — nessun cross-tenant data access
4. **Audit trail immutabile** — server-side, non cancellabile dall'utente

### Autenticazione
- JWT Bearer con scadenza e refresh token
- Ruoli: Admin, Doctor, RSPP
- Tenant slug obbligatorio nel login
- BCrypt per password hash

### Problemi noti (da monitorare)
- EPPlus 8.7.0 license (aggiornare a 5+ o sostituire con ClosedXML)
- CORS configurazione per ambiente
- JWT secret placeholder (richiede Key Vault)
- DTOs mancanti su alcuni endpoint

---

## 📋 Moduli e Stato Attuale

### Moduli COMPLETI ✅
- Anagrafica lavoratori (WorkersCenter + EmployeeProfileDialog, 23+ campi)
- Anagrafica aziende (CompanyProfileDialog + CompanyGroupsCenter)
- Registro medici (DoctorCrudController)
- Protocolli sanitari (ProtocolsCenter + DB persistence)
- Visite mediche base (MedicalVisitStepper + MedicalVisitsController)
- Giudizi di idoneità (VisitJudgmentController + GiudizioIdoneitaCenter)
- Firma grafometrica (SignatureController + FirmaGrafometricaCenter)
- Documenti PDF (QuestPDF: FitnessJudgment, Allegato3A, AnnualHealthReport)
- Allegato 3B (DocumentsController con validate/submit)
- Notifiche multi-canale (AlertMultiChannelService)
- Compliance engine (ComplianceController + ComplianceCenter)
- Audit trail (AuditController server-side)
- Company Groups (CompanyGroupsController + CompanyGroupsCenter)
- Master Data (MasterDataController)
- AI Charting (AIChartingService)
- Dashboard (DashboardMedico + DashboardScadenze)
- Gestione scadenze (ScadenziarioPeriodicityService + DeadlineCalculationService)
- Ricerca globale (GlobalSearchModal)
- Appointment management (AppointmentsController + Calendar)
- Activity Deadlines (ActivityDeadlinesController)
- Questionnaires (QuestionnairesController + scoring)
- Phrase Templates (PhraseTemplatesController)
- Recall Campaigns (RecallCampaignsCenter)
- Billing (BillingController)
- Health Plan Preview (HealthPlanPreview.jsx)
- Batch Signature (BatchSignatureCenter)

### Moduli PARZIALI ⚠️
- Cartella Sanitaria 3A (MedicalRecordController, struttura base)
- Relazione annuale art. 40 (AnnualHealthReportPdfDocument)
- Reporting analitico (ReportsCenter, AnalyticsCenter, EnterpriseAnalyticsDashboard)
- Import/Export HR (CSV/Excel, EPPlus)
- SPID/CIE (ExternalAuthService stub)

### Moduli ASSENTI ❌
- App mobile offline-first
- OCR referti
- Portale lavoratori aziendale (self-service)
- SPIN/CIE login reale
- Protocol Designer visivo
- Benchmark KPI anonimo
- Redis cache
- Structured logging (Serilog)
- Global exception handler

---

## 🧪 Testing e Validazione

### Strategia attuale
- **Unit tests BE**: EntityValidationTests + integration tests (xUnit)
- **E2E Playwright**: 45+ test cases cross-modulo
- **Grid sync tests**: 5 file, 5/5 PASS (Companies, Employees, Protocols, Visits, Medical Records)
- **Frontend build**: Vite build verde
- **Backend tests**: 48+ test passanti

### Requisiti per ogni feature
- Build validation ✅
- UI validation (Playwright) ✅
- Workflow validation ✅
- Tenant isolation test ✅
- Regression prevention ✅

---

## 🏥 Moduli a Priorità Legale (Massima Attenzione)

1. **Medical Visits** — ogni modifica richiede validazione extra
2. **Fitness Judgments** — documento con valenza legale (DPR 445/2000)
3. **Medical Records (Allegato 3A)** — conforme DM 9 Luglio 2012
4. **Allegato 3B** — conforme specifica INAIL reale
5. **Relazione Art. 40** — obbligatoria D.Lgs. 81/08
6. **Compliance** — D.Lgs. 81/08 regole
7. **Scheduling** — scadenze legali

---

## 🔍 ECC Review Rules

Quando ECC è disponibile, prioritizzare:
1. Critical issues
2. High issues
3. Security
4. Multi-tenancy
5. Data integrity
6. Performance

**Regola**: mai introdurre nuova funzionalità durante ECC remediation (a meno che non sia strettamente necessario).

---

## 📏 Metriche di Successo

**Successo =** physician completes tasks faster + fewer clicks + fewer errors + better compliance + better legal protection + stable production behavior.

**Non successo** = reports generated, code written, files modified.

---

## 📝 Documentazione Governata

Questo documento fa parte del set di documentazione controllato. Se l'implementazione cambia il comportamento, aggiornare questo documento.

File richiesti: `PRODUCT_BIBLE.md`, `CURRENT_CAPABILITIES.md`, `IMPLEMENTED_FEATURES.md`, `ROADMAP.md`, `TEST_STRATEGY.md`, `QA_CHECKLIST.md`, `ARCHITECTURE.md`, `SECURITY_AND_MULTI_TENANCY.md`, `OPERATIONAL_WORKFLOWS.md`, `RELEASE_READINESS.md`.

---

*Ultimo aggiornamento: Settembre 2026 — BETA HARDENING PHASE*
*Stack aggiornato: ASP.NET Core 10, EF Core 10.0.12, EPPlus 8.7.0*
