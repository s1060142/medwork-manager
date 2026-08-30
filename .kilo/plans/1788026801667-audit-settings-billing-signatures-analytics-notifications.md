# MedWork — Audit Trail, Settings, Billing, Signatures, Analytics, Notifications
**Scope**: Frontend components + backend controllers/services for the specified modules.  
**Date**: 2026-08-29  
**Auditor**: Kilo (Architect)

---

## 1. AUDIT TRAIL — `AuditCenter.jsx`

### Element: Audit trail table (read)
- **Frontend handler**: `AuditCenter.jsx:25` — `useState(() => readAuditEvents())`
- **API call**: None
- **Backend endpoint**: **NONE EXISTS** — no `AuditController`, no audit API route
- **DB persistence**: `localStorage` key `medwork.audit.events`
- **TenantId isolation**: **NONE** — client-side only, no tenant context
- **Classification**: **BROKEN** (GDPR non-compliant; user-resettable)
- **Root cause**: `medwork-frontend/src/utils/auditTrail.js:1` — `AUDIT_STORAGE_KEY = 'medwork.audit.events'` stored in `localStorage`; `docs/product_bible.md:448` confirms "Audit trail in localStorage — cancellabile dall'utente"

### Element: "Aggiorna" button
- **Frontend handler**: `AuditCenter.jsx:38` — `reload` calls `readAuditEvents()`
- **API call**: None
- **Backend endpoint**: NONE
- **Classification**: **STUB** (no-op reload from localStorage)
- **Root cause**: `AuditCenter.jsx:38`

### Element: "Svuota" button
- **Frontend handler**: `AuditCenter.jsx:40-43` — `clear()` calls `clearAuditEvents()` then `setEvents([])`
- **API call**: None
- **Backend endpoint**: NONE
- **DB persistence**: Deletes `localStorage` key
- **Classification**: **WRONG BEHAVIOR** (user can destroy audit trail; opposite of immutable audit)
- **Root cause**: `medwork-frontend/src/utils/auditTrail.js:30-31` — `clearAuditEvents` removes key; `AuditCenter.jsx:40-43`

### Element: Module filter dropdown
- **Frontend handler**: `AuditCenter.jsx:56` — filters client-side array
- **API call**: None
- **Classification**: **STUB** (client-side filter on localStorage data)
- **Root cause**: `AuditCenter.jsx:33-36`

### All `appendAuditEvent` calls across the app
- **Frontend handler**: `medwork-frontend/src/utils/auditTrail.js:18-27`
- **API call**: None — writes to `localStorage`
- **Backend endpoint**: NONE
- **Classification**: **BROKEN** — all audit events are client-side only
- **Root cause**: `medwork-frontend/src/utils/auditTrail.js:18-27`

---

## 2. SETTINGS — `SettingsCenter.jsx`

### Element: Tenant (Azienda) dropdown
- **Frontend handler**: `SettingsCenter.jsx:88-94` — `applySettings` with `activeCompanyId`
- **API call**: `GET /api/master-data/companies` (loads options) — `SettingsCenter.jsx:35`
- **Backend endpoint**: `MasterDataController.GetCompanies()` — `MasterDataController.cs:22-41`
- **DB persistence**: Reads from DB; selected value saved to `localStorage` key `medwork.runtime.settings`
- **TenantId isolation**: `MasterDataController.GetCompanies()` — **NO TenantId filter** (`MasterDataController.cs:25-38` queries ALL companies, no `Where(x => x.TenantId == tenantId)`)
- **Classification**: **PARTIALLY WORKING** (options load from DB but cross-tenant leak)
- **Root cause**: `MasterDataController.cs:25-38`

### Element: Sede (Dominio operativo) dropdown
- **Frontend handler**: `SettingsCenter.jsx:107` — `applySettings` with `activeBranchId`
- **API call**: `GET /api/master-data/branches` — `SettingsCenter.jsx:35`
- **Backend endpoint**: `MasterDataController.GetBranches()` — `MasterDataController.cs:43-64`
- **DB persistence**: `localStorage`
- **TenantId isolation**: **NONE** — `GetBranches()` has no TenantId filter
- **Classification**: **PARTIALLY WORKING** (cross-tenant branch leak)
- **Root cause**: `MasterDataController.cs:43-64`

