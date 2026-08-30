# Audit Findings Report — Login, Dashboard & Routing Scope
**Project:** MedWork occupational-health SaaS  
**Auditor:** Architect  
**Date:** 2026-08-29  
**Scope:** LoginCard, AuthContext, App.tsx (+ App.before-gestionale.jsx), apiClient/services, Dashboard.jsx, DashboardMedico.jsx, DashboardScadenze.jsx, backend Auth + Dashboard endpoints, docs.  
**Constraint:** Read-only audit. No code changes.

---

## 1. LOGIN FLOW

### 1.1 LoginCard.jsx — Visible Actions
- **Username field** — local state only; no API call until submit.  
  Classification: N/A (input)
- **Password field** — local state only.  
  Classification: N/A (input)
- **"Ricordami (30 giorni)" checkbox** — `checked={rememberMe}` (`LoginCard.jsx:78`), but value is **never sent** to backend and never persisted to storage.  
  Classification: **STUB** — UI-only, no session extension.  
  Root cause: `LoginCard.jsx:78` (state not passed to `authLogin`); `AuthContext.tsx:15` (no refresh/expiry logic).
- **"Accedi" button** — `handleSubmit` (`LoginCard.jsx:23`) calls `authLogin(username, password, 'default')` (`LoginCard.jsx:29`).  
  API: `POST /api/auth/login` payload `{ username, password, tenantSlug: 'default' }` (`apiClient.ts:92-96`).  
  Backend: `AuthController.Login` (`AuthController.cs:39`) — **EXISTS**.  
  DB: validates user via `UserService.ValidatePasswordAsync` against `Users` table scoped by tenant (`TenantService.cs:160-166`).  
  TenantId isolation: **YES** — tenant resolved from slug before user lookup (`AuthController.cs:46-53`).  
  Classification: **WORKING** (login succeeds).  
  Root cause: none for basic auth.
- **"Password dimenticata?" link** — `onClick` calls `onForgotPassword()` (`LoginCard.jsx:49`).  
  Frontend handler: **MISSING** — `App.tsx:957` renders `<LoginCard onLoginSuccess={handleLoginSuccess} />` without `onForgotPassword` prop.  
  API call: none.  
  Backend endpoint: none (no reset-password controller found).  
  Classification: **BROKEN** (dead link).  
  Root cause: `App.tsx:957` (prop not passed) + no backend reset endpoint.

### 1.2 AuthContext.tsx
- **Token / TenantId provider** — reads from `localStorage` at mount (`AuthContext.tsx:15-16`).  
  Classification: **WORKING** (passive provider).  
  Gap: **no silent refresh**, no token expiry monitoring.  
  Root cause: `AuthContext.tsx:15` (static `useState`, no effect/refresh logic).

---

## 2. APP ROUTER / GLOBAL NAVIGATION

### 2.1 App.tsx — Sidebar Areas
All six sidebar items (`SIDE_NAV_ITEMS`, `App.tsx:80-87`) call `handleAreaNavigation` (`App.tsx:453`), which sets `selectedArea` and `selectedModuleKey`.  
Classification: **WORKING** (state routing).  
However, several module keys inside areas have **no render target** in `renderModuleContent` (`App.tsx:466-607`):

| Module key | Label | Render target | Status |
|---|---|---|---|
| `doctor-dashboard` | Dashboard Medico (`App.tsx:171`) | **MISSING** — falls to fallback message | **BROKEN** |
| `cartella-sanitaria` | Cartella Sanitaria 3A (`App.tsx:174`) | **MISSING** | **BROKEN** |
| `giudizio-idoneita` | Giudizio Idoneità (`App.tsx:175`) | **MISSING** | **BROKEN** |
| `firma-grafometrica` | Firma Grafometrica (`App.tsx:176`) | **MISSING** | **BROKEN** |
| `allegato-3b` | Allegato 3B INAIL (`App.tsx:177`) | **MISSING** | **BROKEN** |
| `alert-multicanale` | Alert Multi-canale (`App.tsx:178`) | **MISSING** | **BROKEN** |
| `phrase-templates` | Frasi tipo (`App.tsx:169`) | **MISSING** | **BROKEN** |
| `questionnaires` | Questionari (`App.tsx:170`) | **MISSING** | **BROKEN** |

