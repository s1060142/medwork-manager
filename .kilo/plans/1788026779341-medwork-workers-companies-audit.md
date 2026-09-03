# MedWork Audit — Workers & Companies (SCREEN 3 + SCREEN 4)

**Auditor:** Architect (kilo)
**Date:** 2026-08-29
**Scope:** WorkersCenter, EmployeeProfileDialog, PatientAnamnesisForm, CompanyProfileDialog, HrImportExportDialog + matching backend.
**Sources:** `docs/product_bible.md`, `docs/ux_physician_analysis.md`, frontend `src/components/*`, backend `MedWork.Api/{Controllers,Data,Models,Integrations}/*`.

Classification key: **WORKING** | **PARTIALLY WORKING** | **BROKEN** | **STUB** | **MISSING IMPLEMENTATION** | **WRONG BEHAVIOR**.

---

## 1. Objective

Trace every user-facing action on the Workers list, Worker profile, Company profile, HR import/export, and Patient anamnesis screens end-to-end (UI handler → API call → backend endpoint → DB persistence → tenant isolation). Confirm or refute the specific allegations in the product bible (C4 localStorage protocols, C11 pagination, C13 worker archived localStorage) and identify root causes with file:line.

---

## 2. Analysis

### 2.1 WorkersCenter.jsx — Workers list + company sub-table

**Data load (mount):**
- Handler: `loadData` — `WorkersCenter.jsx:89-112`
- API: 5 parallel GETs: `/api/master-data/employees`, `/api/master-data/medical-visits`, `/api/master-data/companies`, `/api/master-data/branches`, `/api/master-data/job-roles`.
- Backend: `MasterDataController.GetEmployees` (`MasterDataController.cs:66-98`), `GetCompanies` (`:21-41`), etc.
- **BROKEN — Tenant isolation missing.** `MasterDataController.GetEmployees` does NOT filter by `TenantId` (returns ALL employees across tenants). Same for `GetCompanies` (`:25-40`), `GetBranches` (`:45-64`), `GetDoctors` (`:104-120`), `GetRiskFactors` (`:145-160`), `GetMedicalVisits` (`:228-249`). Only `GetCompanies` in `AdminCrudController` filters by tenant (`AdminCrudController.cs:30-32`). Cross-tenant data leak on every master-data list endpoint.
- **BROKEN — No pagination.** `GetEmployees` calls `.ToListAsync()` with no `.Skip()/.Take()` (`MasterDataController.cs:95`). Loads ALL rows. Frontend pagination controls are fake — `value={50}` with `onChange={() => {}}` (`WorkersCenter.jsx:642-645`); counter shows `1 - N of N` where N = total loaded. **Confirms C11.**
- DB: EF Core → `Employees` table. TenantId column exists on entity (`Employee.cs:13`) but is not used in query.

**Worker search/filter:**
- Handler: `handleFilterEmployees` — `WorkersCenter.jsx:135-149`
- API: GET `/api/master-data/employees?search=&status=&companyId=`
- Backend: `MasterDataController.GetEmployees` ignores all query params (no `[FromQuery]`). Returns full unfiltered list regardless.
- **WRONG BEHAVIOR** — frontend sends filters, backend ignores them; filtering is effectively client-side only (the `filteredWorkerRows` memo at `:256-285` does client-side filtering on the already-loaded full set). With 1000+ rows this is the "browser dies" scenario described in SCREEN 4.

**Fitness/classification:**
- Function: `classifyFitness(outcome)` — `WorkersCenter.jsx:43-52`. Uses `text.includes('non idone')`, `text.includes('prescr') || text.includes('parzial') || text.includes('limit')`, `text.includes('idone')` on the free-text `outcome` field of the latest visit.
- **WRONG BEHAVIOR — Confirms SCREEN 4 allegation.** String-matching free text is fragile (falsely classifies "non idoneo temporaneo" vs "idoneo con prescrizioni"). No structured `OutcomeCode` consumed here. The `MedicalVisit` model HAS an `OutcomeCode` property (`MedicalVisit.cs:34`) but it is never read by this function.