### Element: Hostname dominio text field
- **Frontend handler**: `SettingsCenter.jsx:119` — `applySettings` with `activeDomain`
- **API call**: None
- **Backend endpoint**: NONE
- **DB persistence**: `localStorage`
- **Classification**: **STUB** (client-side only, no backend settings model used)
- **Root cause**: `SettingsCenter.jsx:115-120`

### Element: Theme mode chips (Chiaro/Scuro)
- **Frontend handler**: `SettingsCenter.jsx:128-134` — calls `onThemeChange`
- **API call**: None
- **Backend endpoint**: NONE
- **DB persistence**: `localStorage` + prop callback
- **Classification**: **STUB** (UI-only, no persistence to backend)
- **Root cause**: `SettingsCenter.jsx:123-135`

### Element: "Contesto attivo" chips display
- **Frontend handler**: `SettingsCenter.jsx:141-143`
- **API call**: None
- **Classification**: **STUB** (read-only display of localStorage values)
- **Root cause**: `SettingsCenter.jsx:138-145`

---

## 3. BILLING — `BillingCenter.jsx`

### Element: "Registra documento" button
- **Frontend handler**: `BillingCenter.jsx:76-105` — `createDoc()` calls `apiSend('POST', '/api/billing/documents', payload)`
- **API call**: `POST /api/billing/documents`
- **Backend endpoint**: **NONE EXISTS** — no `BillingController` in `MedWork.Api/Controllers/`
- **DB persistence**: Falls back to `localStorage` after failed API call (`BillingCenter.jsx:84-91`)
- **TenantId isolation**: NONE (no backend)
- **Classification**: **BROKEN** (endpoint does not exist; data stored in localStorage)
- **Root cause**: `BillingCenter.jsx:81` — endpoint `/api/billing/documents` has no controller; `BillingCenter.jsx:24-33` — localStorage fallback

### Element: Status chips (bozza/emesso/pagato/scaduto)
- **Frontend handler**: `BillingCenter.jsx:107-112` — `updateStatus(id, status)` updates localStorage only
- **API call**: None
- **Backend endpoint**: NONE
- **DB persistence**: `localStorage`
- **Classification**: **STUB**
- **Root cause**: `BillingCenter.jsx:107-112`

### Element: Totals cards (Totale/Incassato/Scaduto)
- **Frontend handler**: `BillingCenter.jsx:63-74` — `useMemo` over `docs` array
- **API call**: None
- **Backend endpoint**: NONE
- **Classification**: **STUB** (computed from localStorage data)
- **Root cause**: `BillingCenter.jsx:63-74`

---

## 4. BATCH SIGNATURE — `BatchSignatureCenter.jsx`

### Element: Load unsigned visits on mount
- **Frontend handler**: `BatchSignatureCenter.jsx:33-45` — `loadVisits()` calls `apiGet('/api/doctor-data/unsigned-visits')`
- **API call**: `GET /api/doctor-data/unsigned-visits`
- **Backend endpoint**: `DoctorCrudController.GetUnsignedVisits()` — `DoctorCrudController.cs:919-937`
- **DB persistence**: Queries `MedicalVisits` where `TenantId == tenantId && !IsSigned`
- **TenantId isolation**: **PARTIAL** — queries by tenant, but `GetTenantId()` falls back to `1` on failure (`DoctorCrudController.cs:961-965`)
- **Classification**: **PARTIALLY WORKING**
- **Root cause**: `DoctorCrudController.cs:964` — `return int.TryParse(claim, out var id) && id > 0 ? id : 1;`

### Element: "Firma N Selezionati" button
- **Frontend handler**: `BatchSignatureCenter.jsx:69-85` — `handleBatchSign()` calls `apiSend('/api/doctor-data/batch-sign', 'POST', { visitIds })`
- **API call**: `POST /api/doctor-data/batch-sign`
- **Backend endpoint**: `DoctorCrudController.BatchSignVisits()` — `DoctorCrudController.cs:939-958`
- **DB persistence**: Sets `IsSigned = true`, `SignedAt = DateTime.UtcNow`, `DigitalCertificateThumbprint = "SIMULATED-THUMBPRINT-0001"` on matched visits
- **TenantId isolation**: **PARTIAL** — filters by `TenantId == tenantId` but fallback to 1
- **Classification**: **PARTIALLY WORKING** (real DB update, but simulated certificate, fallback tenant risk)
- **Root cause**: `DoctorCrudController.cs:953` — hardcoded `"SIMULATED-THUMBPRINT-0001"`; `DoctorCrudController.cs:964` — fallback to 1