Fallback message: `Modulo non disponibile per il ruolo corrente.` (`App.tsx:606`).  
Root cause: `App.tsx:466-607` (`renderModuleContent` lacks switch cases for these keys).

### 2.2 App.tsx — Topbar Actions
- **Menu button** (`App.tsx:964`) — no `onClick` handler.  
  Classification: **BROKEN** (no-op).  
  Root cause: `App.tsx:964`.
- **"Cerca lavoratore..." Autocomplete** (`App.tsx:968-986`) — `options={[]}` (`App.tsx:971`), `freeSolo`, `disableClearable`. No live search wired.  
  Classification: **STUB**.  
  Root cause: `App.tsx:971` (empty options, no `onInputChange` fetch).
- **Notifiche button** (`App.tsx:989`) — no handler.  
  Classification: **BROKEN**.  
  Root cause: `App.tsx:989`.
- **ChangeLog / Manuale / Profilo buttons** (`App.tsx:995-1000`) — no handlers.  
  Classification: **BROKEN**.  
  Root cause: `App.tsx:995-1000`.
- **Logout button** (`App.tsx:1001`) — calls `handleLogout` (`App.tsx:352`), clears `localStorage` and state.  
  Classification: **WORKING**.  
  API: none (client-side only; backend `/api/auth/logout` stub at `AuthController.cs:235` not called).  
  Root cause: none.
- **Esporta CSV / Excel** (`App.tsx:1005-1020`) — call `hrExportCsv` / `hrExportExcel` (`apiClient.ts:26-71`).  
  API: `GET /api/integrations/export-employee-csv`, `GET /api/integrations/export-employee-excel`.  
  Classification: **WORKING** (assuming backend routes exist and return blobs).

### 2.3 App.before-gestionale.jsx — Variant
- **Module chips strip** (`App.before-gestionale.jsx:452-469`) — renders `areaModuleItems` and calls `setSelectedModuleKey`.  
  Classification: **WORKING** (state routing).  
  Same broken module keys as App.tsx apply here (no `doctor-dashboard`, `cartella-sanitaria`, etc. render targets).
- **Missing sidebar** — this variant has no sidebar; only module chips.  
  Classification: **PARTIALLY WORKING** (reduced navigation).

---

## 3. DASHBOARD SURFACES

### 3.1 Dashboard.jsx ("Il Mio Giorno")
Note: actual file path is `medwork-frontend/src/components/Dashboard.jsx` (not `src/Dashboard.tsx`).
- **Visite in programma oggi card** — displays `summary?.visitsToday`.  
  API: `GET /api/doctor-data/dashboard` (`Dashboard.jsx:14`).  
  Backend: `DoctorCrudController.GetDashboardSummary` (`DoctorCrudController.cs:563`) — **EXISTS**.  
  DB: `MedicalVisits` filtered by `TenantId` and `VisitDate.Date == today` (`DoctorCrudController.cs:570-573`).  
  Classification: **WORKING**.
- **Scadenze (prossimi 7 gg) card** — displays `summary?.deadlinesThisWeek`.  
  Backend: same endpoint, counts distinct employees with `NextDeadlineDate` in next 7 days (`DoctorCrudController.cs:575-582`).  
  Classification: **WORKING**.
- **Visite scadute card** — displays `summary?.overdueVisits`.  
  Backend: same endpoint, counts distinct employees with `NextDeadlineDate < today` (`DoctorCrudController.cs:584-589`).  
  Classification: **WORKING**.
- **Missing "Da firmare" card** — Dashboard.jsx does **not** show unsigned visits / judgments to sign.  
  Classification: **MISSING IMPLEMENTATION**.  
  Root cause: `Dashboard.jsx:14-23` (only fetches summary, no unsigned-visits call).