**Archive/unarchive worker:**
- Handler: `handleToggleArchive` — `WorkersCenter.jsx:151-160`
- API: **None.** Purely `localStorage`.
- Storage key: `'medwork.archivedEmployees'` — `WorkersCenter.jsx:27`. Loaded via `loadArchived` (`:54-61`), saved via `saveArchived` (`:63-65`).
- **BROKEN — Confirms C13.** Archived state is an array of employee IDs in localStorage, NOT in the DB. Changing browser/device loses it. The `Employee` model has no `IsArchived`/`Archived` column at all (`Employee.cs:5-135`). Note: there is a *separate* `toggleArchived` function (`:301-339`) that DOES call `PUT /api/admin-data/employees/{id}` with `{ statoRisorsa }`, but `Employee` has no `statoRisorsa` column and `AdminCrudController.UpdateEmployee` (`:232-253`) does not map it — so even that path is a no-op on the DB. The actual UI button (`:606`) calls `handleToggleArchive` (localStorage only).

**Delete worker:**
- Handler: `handleDeleteEmployee` — `WorkersCenter.jsx:162-174`
- API: `DELETE /api/admin-data/employees/{id}`
- Backend: `AdminCrudController.DeleteEmployee` (`:255-265`) — exists, filters by tenant (`:258-259`).
- DB: hard delete. **WORKING** (tenant-safe).

**Company archive (sub-table):**
- Handler: inline arrow — `WorkersCenter.jsx:455-473`
- API: `PATCH /api/admin-data/companies/{id}` with `{ status }`
- Backend: **MISSING IMPLEMENTATION.** `AdminCrudController` has NO `PATCH` endpoint for companies. Only `PUT /api/admin-data/companies/{id}` (`:66-95`) which maps only `Name`, `VATNumber`, `ContactEmail`, `ContactPhone` — it does NOT map a `status` field. `Company` model has no `Status` string column (`Company.cs:5-86`); it has `IsActive bool` (`:71`). So PATCH → 405/404, and even PUT ignores status. **BROKEN.**

**Open worker profile:**
- Handler: `onOpenEmployeeProfile(row)` — `WorkersCenter.jsx:571-573` (double-click) and `:592`, `:599` (icon buttons).
- No API — opens `EmployeeProfileDialog` modal. **WORKING** (routing).

**New visit from profile:** see 2.2.

**Other buttons:**
- "Aggiungi" / "+ Nuovo lavoratore" → `onOpenEmployeeCreate` (`:353`, `:492`) — opens CrudEntityView create form. **WORKING**.
- "Ricerca lavoratori" → `onOpenEmployeeCreate` (`:395`) — same as add. **WRONG BEHAVIOR** (label says search, opens create).
- "Stampe massive" / "Operazioni massive" → `window.alert(...)` (`:494-495`) — **STUB**.
- "Esporta dati in excel" → `handleExportCompanies` (`:176-199`) — client-side CSV download of company rows. **WORKING** (but only companies, not workers).
- "Importa lavoratori" → `window.alert(...)` (`:497`) — **STUB**.
- "Stampa" → `window.print()` (`:493`). **WORKING**.
- Province/Comune/Ruolo/Luogo di lavoro filter fields: `value="" onChange={() => {}}` (`:369-379`, `:318-320`) — **STUB** (non-functional filters).

---

### 2.2 EmployeeProfileDialog.jsx — Worker profile

**Data load:**
- Handler: `load` — `EmployeeProfileDialog.jsx:128-158`
- API: GET `/api/master-data/medical-visits`, `/api/master-data/visit-exams`, `/api/master-data/employee-risks`, `/api/master-data/risk-factors`.
- Backend: `MasterDataController` — all exist but **not tenant-filtered** (see 2.1).
- Visits/exams/risks filtered client-side by `employee.id` (`:139-151`).

**Tabs present:** "Scheda lavoratore" (form), "Elenco attività" (visits list) — `EmployeeProfileDialog.jsx:262-265`.
- **MISSING IMPLEMENTATION** — product bible SCREEN 4 expects tabs: Anagrafica, Sorveglianza, Fattori di rischio, Cartella sanitaria. Only 2 generic tabs exist. No Risk Factors tab, no Medical Record (Cartella Sanitaria) tab despite `employeeRisks`/`riskFactors` being loaded (`:140-141`).