---

## 5. GRAFOMETRIC SIGNATURE — `FirmaGrafometricaCenter.jsx`

### Element: "Verifica firma" button
- **Frontend handler**: `FirmaGrafometricaCenter.jsx:22-38` — `verify()` calls `apiSend('POST', '/api/signatures/verify', { contentHash, signatureBase64, publicKeyBase64 })`
- **API call**: `POST /api/signatures/verify`
- **Backend endpoint**: `SignatureController.Verify()` — `SignatureController.cs:23-39`
- **DB persistence**: None (stateless verification)
- **TenantId isolation**: N/A (no DB access; `[Authorize(Roles = "Doctor,Admin")]` present)
- **Classification**: **WORKING** (real cryptographic verification via `ISignatureService`)
- **Root cause**: N/A

### Element: "Carica hash di esempio" button
- **Frontend handler**: `FirmaGrafometricaCenter.jsx:40-47` — `loadSampleHash()` calls `apiSend('GET', '/api/signatures/hash-sample')`
- **API call**: `GET /api/signatures/hash-sample`
- **Backend endpoint**: `SignatureController.HashSample()` — `SignatureController.cs:41-47`
- **Classification**: **WORKING**
- **Root cause**: N/A

---

## 6. ANALYTICS — `AnalyticsCenter.jsx` + `EnterpriseAnalyticsDashboard.jsx`

### Element: "Calcola probabilità" (No-Show)
- **Frontend handler**: `AnalyticsCenter.jsx:25-33` — `runNoShow()` calls `apiSend('POST', '/api/analytics/no-show', features)`
- **API call**: `POST /api/analytics/no-show`
- **Backend endpoint**: `AnalyticsController.PredictNoShow()` — `AnalyticsController.cs:41-46`
- **DB persistence**: None (pure domain service `INoShowPredictionService`)
- **TenantId isolation**: N/A (no DB; requires Admin/Doctor role)
- **Classification**: **WORKING** (real algorithm, deterministic scorer)
- **Root cause**: N/A

### Element: "Ottimizza per azienda" (Route optimization)
- **Frontend handler**: `AnalyticsCenter.jsx:35-44` — `runRoutes()` calls `apiSend('POST', '/api/analytics/optimize-routes', stops)`
- **API call**: `POST /api/analytics/optimize-routes`
- **Backend endpoint**: `AnalyticsController.OptimizeRoutes()` — `AnalyticsController.cs:48-53`
- **DB persistence**: None (pure domain service `ISlotOptimizationService`)
- **TenantId isolation**: N/A
- **Classification**: **WORKING** (real greedy nearest-neighbor + Haversine)
- **Root cause**: N/A

### Element: Enterprise Analytics dialog (open by `companyId`)
- **Frontend handler**: `EnterpriseAnalyticsDashboard.jsx:67-84` — `useEffect` calls `apiGet('/api/doctor-data/companies/${companyId}/analytics')`
- **API call**: `GET /api/doctor-data/companies/{companyId}/analytics`
- **Backend endpoint**: `DoctorCrudController.GetEnterpriseAnalytics()` — `DoctorCrudController.cs:796-836`
- **DB persistence**: Queries `MedicalVisits` and `Employees` filtered by `TenantId == tenantId && CompanyId == companyId`
- **TenantId isolation**: **PARTIAL** — uses `GetTenantId()` which falls back to 1 (`DoctorCrudController.cs:964`)
- **Classification**: **PARTIALLY WORKING** (real DB queries, real aggregations, but cross-tenant fallback risk)
- **Root cause**: `DoctorCrudController.cs:964` — fallback to 1

---

## 7. NOTIFICATIONS — `AlertMulticanaleCenter.jsx`