### 3.2 DashboardMedico.jsx
- **KPI cards + "Visite in scadenza" table** — on mount, calls `apiGet('/api/master-data/medical-visits')` and `apiGet('/api/master-data/medical-records')` (`DashboardMedico.jsx:46-47`).  
  API: `GET /api/master-data/medical-visits`, `GET /api/master-data/medical-records`.  
  Backend: `MasterDataController.GetMedicalVisits` (`MasterDataController.cs:224`), `GetMedicalRecords` (`MasterDataController.cs:201`) — **EXISTS** but **NO TENANT FILTER**.  
  DB persistence: returns ALL tenants' visits/records.  
  Classification: **BROKEN** (cross-tenant data leak + no pagination).  
  Root cause: `MasterDataController.cs:228` and `MasterDataController.cs:205` (no `.Where(x => x.TenantId == ...)`).
- **"Da firmare" KPI** — computed client-side as `toSign` (`DashboardMedico.jsx:70`) by filtering visits where `!v.isSigned` and due within 7 days.  
  Classification: **PARTIALLY WORKING** (derived from unpaginated, unfiltered master data).  
  Root cause: `DashboardMedico.jsx:46` (depends on unfiltered master-data feed).
- **Quick action buttons** — none on this component; navigation is via sidebar.

### 3.3 DashboardScadenze.jsx (Home)
- **KPI cards / Alert Critici / Quick Actions / Compliance / Appuntamenti** — on mount (and when `days` changes), calls `caricaScadenze` (`DashboardScadenze.jsx:90`), which fires **5 parallel API calls** (`DashboardScadenze.jsx:95-101`):
  1. `GET /api/medical-visits/expiring?days=${days}` — backend `MedicalVisitsController.GetExpiringVisits` (`MedicalVisitsController.cs:22`). **EXISTS**, tenant-isolated (`MedicalVisitsController.cs:41`), **NO PAGINATION**.
  2. `GET /api/master-data/medical-visits` — backend `MasterDataController.GetMedicalVisits` (`MasterDataController.cs:224`). **EXISTS**, **NO TENANT FILTER**, **NO PAGINATION**.
  3. `GET /api/master-data/employees` — backend `MasterDataController.GetEmployees` (`MasterDataController.cs:66`). **EXISTS**, **NO TENANT FILTER**, **NO PAGINATION**.
  4. `GET /api/master-data/visit-exams` — backend `MasterDataController.GetVisitExams` (`MasterDataController.cs:252`). **EXISTS**, **NO TENANT FILTER**, **NO PAGINATION**.
  5. `GET /api/master-data/employee-risks` — backend `MasterDataController.GetEmployeeRisks` (`MasterDataController.cs:181`). **EXISTS**, **NO TENANT FILTER**, **NO PAGINATION**.
- **"Nuova Visita Medica" button** (`DashboardScadenze.jsx:381`) — calls `onOpenMedicalVisitCreate`, which in `App.tsx:471` sets `selectedModuleKey('medical-visit-stepper')`. Navigation target exists.  
  Classification: **WORKING** (navigation only; actual save endpoint inside MedicalVisitStepper is out of scope).
- **"Nuovo Lavoratore" button** (`DashboardScadenze.jsx:382`) — calls `onOpenEmployeeCreate`, which in `App.tsx:472` triggers `quickCreateRequest`.  
  Classification: **WORKING** (quick-create wiring).
- **"Backup Dati Now" button** (`DashboardScadenze.jsx:383`) — calls `caricaScadenze`, which simply **reloads the same data**.  
  Classification: **WRONG BEHAVIOR** (misleading label; no backup operation).  
  Root cause: `DashboardScadenze.jsx:383`.
- **"Esporta Report" button** (`DashboardScadenze.jsx:354`) — calls `handleExportReport`, exports `criticalAlerts` to CSV via `downloadCsv`.  
  Classification: **WORKING** (client-side export).