**Save worker:**
- Handler: `handleSave` — `EmployeeProfileDialog.jsx:209-228`
- API: `PUT /api/admin-data/employees` (no id in path!) with full form payload.
- Backend: `AdminCrudController.UpdateEmployee` is `PUT /api/admin-data/employees/{id}` (`:232`). The frontend omits `{id}` → route mismatch → **BROKEN** (404/405). Even if id were included, the endpoint only maps a subset of fields (`:239-251`): CompanyId, BranchId, FirstName, LastName, TaxCode, JobRole, BirthDate, Gender, BirthCity, BirthCityCode, PersonalEmail, PhoneNumber. Fields like `gruppoSanguigno`, `medicoCarante`, `statoRisorsa`, `periodicita`, `dataUltimaVisita`, `dataProssimaVisita`, `noteRiservate`, `notePerAzienda`, `categoriaProtetta`, `documentiPrivacy` are NOT mapped and have NO corresponding columns on the `Employee` model → silently dropped.
- **BROKEN** — save does not persist most form fields.

**Nuova visita / Controllo periodico (from profile):**
- Handlers: `EmployeeProfileDialog.jsx:428-453` — both buttons call `onOpenMedicalVisitCreate()` (no employee argument passed).
- Wiring in `App.tsx:1058-1061`: `onOpenMedicalVisitCreate` sets `selectedModuleKey('medical-visit-stepper')` and closes the dialog. It does NOT pass the employeeId.
- `MedicalVisitStepper` (`MedicalVisitStepper.jsx:60`) accepts only `onCreated` prop — no `initialEmployeeId` prop exists. `formData.employeeId` starts empty (`:37`).
- **BROKEN** — "New visit" from profile does NOT preselect the worker. Confirms SCREEN 4 allegation. The stepper opens with an empty employee dropdown.

**Risk factors display:**
- `risksWithSeverity` memo (`:179-191`) maps `employeeRisks` + `riskFactors`. Data is loaded but only rendered in the header-free form area; there is no dedicated Risk Factors tab/section with add capability. "Aggiungi fattore di rischio" inline — **MISSING IMPLEMENTATION** (no UI control to add).

---

### 2.3 PatientAnamnesisForm.jsx — Patient portal anamnesis

- Route: `/patient-portal?token=...` — rendered by `App.tsx:933-942`.
- Load handler: `loadAnamnesis` — `PatientAnamnesisForm.jsx:41-72`
  - API: GET `/api/patient-portal/anamnesis` with Bearer token.
  - Backend: `PatientPortalController.GetAnamnesis` (`PatientPortalController.cs:42-76`) — exists, tenant+employee isolated via claims (`:45-46`). Returns upcoming visit anamnesis.
  - **WORKING** (tenant-safe, scoped to employee via token claim).
- Submit handler: `handleSubmit` — `PatientAnamnesisForm.jsx:79-106`
  - API: POST `/api/patient-portal/anamnesis` with `{ visitId, ...formData }`.
  - Backend: `PatientPortalController.SaveAnamnesis` (`:78-109`) — exists, verifies visit belongs to employee+tenant (`:85-89`), upserts anamnesis.
  - **WORKING** (tenant-safe).
- **WRONG BEHAVIOR:** Hardcoded `API_BASE = 'http://localhost:5030'` (`PatientAnamnesisForm.jsx:15`) instead of using the configured `VITE_API_BASE_URL`. Will fail if backend runs on another port. Also uses raw `fetch` instead of shared `apiClient` (no error handling parity).
- Model note: `Anamnesis` has `LifestyleHabits` and `OccupationalExposures` columns (`Anamnesis.cs:31-34`) but the frontend form does NOT include these fields (only family/personal/remote/recent pathology + work history) — partial coverage.

---

### 2.4 CompanyProfileDialog.jsx — Company profile

**Tabs present:** "Dati anagrafici", "Dati fatturazione", "Assegnazione medici", "Figure aziendali" — `CompanyProfileDialog.jsx:46-51`.
- **MISSING IMPLEMENTATION** — product bible SCREEN 3 requires tabs: Protocolli attivi, DVR/upload, Statistiche sanitarie (compliance rate). None of these exist. Confirms SCREEN 3 allegations: "I protocolli NON sono visibili nel profilo azienda", "Non c'è link al DVR", "Non c'è vista tasso di compliance".