### Element: "Invia alert" button
- **Frontend handler**: `AlertMulticanaleCenter.jsx:31-57` — `send()` calls `apiSend('POST', '/api/alerts/send-bulk', { recipients, channel, message })`
- **API call**: `POST /api/alerts/send-bulk`
- **Backend endpoint**: `AlertsController.SendBulk()` — `AlertsController.cs:24-46`
- **DB persistence**: `AlertMultiChannelService.SendBulkAsync()` → creates `NotificationLog` with `TenantId` from claim — `AlertMultiChannelService.cs:47-79`
- **TenantId isolation**: **GOOD** — `GetCurrentTenantId()` extracts from `HttpContext.User` claims; throws if `<= 0` (`AlertMultiChannelService.cs:37-53`)
- **Classification**: **PARTIALLY WORKING** (real DB logging, real multi-channel dispatch interface, but **only ConsoleNotificationTransport is registered**)
- **Root cause**: `MedWork.Api/Program.cs:89` — `builder.Services.AddScoped<INotificationTransport, ConsoleNotificationTransport>();` — only console output, no real email/SMS/PEC/Push

### Element: Channel selection (SMS/Email/PEC/Push/WhatsApp)
- **Frontend handler**: `AlertMulticanaleCenter.jsx:73-81`
- **API call**: POST to `/api/alerts/send-bulk`
- **Backend dispatch**: `ConsoleNotificationTransport.DeliverAsync()` — `AlertMultiChannelService.cs:97-104` — only writes to `Console.WriteLine`
- **Classification**: **BROKEN** (all channels go to server console; no real transport)
- **Root cause**: `MedWork.Api/Program.cs:89` — only `ConsoleNotificationTransport` registered

### Element: Results display (consegnato/NON consegnato)
- **Frontend handler**: `AlertMulticanaleCenter.jsx:95-103`
- **API call**: N/A (displays response from send)
- **Classification**: **PARTIALLY WORKING** (shows delivery status from DB, but status is always `true` because ConsoleTransport returns `true`)
- **Root cause**: `AlertMultiChannelService.cs:103` — `ConsoleNotificationTransport` always returns `Task.FromResult(true)`

---

## 8. CROSS-CUTTING: TenantId FALLBACK TO 1

The following controllers have `GetTenantId()` methods that **fallback to `1`** instead of returning 401/Unauthorized when the TenantId claim is missing or invalid:

| Controller | File:Line | Fallback |
|---|---|---|
| `AdminCrudController` | `AdminCrudController.cs:708-712` | `return int.TryParse(tenantClaim, out var tenantId) ? tenantId : 0;` — returns 0, but `TenantContextFilter` should catch this first |
| `MasterDataController` | `MasterDataController.cs:622-626` | `return int.TryParse(claim, out var id) && id > 0 ? id : 1;` — **falls back to 1** |
| `DoctorCrudController` | `DoctorCrudController.cs:961-965` | `return int.TryParse(claim, out var id) && id > 0 ? id : 1;` — **falls back to 1** |

Additionally, `MasterDataController.GetCompanies()` and `GetBranches()` **do not filter by TenantId at all** — they return ALL records across all tenants:
- `MasterDataController.cs:25-38` — no `Where(x => x.TenantId == tenantId)`
- `MasterDataController.cs:43-64` — no `Where(x => x.TenantId == tenantId)`