- **"Vedi Calendario Completo" button** (`DashboardScadenze.jsx:440`) — calls `onOpenReports`, which in `App.tsx:473` sets `selectedModuleKey('reporting')`.  
  Classification: **WORKING** (navigation).
- **Overall classification for DashboardScadenze data loading**: **BROKEN** for master-data endpoints due to missing tenant isolation and missing pagination (timeout risk with 500+ employees).  
  Root cause: `DashboardScadenze.jsx:95-101` + `MasterDataController.cs:66-98` etc.

---

## 4. BACKEND AUTH + DASHBOARD ENDPOINTS

### 4.1 AuthController
- **`POST /api/auth/login`** (`AuthController.cs:39`) — validates tenant slug, user email/password, returns JWT + role + tenantId. **EXISTS**.  
  Token lifetime: `ExpiresIn = 3600` (1h) (`AuthController.cs:69`), but `JwtSettings.ExpirationMinutes` is 60 (`JwtSettings.cs:8`). The response field is informational; actual expiry is from JWT settings.
- **`POST /api/auth/refresh`** (`AuthController.cs:204`) — **EXISTS** (stub implementation, re-issues token).  
  Frontend usage: **NONE** — no frontend code calls refresh.  
  Classification: **STUB** (backend ready, frontend not wired).  
  Root cause: `apiClient.ts` (no `authRefresh` function) + `AuthContext.tsx:15` (no refresh effect).
- **`POST /api/auth/logout`** (`AuthController.cs:235`) — stub, returns OK. No token blacklist.  
  Classification: **STUB**.
- **External auth (SPID/CIE/Keycloak)** — endpoints exist (`AuthController.cs:73-167`), frontend has `authLoginWithExternalProvider` (`apiClient.ts:106`), but no UI wires them.  
  Classification: **STUB**.

### 4.2 DoctorCrudController (Dashboard Summary)
- **`GET /api/doctor-data/dashboard`** (`DoctorCrudController.cs:563`) — returns `visitsToday`, `deadlinesThisWeek`, `overdueVisits`.  
  TenantId: read from claim via `GetTenantId()` (`DoctorCrudController.cs:960-965`). **FALLBACK TO 1** if claim missing/invalid.  
  Classification: **WORKING** but **unsafe fallback**.  
  Root cause: `DoctorCrudController.cs:964` (`id : 1` fallback).

### 4.3 MasterDataController (Dashboard Data Feeds)
Endpoints `GetMedicalVisits`, `GetMedicalRecords`, `GetEmployees`, `GetVisitExams`, `GetEmployeeRisks`, etc. — **NO TENANT FILTER** in LINQ queries.  
`GetTenantId()` helper exists (`MasterDataController.cs:622-626`) but is **only used in `SearchEmployees`, `GetPhraseTemplates`** — not in the bulk master-data endpoints.  
TenantContextFilter (`TenantContextFilter.cs:16`) is registered globally (`Program.cs:31`), but it only overwrites `TenantId` on **action arguments** (model binding), not on arbitrary query filters. Since these controllers don't accept `TenantId` parameters, the filter has no effect on the queries.  
Classification: **BROKEN** (cross-tenant data leak + no pagination).  
Root cause: `MasterDataController.cs:224-250`, `MasterDataController.cs:201-222`, `MasterDataController.cs:66-98`, etc. (missing `.Where(x => x.TenantId == tenantId)`).

### 4.4 MedicalVisitsController
- **`GET /api/medical-visits/expiring?days=`** (`MedicalVisitsController.cs:22`) — tenant-isolated (`MedicalVisitsController.cs:41`), **NO PAGINATION**.  
  Classification: **PARTIALLY WORKING** (correct filter, but timeout risk with large result sets).  
  Root cause: `MedicalVisitsController.cs:35-59` (`.ToListAsync()` without `.Skip().Take()`).

### 4.5 JWT / Security
- **JWT secret** — `JwtTokenService.GetSecretKey()` (`JwtTokenService.cs:19-34`) checks `JWT_SECRET` env var first, then `JwtSettings.SecretKey`. Throws if missing.  
  Classification: **WORKING** (fail-fast configured).