**Data load:**
- Handler: `load` — `CompanyProfileDialog.jsx:138-160`
- API: GET `/api/master-data/company-contacts?companyId=`, `/api/master-data/doctors`, `/api/master-data/company-doctors?companyId=`.
- Backend: all exist (`MasterDataController.cs:122-139`, `:100-120`, `:477-498`). Doctors/company-contacts endpoints are **not tenant-filtered**.

**Save company:**
- Handler: `handleSave` — `CompanyProfileDialog.jsx:179-201`
- API: `PUT /api/admin-data/companies/{id}` with full form payload; then `PUT /api/admin-data/company-doctors` with assignment.
- Backend: `AdminCrudController.UpdateCompany` (`:66-95`) — exists, tenant-filtered (`:71`). BUT maps ONLY `Name`, `VATNumber`, `ContactEmail`, `ContactPhone` (`:75-87`). All other ~40 fields (ATECO, addresses, SDI codiceDestinatario, CUP, CIG, IBAN, PEC, etc.) are **not mapped** → silently dropped. `Company` model also lacks many of these columns (`Company.cs:5-86` has only Name, VATNumber, ContactEmail, ContactPhone, PEC, addresses, ATECOCode, etc. — no codiceDestinatario/CUP/CIG/IBAN fields).
- `UpdateCompanyDoctors` (`:104-142`) — **WORKING**, tenant-safe.
- **PARTIALLY WORKING** — core identity + doctors save; billing/contract fields do not persist.

**Dialog-only actions (Allegato 3B / Analytics / Piano Sanitario):**
- Buttons open sub-dialogs: `Allegato3BPreview`, `EnterpriseAnalyticsDashboard`, `HealthPlanPreview` (`:226-234`, wired `:501-517`). These are preview/analytics components, not backend-persisted DVR/protocols. **PARTIALLY WORKING** (UI exists; not the DVR/protocols the spec requires).

---

### 2.5 HrImportExportDialog.tsx — HR import/export

**Import CSV:**
- Handler: `handleImport` — `HrImportExportDialog.tsx:27-49`
- API: `hrImportCsv(file, fileName)` → `POST /api/integrations/import-employee` (multipart) — `apiClient.ts:39-58`.
- Backend: `IntegrationController.ImportEmployee` (`IntegrationController.cs:43-52`) → calls `_hrImportExport.ImportCsv(file, fileName)`.
- Service: `HrImportExportService.ImportCsv` (`HrImportExportService.cs:57-96`) — parses CSV, maps rows, `Adds` employees, `SaveChanges`. **BUT** tenant isolation is **BROKEN on import**: `GetCompanyId` (`:44-51`) picks the first company for the tenant, and `MapToEmployee` (`:203-300`) sets `TenantId` correctly (`:278`), so imported rows ARE tenant-scoped. However, `ImportCsv` is also defined as a CONTROLLER endpoint (`HrImportExportService.cs:57`, route `api/integrations/hr`) AND called as a service — dual registration. The `IntegrationController` wraps the service's `IActionResult` return in another `Ok(...)` (`:50-51`), causing a **double-wrapping bug** (returns `Ok(OkObjectResult)`). Import likely works at DB layer but the HTTP response is malformed.
- **PARTIALLY WORKING** — DB import functions; response shape broken; no validation feedback mapping to UI (UI just shows "Importazione completata!").

**Export CSV:**
- Handler: `handleExportCsv` — `HrImportExportDialog.tsx:51-74`
- API: `hrExportCsv()` → `GET /api/integrations/export-employee-csv` — `apiClient.ts:26-37`.
- Backend: `IntegrationController.ExportEmployeeCsv` (`IntegrationController.cs:54-80`) — tenant-filtered (`:60-61`), builds CSV, returns file.
- **WORKING** (tenant-safe). Note: filters by `IsActive` only — no archived concept (archived is localStorage-only anyway).

**Export Excel:**
- Handler: `handleExportExcel` — `HrImportExportDialog.tsx:76-99`
- API: `hrExportExcel()` → `GET /api/integrations/export-employee-excel` — `apiClient.ts:60-71`.
- Backend: `IntegrationController.ExportEmployeeExcel` (`:82-98`) — tenant-filtered, uses EPPlus `GenerateXlsx` (`:100-128`).
- **WORKING** (tenant-safe). Uses EPPlus (commercial license concern — C14).