**TenantContextFilter** (`TenantContextFilter.cs:29-33`) correctly returns `UnauthorizedResult()` when TenantId claim is missing, but controllers that call `GetTenantId()` independently (not relying on the filter's model binding injection) can still hit the fallback.

---

## 9. CROSS-CUTTING: MockNotificationService STILL IN DI

- `MedWork.Api/Program.cs:87` — `builder.Services.AddScoped<INotificationService, MockNotificationService>();`
- `MockNotificationService` (`MockNotificationService.cs:6-46`) implements `INotificationService` (used by `DoctorCrudController` for convocations)
- It is still registered alongside `IAlertService` / `AlertMultiChannelService`
- **Impact**: `DoctorCrudController.ConvocateEmployee()` (`DoctorCrudController.cs:364-376`) calls `_notificationService.SendConvocationAsync(tenantId, ...)` which uses `MockNotificationService` — this **does** write a `NotificationLog` to DB with correct TenantId, but it is a separate, older code path. The newer `AlertMultiChannelService` is what `AlertsController` uses.

---

## 10. RBAC / ROLES

- `AppRole.cs` — defines `Admin`, `Doctor`, `Patient`
- Controllers use `[Authorize(Roles = "...")]` consistently
- `TenantContextFilter` runs at `int.MinValue` order — highest precedence
- RBAC model is functional; no dedicated UI for user/role management exists in frontend scope (noted in docs)

---

## PRIORITIZED FIX LIST

### (A) Clear bugs to fix now

| # | Page | Action | Classification | Root Cause File:Line | Recommended Fix |
|---|---|---|---|---|---|
| 1 | AuditCenter | All audit events stored in localStorage, user-resettable | BROKEN | `medwork-frontend/src/utils/auditTrail.js:1,13,26` + `AuditCenter.jsx:25,38,40-43` | Create `AuditController` with `POST /api/audit/events`; replace `localStorage` with server-side writes scoped to TenantId |
| 2 | MasterDataController | `GetCompanies()` / `GetBranches()` return ALL tenants' data | WRONG BEHAVIOR | `MasterDataController.cs:25-38,43-64` | Add `.Where(x => x.TenantId == tenantId)` to both queries; add `GetTenantId()` call |
| 3 | MasterDataController | `GetTenantId()` falls back to 1 | WRONG BEHAVIOR | `MasterDataController.cs:624-626` | Change fallback from `1` to throw `UnauthorizedAccessException` (like `IntegrationController.cs:36-40`) |
| 4 | DoctorCrudController | `GetTenantId()` falls back to 1 | WRONG BEHAVIOR | `DoctorCrudController.cs:963-965` | Same as #3 |
| 5 | BillingCenter | `POST /api/billing/documents` has no backend controller | BROKEN | `BillingCenter.jsx:81` + no `BillingController.cs` | Either create `BillingController` with DB persistence, or remove the billing UI stub until backend exists |
| 6 | AlertMulticanaleCenter | Only `ConsoleNotificationTransport` registered; no real email/SMS/PEC/Push | BROKEN | `MedWork.Api/Program.cs:89` + `AlertMultiChannelService.cs:97-104` | Register real transports (e.g., `EmailNotificationTransport` with SendGrid/SMTP) in DI; keep ConsoleTransport for dev only |
| 7 | AlertsController + AlertMultiChannelService | `ConsoleNotificationTransport` always returns `true` (delivered) | WRONG BEHAVIOR | `AlertMultiChannelService.cs:103` | Real transports must return actual delivery status; remove `Task.FromResult(true)` stub |
| 8 | BatchSignatureCenter / DoctorCrudController | `GetTenantId()` fallback to 1 allows cross-tenant signing | WRONG BEHAVIOR | `DoctorCrudController.cs:964` | Same as #3/#4 |
| 9 | EnterpriseAnalyticsDashboard | Uses `DoctorCrudController.GetEnterpriseAnalytics()` which has fallback-to-1 | PARTIALLY WORKING | `DoctorCrudController.cs:964` | Same as #3/#4 |
| 10 | SettingsCenter | Settings stored in localStorage, not server-side; no TenantId on master-data reads | PARTIALLY WORKING | `SettingsCenter.jsx:10,26,35` + `MasterDataController.cs:25-64` | Move settings to `TenantSettings` table; filter master-data by TenantId |

### (B) Larger feature / refactor

| # | Page | Action | Classification | Root Cause File:Line | Recommended Fix |
|---|---|---|---|---|---|
| 11 | AuditCenter | No server-side audit trail endpoint exists | MISSING IMPLEMENTATION | No `AuditController.cs` | Implement `AuditController` with `GET /api/audit/events` (server DB), tenant-scoped, append-only |
| 12 | Notifications | `MockNotificationService` still in DI (legacy path) | STUB | `MedWork.Api/Program.cs:87` | Remove `MockNotificationService` registration; consolidate all notification dispatch through `AlertMultiChannelService` |
| 13 | AnalyticsCenter | No-show and route optimization are pure functions (no DB) — acceptable for FASE 4 but will need real visit data for production | STUB (by design) | `AnalyticsController.cs:41-53` | Acceptable for now; document that these are stateless heuristics |
| 14 | FirmaGrafometricaCenter | Verification is real but certificate thumbprint in batch sign is simulated | PARTIALLY WORKING | `DoctorCrudController.cs:953` | Integrate real digital certificate provider or HSM; replace `"SIMULATED-THUMBPRINT-0001"` |
| 15 | SettingsCenter | No UI for user/role management (RBAC exists in backend) | MISSING IMPLEMENTATION | `SettingsCenter.jsx` scope | Build Admin > Users/Roles UI or link to existing backend RBAC (`AdminCrudController` has partial CRUD for companies/branches/employees but not users/roles) |