- **No silent refresh** — frontend never calls `/api/auth/refresh`. Session dies at expiry (60 min).  
  Classification: **BROKEN** (UX blocker per product bible).  
  Root cause: `AuthContext.tsx:15` (no refresh interval) + `apiClient.ts` (no refresh function).

---

## 5. SPECIFIC VERIFICATION CHECKS

### 5.1 Routing Targets for Every Menu Item
- **Broken routes identified in App.tsx** (`renderModuleContent`, `App.tsx:466-607`): `doctor-dashboard`, `cartella-sanitaria`, `giudizio-idoneita`, `firma-grafometrica`, `allegato-3b`, `alert-multicanale`, `phrase-templates`, `questionnaires`.  
- **Valid routes**: `home`, `companies`, `employees`, `dashboard`, `employees-crud`, `protocols`, `schedules`, `medical-visit-stepper`, `appointments-calendar`, `compliance`, `batch-signature`, `recall-campaigns`, `billing`, `audit`, `tools`, `analytics`, `settings`, `reporting`, plus all `entityKey` modules resolved via `CrudEntityView`.
- **Orphan import**: `DashboardMedico` is imported (`App.tsx:53`) but never rendered.

### 5.2 Dashboard Quick Actions Wired to Real Endpoints
- **Navigation quick actions** ("Nuova Visita Medica", "Nuovo Lavoratore", "Vedi Calendario Completo") are wired to state changes that render existing components. Navigation itself is **WORKING**.
- **"Backup Dati Now"** is a **WRONG BEHAVIOR** — it reloads dashboard data instead of performing a backup.
- Actual data-persistence endpoints (visit creation, employee creation) live inside child components (`MedicalVisitStepper`, `CrudEntityView`) which are **out of scope** for this audit.

### 5.3 JWT / Refresh Handling
- **Frontend**: no refresh token call, no interceptor, no silent renew.  
- **Backend**: refresh endpoint exists (`AuthController.cs:204`) but is unused.  
- Classification: **BROKEN** (silent refresh missing).

### 5.4 DashboardScadenze Timeout Risk
- **Backend endpoint name**: `/api/medical-visits/expiring` (`MedicalVisitsController.cs:22`) — tenant-scoped but unpaginated.  
- **Master-data endpoints** (`/api/master-data/*`) — unpaginated AND cross-tenant.  
- Risk: with 500+ employees, the 5 parallel unbounded queries in `DashboardScadenze.jsx:95-101` will exhaust memory/timeout.  
- Root cause: `DashboardScadenze.jsx:95-101` + `MasterDataController.cs:66-270` (no pagination).

### 5.5 "Visits Today" / "To Sign" View
- **"Visite in programma oggi"**: EXISTS in `Dashboard.jsx:39-54` (card) backed by `DoctorCrudController.cs:570-573`.
- **"Da firmare"**: EXISTS only as a KPI/table slice inside `DashboardMedico.jsx:112-118` and `DashboardMedico.jsx:160-165`. **No dedicated page/view** for unsigned visits/judgments.  
  Classification: **MISSING IMPLEMENTATION** (dedicated view).

---

## PRIORITIZED FIX LIST

### (A) Clear Bugs to Fix Now