**Verdict:** Real backend, not a stub. **PARTIALLY WORKING** overall (import response broken; exports working).

---

## 3. Impacted Files

Frontend:
- `medwork-frontend/src/components/WorkersCenter.jsx`
- `medwork-frontend/src/components/EmployeeProfileDialog.jsx`
- `medwork-frontend/src/components/PatientAnamnesisForm.jsx`
- `medwork-frontend/src/components/CompanyProfileDialog.jsx`
- `medwork-frontend/src/components/HrImportExportDialog.tsx`
- `medwork-frontend/src/components/MedicalVisitStepper.jsx` (no initialEmployeeId prop)
- `medwork-frontend/src/App.tsx` (dialog wiring `:1050-1078`, navigation)
- `medwork-frontend/src/services/apiClient.ts` (import/export URL mismatch — see Risks)

Backend:
- `MedWork.Api/Controllers/MasterDataController.cs` (no tenant filter, no pagination)
- `MedWork.Api/Controllers/AdminCrudController.cs` (company/employee update maps few fields; no company PATCH; no employee statoRisorsa)
- `MedWork.Api/Controllers/IntegrationController.cs` (double-wrap import)
- `MedWork.Api/Integrations/HrImportExportService.cs` (dual controller/service role)
- `MedWork.Api/Controllers/PatientPortalController.cs`
- `MedWork.Api/Data/AppDbContext.cs` (model config)
- `MedWork.Api/Models/Employee.cs` (no archived/statoRisorso/gruppoSanguigno/medicoCarante columns)
- `MedWork.Api/Models/Company.cs` (no Status string / codiceDestinatario/CUP/CIG/IBAN columns)

Docs: `docs/product_bible.md`, `docs/ux_physician_analysis.md`.

---

## 4. Implementation Strategy

The dominant failure mode is **client-side-only state pretending to be server state** (archived workers, fake pagination, ignored filters) combined with **endpoints that don't map the fields the UI sends**. The fix strategy is:

1. Move all "is this mine / is this archived / does this match the filter" decisions to the server via tenant-filtered, paginated, parameterized queries.
2. Add the missing DB columns (or a dedicated `EmployeeStatus`/`Archived` flag) and map them in the admin update endpoints.
3. Make the visit stepper accept an `initialEmployeeId` and wire it from the profile dialog.
4. Add the missing company tabs (protocols, DVR, statistics) as real data-backed panels.
5. Fix the HR import response shape and the hardcoded patient-portal API base.

---

## 5. Risks

- **Cross-tenant data leak (SEVERITY: HIGH).** `MasterDataController` list endpoints return all tenants' employees/companies/doctors/visits. This is the highest-risk item in scope. `C3` (TenantId fallback) is also relevant: `MasterDataController.GetTenantId` falls back to `1` (`:625`) instead of 401.
- **Data loss on worker save.** `PUT /api/admin-data/employees` (no id) 404s; even with id, ~20 fields are unmapped. A physician editing a profile and clicking Save believes it persisted — it did not.
- **EPPlus license (C14).** `IntegrationController` + `HrImportExportService` use EPPlus for XLSX. EPPlus 5+ is non-commercial (Polyform). Commercial use needs a license.
- **HR import URL mismatch.** `apiClient.ts:47` posts to `/api/integrations/import-employee` which maps to `IntegrationController.ImportEmployee` — this exists, so import resolves. But `HrImportExportService` is ALSO a controller at `api/integrations/hr/import-csv` — ambiguous dual registration; one is dead, the other double-wrapped.
- **localStorage archived state (C13).** Not shared across devices/browsers; not backed up; easily cleared. Unfit for production.
- **Patient portal hardcoded port** (`PatientAnamnesisForm.jsx:15`) breaks non-default deployments.

---

## 6. Validation Approach

