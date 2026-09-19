# MedWork Manager — Architecture
**Data**: Settembre 2026

---

## Backend

**ASP.NET Core 10** + **EF Core 8** + **SQL Server**

Monolite REST (no microservizi, no API gateway, no event bus).

### Controllers (28+)
`AdminCrudController`, `DoctorCrudController`, `MedicalVisitsController`, `MedicalRecordController`, `VisitJudgmentController`, `DocumentsController`, `SignatureController`, `AlertsController`, `CompanyGroupsController`, `MasterDataController`, `AuditController`, `PatientPortalController`, `MedicalVisitAIController`, `AppointmentsController`, `ActivityDeadlinesController`, `BillingController`, `CompanyNominationsController`, `ComplianceController`, `IntegrationController`, `AnalyticsController`, `PhraseTemplatesController`, `QuestionnairesController`, `VisitExamsController`, `AgendaController`, `AdminController`, `BaseController`, `AuthController`.

### Services (20+)
`DeadlineCalculationService`, `DocumentGenerationService`, `AlertMultiChannelService`, `PersonalProtocolAssignmentService`, `ScadenziarioPeriodicityService`, `QuestionnaireScoringService`, `AIChartingService` (stub), `ExternalAuthService` (SPID/CIE stub), `JwtTokenService`, `TenantService`, `FieldEncryptionService`, `MockNotificationService`.

### Document Generation
`FitnessJudgmentPdfDocument`, `Allegato3APdfDocument`, `AnnualHealthReportPdfDocument` — tutti via QuestPDF (server-side).

### Database
EF Core Code First Migrations (`Fase0MultiTenantAndPhraseQuestionnaire`, `AlignPasswordsAndFixPending`). 32+ entity types. Multi-tenant con `TenantId` su ogni entity. `AppDbSeeder` con `MigrateAsync`.

---

## Frontend

**React 19** + **Vite** + **Material UI (MUI)** — SPA, 43 componenti.

### Componenti Principali
`LoginCard`, `Dashboard`, `DashboardMedico`, `DashboardScadenze`, `WorkersCenter`, `EmployeeProfileDialog`, `CompanyProfileDialog`, `CompanyGroupsCenter`, `MedicalVisitStepper`, `GiudizioIdoneitaCenter`, `ProtocolsCenter`, `CartellaSanitariaCenter`, `Allegato3BCenter`, `Allegato3BPreview`, `FirmaGrafometricaCenter`, `ReportsCenter`, `AnalyticsCenter`, `EnterpriseAnalyticsDashboard`, `BillingCenter`, `AuditCenter`, `AlertMulticanaleCenter`, `ComplianceCenter`, `GlobalSearchModal`, `HealthPlanPreview`, `BatchSignatureCenter`, `PhraseTemplatesCenter`, `QuestionnairesCenter`, `RecallCampaignsCenter`, `ActivityDeadlinesCenter`, `AppointmentsCenter`, `AppointmentsCalendar`, `AgendaCenter`, `VisitPlanningCenter`, `NominationsDeadlinesCenter`, `VaccinationDeadlinesCenter`, `SiteVisitDeadlinesCenter`, `HrImportExportDialog`, `CrudEntityView`, `EntityDataView`, `PatientAnamnesisForm`, `SettingsCenter`, `ToolsCenter`, `HomeCapabilities`.

### API Client
`apiClient.ts` — gestisce URL base, headers JWT, proxy Vite.

---

## Multi-Tenancy

```
TenantContextFilter (Middleware):
  → Legge tenantId da JWT claims
  → Se manca → 401 Unauthorized (NO fallback a = 1)
  → Inietta TenantId in HttpContext

EF Core Global Query Filter:
  → Ogni entity con TenantId filtra automaticamente
  → Nessun accesso cross-tenant per default

Controller Authorization:
  → [Authorize(Roles = AppRole.Admin)] o [Doctor + Admin]
  → Verifica ruolo + tenantId su ogni richiesta
```

**Stato**: ✅ Funzionante. Fallback = 1 rimosso. Test di isolamento su 6 moduli (Playwright).

---

## PDF Generation

**QuestPDF** (Community licence, < $1M revenue) — server-side.

```
Controller → IDocumentGenerationService → DocumentGenerationService
  → FitnessJudgmentPdfDocument (giudizio idoneità)
  → Allegato3APdfDocument (cartella 3A)
  → AnnualHealthReportPdfDocument (relazione art. 40)
```

Non più jsPDF client-side (preventivo manipolazione dati prima della firma).

`DocumentsController` con endpoint per Allegato 3B validate/submit.

---

## Authentication

```
POST /api/auth/login → AuthController
  → TenantSlug lookup → User lookup + BCrypt verify → JWT generation
  → Restituisce { accessToken, refreshToken }

POST /api/auth/refresh → JwtTokenService → nuovo access + refresh token

RBAC: Role → RolePermission → Permission + UserPermission override

Ruoli: Admin, Doctor, RSPP
```

- `JwtTokenService` — generazione token con claims (userId, email, roles, permissions, tenantId)
- `LoginCard.jsx` — remember me + refresh token automatico
- **⚠️ JWT secret**: placeholder in configurazione, richiede Key Vault

---

## Stack Completo

| Layer | Tecnologia | Versione |
|---|---|---|
| Backend | ASP.NET Core | 10.0 |
| ORM | Entity Framework Core | 8.x |
| Database | SQL Server | LocalDB (dev) |
| Frontend | React + Vite + MUI | React 19, MUI 7 |
| PDF | QuestPDF | Community |
| Testing BE | xUnit + WebApplicationFactory | — |
| Testing FE | Vitest + Playwright | — |
| Auth | JWT Bearer custom | + refresh token |
| Password | BCrypt.Net | 4.x |
| Excel | EPPlus | 4.5.x ⚠️ |
| Container | Docker | Dockerfile entrambi i layer |

---

## Vulnerabilità Note

| Issue | Severity | Stato |
|---|---|---|
| EPPlus 4.5.x license | HIGH | ⚠️ Richiede upgrade |
| JWT secret placeholder | HIGH | ⚠️ Richiede Key Vault |
| CORS localhost | MEDIUM | ⚠️ Richiede config ambiente |
| Global exception handler | MEDIUM | ⚠️ Non implementato |
| Structured logging | MEDIUM | ⚠️ Non implementato |
| Rate limiting | LOW | ⚠️ Non implementato |
| No pagination su liste | MEDIUM | ⚠️ Parziale |

---

*Vedere `SECURITY_AND_MULTI_TENANCY.md` per approfondimento sicurezza.*