| id | page | action | classification | root cause file:line | recommended fix |
|---|---|---|---|---|---|
| A1 | App.tsx | Sidebar module routing for 8 items (doctor-dashboard, cartella-sanitaria, giudizio-idoneita, firma-grafometrica, allegato-3b, alert-multicanale, phrase-templates, questionnaires) | BROKEN | `App.tsx:466-607` (missing switch cases in `renderModuleContent`) | Add explicit `if (moduleKey === 'doctor-dashboard') return <DashboardMedico />` etc. for each missing module, or map them to existing components. |
| A2 | MasterDataController | Bulk master-data endpoints (medical-visits, employees, medical-records, visit-exams, employee-risks, scheduled-exams, vaccinations, etc.) | BROKEN | `MasterDataController.cs:224`, `MasterDataController.cs:201`, `MasterDataController.cs:66` (no `.Where(x => x.TenantId == tenantId)`) | Inject tenant filter using `GetTenantId()` in every master-data GET; return 401 if tenantId <= 0 instead of falling back to 1. |
| A3 | DashboardScadenze.jsx | Initial data load (5 parallel unbounded queries) | BROKEN | `DashboardScadenze.jsx:95-101` | Replace master-data calls with paginated/scoped endpoints; add server-side `?page=` + `?pageSize=` or date-range filters. |
| A4 | DashboardMedico.jsx | Dashboard KPI + table data load | BROKEN | `DashboardMedico.jsx:46-47` (depends on unpaginated, unfiltered master-data) | Switch to `/api/doctor-data/dashboard` and `/api/doctor-data/medical-visits` (tenant-scoped) or add pagination + tenant filter to master-data calls. |
| A5 | LoginCard.jsx / App.tsx | "Password dimenticata?" link | BROKEN | `App.tsx:957` (missing `onForgotPassword` prop) + no backend reset endpoint | Pass `onForgotPassword` prop and implement `/api/auth/forgot-password` + `/api/auth/reset-password` endpoints, or remove the link until ready. |
| A6 | AuthContext.tsx / apiClient.ts | Silent JWT refresh | BROKEN | `AuthContext.tsx:15` (no refresh interval) + `apiClient.ts` (no `authRefresh` function) | Add `authRefresh()` wrapper for `POST /api/auth/refresh` and a 55-min `setInterval` in `AuthContext` (or an axios/fetch interceptor) that auto-renews before expiry. |
| A7 | App.tsx | Topbar Autocomplete search | STUB | `App.tsx:971` (`options={[]}`) | Wire `onInputChange` to `GET /api/master-data/employees/search?q=` (`MasterDataController.cs:571`) and render results. |
| A8 | App.tsx | Topbar Notifiche / ChangeLog / Manuale / Profilo buttons | BROKEN | `App.tsx:989`, `App.tsx:995-1000` (no `onClick` handlers) | Wire handlers: Notifiche → notification center route/page; Profilo → user profile dialog; ChangeLog/Manuale → dismiss or route to docs. |
| A9 | DashboardScadenze.jsx | "Backup Dati Now" button label/action | WRONG BEHAVIOR | `DashboardScadenze.jsx:383` (`onClick={caricaScadenze}`) | Rename to "Ricarica dati" or implement a real backup export (e.g., download JSON/CSV snapshot). |
| A10 | DoctorCrudController / MasterDataController | TenantId fallback to `1` when claim missing | BROKEN | `DoctorCrudController.cs:964`, `MasterDataController.cs:625` (`id : 1`) | Return `Unauthorized()` (401) when tenant claim is missing/invalid; rely on `TenantContextFilter` to reject earlier. |

### (B) Larger Feature Work