- **Tenant isolation:** seed two tenants with overlapping employee/company IDs; assert each tenant's token only ever sees its own rows on every endpoint in scope (automated integration test).
- **Pagination:** assert `GetEmployees` with `page`/`pageSize` returns only that slice plus total count; assert payload size is bounded for 10k-row seed.
- **Archive persistence:** archive a worker, reload in a fresh browser context (no localStorage), assert still archived → proves DB persistence.
- **Save round-trip:** PUT an employee with all profile fields, GET it back, assert equality.
- **New-visit preselect:** open profile → "Nuova visita" → assert `MedicalVisitStepper` employee dropdown is preselected and disabled/chosen.
- **Company tabs:** assert Protocolli/DVR/Statistiche tabs render real data (protocol list, DVR upload control, compliance %).
- **HR import:** POST a CSV, assert returned count == created rows, assert rows are tenant-scoped, assert a clean JSON response (not double-wrapped).

---

## 7. Prioritized Fix List

### (A) Fix now — bugs / data integrity / security

| ID | Page | Action | Class | Root cause file:line | Recommended fix |
|---|---|---|---|---|---|
| A1 | Workers | Tenant isolation on all master-data lists | BROKEN (security) | `MasterDataController.cs:25-40` `:70-98` `:104-120` `:145-160` `:228-249` | Add `.Where(x => x.TenantId == tenantId)` to every GET; use `GetTenantId()` (throw 401 if missing, don't fallback to 1 — see `MasterDataController.cs:625`). |
| A2 | Workers | Archived worker must persist in DB, not localStorage | BROKEN | `WorkersCenter.jsx:27` `:54-65` `:151-160`; `Employee.cs` (no column) | Add `IsArchived bool` (or status enum) to `Employee` + migration; replace `loadArchived`/`saveArchived` with GET/PUT; map in `AdminCrudController.UpdateEmployee`. Remove localStorage key `medwork.archivedEmployees`. |
| A3 | Workers | Worker list must be paginated server-side | BROKEN | `MasterDataController.cs:95` (no Skip/Take); `WorkersCenter.jsx:642-645` (fake pager) | Add `page`/`pageSize` params + total count DTO; implement `Skip/Take`; drive frontend pager from total. Confirms C11. |
| A4 | Workers | Backend must honor search/status/companyId filters | WRONG BEHAVIOR | `MasterDataController.cs:66-98` (ignores query params) | Add `[FromQuery]` params, build IQueryable filter, return filtered page. |
| A5 | Worker profile | Save must hit the correct route and persist fields | BROKEN | `EmployeeProfileDialog.jsx:218` (`/api/admin-data/employees` missing id); `AdminCrudController.cs:232-253` (maps few fields) | Send `PUT /api/admin-data/employees/{id}`; map all persistable fields; add missing columns to `Employee` (gruppoSanguigno, medicoCarante, statoRisorsa, periodicita, noteRiservate, notePerAzienda, categoriaProtetta, documentiPrivacy). |
| A6 | Worker profile | "Nuova visita" must preselect the worker | BROKEN | `EmployeeProfileDialog.jsx:432-437` (no employee arg); `App.tsx:1058-1061` (doesn't pass id); `MedicalVisitStepper.jsx:60` (no initialEmployeeId prop) | Add `initialEmployeeId?: string` prop to `MedicalVisitStepper`, seed `formData.employeeId`; pass `employee.id` from dialog; wire `onOpenMedicalVisitCreate={(id) => { setProfileEmployee(null); setSelectedModuleKey('medical-visit-stepper'); setPreselectedEmployeeId(id) }}`. |
| A7 | Workers | Company archive PATCH has no endpoint + wrong field | BROKEN | `WorkersCenter.jsx:464` (PATCH, `{status}`); `AdminCrudController.cs` (no PATCH; PUT ignores status); `Company.cs:71` (IsActive bool, no Status) | Add `PATCH /api/admin-data/companies/{id}` or extend PUT to map `IsActive`/`Status`; use `IsActive` consistently. |
| A8 | Workers | Non-functional filter fields (Province/Comune/Ruolo/Luogo) | STUB | `WorkersCenter.jsx:369-379` `:318-320` | Wire to backend filters (A4) or remove. |
| A9 | HR import | Double-wrapped import response / dual controller registration | BROKEN | `IntegrationController.cs:50-51` (`Ok(IActionResult)`); `HrImportExportService.cs:24` (also a controller) | Make `HrImportExportService.ImportCsv` return a DTO (not `IActionResult`); remove `[ApiController]`/`[Route]` from the service or delete the redundant controller. Return clean JSON. |
| A10 | Patient portal | Hardcoded API base URL | WRONG BEHAVIOR | `PatientAnamnesisForm.jsx:15` | Use shared `API_BASE_URL` from `apiClient.ts` (`apiClient.ts:1`). |
| A11 | Workers | Fitness classification must use structured code, not regex on free text | WRONG BEHAVIOR | `WorkersCenter.jsx:43-52` (`classifyFitness`) | Read `MedicalVisit.OutcomeCode` (`MedicalVisit.cs:34`); map code → label/color. Keep free-text fallback only for legacy null codes. |

### (B) Larger features (spec compliance)

| ID | Page | Action | Class | Root cause file:line | Recommended fix |
|---|---|---|---|---|---|
| B1 | Worker profile | Add Sorveglianza / Fattori di rischio / Cartella sanitaria tabs with real data + "add risk" inline | MISSING IMPLEMENTATION | `EmployeeProfileDialog.jsx:262-265` (only 2 tabs); risks loaded at `:140` but not rendered as tab | Build 3 tabs: risk factors (render `risksWithSeverity`, add EmployeeRisk via `POST /api/admin-data/employee-risks`), medical record (load `/api/medical-records/employee/{id}`), surveillance timeline. |
| B2 | Company profile | Add Protocolli attivi tab (protocols assigned to company's job roles + compliance rate) | MISSING IMPLEMENTATION | `CompanyProfileDialog.jsx:46-51` (no protocols tab) | Query protocols by company's job roles; render with compliance %. |
| B3 | Company profile | Add DVR upload/link + Statistiche sanitarie tab | MISSING IMPLEMENTATION | `CompanyProfileDialog.jsx:46-51`; `Company.cs` (no DVR columns) | Add `DvrDocumentPath`/`DvrDate` to `Company`; file upload endpoint; statistics panel (visits/compliance/anomalies). |
| B4 | Workers | "New visit" quick-action from worker row (1-click) + contextual row actions | MISSING IMPLEMENTATION | `WorkersCenter.jsx` (no visit button per row) | Add "Avvia visita" per row → opens stepper preselected (A6). |
| B5 | HR | Import validation feedback + column mapping UI + duplicate handling | MISSING IMPLEMENTATION | `HrImportExportDialog.tsx` (no mapping UI); `HrImportExportService.cs:180-198` (naive CSV parse, `;`-only delimiter) | Return per-row errors to UI; support `,` and `;`; preview/dedupe by TaxCode. |
| B6 | HR | Replace EPPlus with a non-commercial XLSX library (or obtain license) | RISK (license) | `IntegrationController.cs:100-128`; `HrImportExportService.cs:147-175` | Migrate to ClosedXML / OpenXML SDK / NPOI. Addresses C14. |
| B7 | All | Global search/autocomplete for workers (Ctrl+K) | MISSING IMPLEMENTATION | `App.tsx:968-986` (Autocomplete with empty `options`) | Wire to `GET /api/master-data/employees/search?q=` (`MasterDataController.cs:571-601`, already exists + tenant-filtered). |

---

**Summary of confirmed product-bible allegations:**
- **C4 (protocolli localStorage):** NOT in this scope (protocols are in `ProtocolsCenter`, not these screens) — not re-verified here.
- **C11 (pag CONFIRMED — `MasterDataController.cs:95`, no pagination; frontend fake pager `WorkersCenter.jsx:642`.
- **C13 (worker archived localStorage):** CONFIRMED — key `medwork.archivedEmployees`, `WorkersCenter.jsx:27` `:54-65` `:151-160`; no DB column.
- **Fitness via regex on free text:** CONFIRMED — `WorkersCenter.jsx:43-52`.
- **"New visit" from profile does not preselect worker:** CONFIRMED — `EmployeeProfileDialog.jsx:432-437`, `App.tsx:1058-1061`, `MedicalVisitStepper.jsx:60`.
- **Company profile missing protocols/DVR/statistics tabs:** CONFIRMED — `CompanyProfileDialog.jsx:46-51`.
- **HR import/export is real backend (not stub):** CONFIRMED — but import response is double-wrapped (`IntegrationController.cs:50-51`).
- **Tenant isolation on these endpoints:** BROKEN on `MasterDataController` (the read path); WORKING on `AdminCrudController` (the write path).