| id | page | action | classification | root cause file:line | recommended fix |
|---|---|---|---|---|---|
| B1 | Dashboard.jsx / DashboardMedico.jsx | Dedicated "Da firmare" / "Visite da completare" view | MISSING IMPLEMENTATION | `Dashboard.jsx:14-23` (no unsigned-visits fetch); no route/page exists | Add `GET /api/doctor-data/unsigned-visits` (backend exists at `DoctorCrudController.cs:919`) and a dedicated "Da firmare" page or tab showing visits where `IsSigned == false`. |
| B2 | MasterDataController | Pagination on all list endpoints | MISSING IMPLEMENTATION | `MasterDataController.cs:66-270` (all use `.ToListAsync()`) | Add `?page=` + `?pageSize=` to every master-data GET; apply `.Skip((page-1)*pageSize).Take(pageSize)` and return `X-Total-Count` header. |
| B3 | MedicalVisitsController | Pagination on `/api/medical-visits/expiring` | MISSING IMPLEMENTATION | `MedicalVisitsController.cs:35-59` (`.ToListAsync()`) | Add pagination parameters and bounded query. |
| B4 | LoginCard.jsx | "Ricordami 30 giorni" persistent session | STUB | `LoginCard.jsx:78` (state not persisted) + no refresh logic | Persist a long-lived refresh token (or extend JWT expiry with rememberMe) and wire silent refresh in `AuthContext`. |
| B5 | App.tsx | Route `doctor-dashboard` to `DashboardMedico` | MISSING IMPLEMENTATION | `App.tsx:171` (module key exists) + `App.tsx:466-607` (no case) | Add `if (moduleKey === 'doctor-dashboard') return <DashboardMedico />` in `renderModuleContent`. |
| B6 | App.tsx | Routes for cartella-sanitaria, giudizio-idoneita, firma-grafometrica, allegato-3b, alert-multicanale, phrase-templates, questionnaires | MISSING IMPLEMENTATION | `App.tsx:174-178`, `App.tsx:169-170` | Add render cases mapping each moduleKey to its respective component (`CartellaSanitariaCenter`, `GiudizioIdoneitaCenter`, etc.). |
| B7 | AuthController / Frontend | Token revocation / real logout | STUB | `AuthController.cs:235` (no blacklist) + `App.tsx:352` (client-side only) | Implement a server-side token blacklist (e.g., cache revoked JTI) and call it from `handleLogout`. |
| B8 | MasterDataController | Tenant-aware master-data filters | BROKEN | `MasterDataController.cs:224-270` | Apply `GetTenantId()` filter to every endpoint; remove unsafe fallback to tenant 1. |

---

## IMPACTED FILES (Summary)
- `medwork-frontend/src/components/LoginCard.jsx`
- `medwork-frontend/src/contexts/AuthContext.tsx`
- `medwork-frontend/src/App.tsx`
- `medwork-frontend/src/App.before-gestionale.jsx`
- `medwork-frontend/src/components/Dashboard.jsx`
- `medwork-frontend/src/components/DashboardMedico.jsx`
- `medwork-frontend/src/components/DashboardScadenze.jsx`
- `medwork-frontend/src/services/apiClient.ts`
- `MedWork.Api/Controllers/AuthController.cs`
- `MedWork.Api/Controllers/DoctorCrudController.cs`
- `MedWork.Api/Controllers/MasterDataController.cs`
- `MedWork.Api/Controllers/MedicalVisitsController.cs`
- `MedWork.Api/Security/TenantContextFilter.cs`
- `MedWork.Api/Security/JwtSettings.cs`
- `MedWork.Api/Services/JwtTokenService.cs`
- `docs/product_bible.md`
- `docs/ux_physician_analysis.md`

---

## RISKS
1. **Cross-tenant data leak** — MasterDataController exposes all tenants' employees, visits, and records to any authenticated user. Immediate GDPR/compliance risk.
2. **Timeout / OOM on DashboardScadenze** — 5 unbounded queries run in parallel; with 500+ employees the browser/backend will hang.
3. **Silent session expiry** — 60-minute JWT with no refresh causes mid-visit logouts, directly impacting physician workflow.
4. **Dead navigation** — 8 menu items route to non-existent render targets, producing blank/error states for users.
5. **Misleading UI** — "Backup Dati Now" and "Ricordami" suggest functionality that does not exist.

## VALIDATION APPROACH
- **Static trace**: verify every `onClick`/`onSubmit` in the scoped components maps to an existing API function and backend route.
- **Route existence**: grep `renderModuleContent` for every `moduleKey` in `MODULE_ITEMS` and `HIERARCHICAL_SIDE_NAV`.
- **Tenant isolation**: inspect LINQ queries in `MasterDataController` and `MedicalVisitsController` for `.Where(x => x.TenantId == ...)`.
- **Pagination**: verify absence/presence of `.Skip()`/`.Take()` on list endpoints.
- **Refresh**: search frontend for `refresh` or `RefreshToken` API calls.
