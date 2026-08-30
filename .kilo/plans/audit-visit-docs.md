# Audit Report — Medical Visit, Document & Report Flows
**Scope**: MedicalVisitStepper, CartellaSanitariaCenter, GiudizioIdoneitaCenter, Allegato3BCenter, ReportsCenter + backend Documents/Visits/Records/Judgments + product_bible SCREEN 6/7/9/10 + ux_physician_analysis TIER 0.
**Date**: 2026-08-29

---

## 1. Per-Element Findings

| # | Page / Element | Frontend Handler (file:line) | API Call | Backend Endpoint (file:line) | DB Persistence | TenantId Isolation | Classification | Root Cause (file:line) |
|---|---|---|---|---|---|---|---|---|
| 1 | MedicalVisitStepper — Salva Visita | `handleSave` (`MedicalVisitStepper.jsx:217`) | `POST /api/doctor-data/medical-visits` (`MedicalVisitStepper.jsx:227`) | `DoctorCrudController.CreateMedicalVisit` (`DoctorCrudController.cs:77`) | `_dbContext.MedicalVisits.Add(request)` — persists `MedicalVisit` row | **BROKEN**: endpoint never sets `TenantId` on `request`; frontend DTO omits `tenantId`; row saved with `TenantId = 0` | **BROKEN** | `DoctorCrudController.cs:126` — `Add(request)` without `request.TenantId = tenantId`; `MedicalVisitStepper.jsx:227` — payload missing `tenantId` |
| 2 | MedicalVisitStepper — Salva Anamnesi | `handleSave` (`MedicalVisitStepper.jsx:241`) | `POST /api/doctor-data/anamneses` (`MedicalVisitStepper.jsx:241`) | `DoctorCrudController.CreateAnamnesis` (`DoctorCrudController.cs:229`) | Adds `Anamnesis` linked to visit | **OK**: `request.TenantId = tenantId` (`DoctorCrudController.cs:239`) | **WORKING** | — |
| 3 | MedicalVisitStepper — Copia da ultima visita | `handleCopyLastVisit` (`MedicalVisitStepper.jsx:137`) | `GET /api/doctor-data/employees/{id}/last-visit` (`MedicalVisitStepper.jsx:142`) | `DoctorCrudController.GetLastVisit` (`DoctorCrudController.cs:598`) | Read-only (`MedicalVisits` + `Anamnesis`) | **OK**: `v.TenantId == tenantId` (`DoctorCrudController.cs:605`) | **WORKING** | — |
| 4 | MedicalVisitStepper — Preview scadenza (auto/manuale) | `useEffect` (`MedicalVisitStepper.jsx:116`) | `GET /api/doctor-data/deadline-preview` (`MedicalVisitStepper.jsx:119`) | `DoctorCrudController.GetDeadlinePreview` (`DoctorCrudController.cs:389`) | Read-only via `IDeadlineCalculationService` | **OK**: delegates to service with tenant-aware employee lookup | **PARTIALLY WORKING** | `DoctorCrudController.cs:400` — if `computed == null` frontend falls back to manual; backend also re-checks sentinel equality (`DoctorCrudController.cs:103`) so client-supplied manual dates bypass protocol |
| 5 | CartellaSanitariaCenter — Carica / Crea / Aggiorna | `useEffect` + `save` (`CartellaSanitariaCenter.jsx:32`, `:63`) | `GET /api/medical-records-v2/employee/{id}` (`CartellaSanitariaCenter.jsx:36`); `POST`/`PUT /api/medical-records-v2/...` (`CartellaSanitariaCenter.jsx:69-70`) | `MedicalRecordController.GetByEmployee` / `Upsert` / `Update` (`MedicalRecordController.cs:25`, `:33`, `:64`) | `MedicalRecords` table CRUD | **BROKEN on GET**: `GetByEmployee` queries only `x.EmployeeId == employeeId` — **no `TenantId` filter**; POST `Upsert` does not set `TenantId` before add; PUT `Update` does filter by `TenantId` | **BROKEN** | `MedicalRecordController.cs:28` — missing tenant filter; `MedicalRecordController.cs:47` — `request` added without `TenantId` |
| 6 | CartellaSanitariaCenter — Autosave on blur | `autosave` (`CartellaSanitariaCenter.jsx:58`) | `PATCH /api/medical-records-v2/{id}` (`CartellaSanitariaCenter.jsx:60`) | `MedicalRecordController.Autisave` (`MedicalRecordController.cs:93`) | Partial update on `MedicalRecords` | **OK**: `x.TenantId == GetTenantId()` (`MedicalRecordController.cs:96`) | **WORKING** | — |
| 7 | GiudizioIdoneitaCenter — Salva giudizio | `save` (`GiudizioIdoneitaCenter.jsx:59`) | `PUT /api/visit-judgments/{medicalVisitId}` (`GiudizioIdoneitaCenter.jsx:72`) | `VisitJudgmentController.SetJudgment` (`VisitJudgmentController.cs:32`) | Updates `MedicalVisits` columns (`OutcomeCode`, `Outcome`, `ClinicalNotes`, `ObjectiveExam`, `NextDeadlineDate`) — **no dedicated `FitnessJudgment` table** | **OK**: `x.TenantId == GetTenantId()` (`VisitJudgmentController.cs:38`) | **PARTIALLY WORKING** | `VisitJudgmentController.cs:41-45` — judgment data is inlined into `MedicalVisit`, losing structured judgment history |
| 8 | GiudizioIdoneitaCenter — Scarica PDF | `downloadPdf` (`GiudizioIdoneitaCenter.jsx:81`) | `GET /api/documents/visits/{id}/fitness-judgment-pdf` (`GiudizioIdoneitaCenter.jsx:86`) | `DocumentsController.DownloadFitnessJudgmentPdf` (`DocumentsController.cs:113`) | Read-only via `DocumentGenerationService.GenerateFitnessJudgmentPdf` | **OK**: `ValidateVisitTenantAsync` (`DocumentsController.cs:119`) | **WORKING** | — |
| 9 | Allegato3BCenter — Valida XSD | `validate` (`Allegato3BCenter.jsx:21`) | `POST /api/documents/allegato-3b/{companyId}/validate` (`Allegato3BCenter.jsx:26`) | `DocumentsController.ValidateAllegato3B` (`DocumentsController.cs:90`) | No DB write; validates in-memory XML against embedded schema | **OK**: `ValidateCompanyTenantAsync` (`DocumentsController.cs:93`) | **PARTIALLY WORKING** | `DocumentGenerationService.cs:139-148` — XML is a hand-written stub; `DocumentGenerationService.cs:150-165` — XSD schema is minimal/fake and not the real INAIL schema |
| 10 | Allegato3BCenter — Invia a INAIL | `submit` (`Allegato3BCenter.jsx:35`) | `POST /api/documents/allegato-3b/{companyId}/submit` (`Allegato3BCenter.jsx:40`) | `DocumentsController.SubmitAllegato3B` (`DocumentsController.cs:100`) | No DB write; returns simulated receipt | **OK**: `ValidateCompanyTenantAsync` (`DocumentsController.cs:103`) | **STUB** | `DocumentGenerationService.cs:124-125` — `receiptId = "INAIL-" + Guid...` with message `"Submitted to INAIL (simulated)."` |
| 11 | ReportsCenter — Genera PDF (scadenze / idoneità / rischi / 3B) | `generateExpiringVisitsReport` etc. (`ReportsCenter.jsx:181`, `:212`, `:273`, `:330`) | `GET /api/medical-visits/expiring` + master-data endpoints (`ReportsCenter.jsx:182`, `:213-218`, `:274-278`, `:331-338`) | No dedicated report endpoints — all PDFs generated **client-side** with `jsPDF` + `autoTable` | No server-side persistence; data held in memory only | N/A (client-side) | **PARTIALLY WORKING** | `ReportsCenter.jsx:201-209`, `:250-270`, `:315-327`, `:551-731` — heavy client-side PDF generation; no server-side report generation or archival |

---

## 2. Critical Checks (exact code)

### C1. DocumentsController stubs
All three `Generate*` endpoints return hardcoded string stubs via `DocumentGenerationService`:

- `GenerateSanitaryPlan` (`DocumentsController.cs:55-68`) → `DocumentGenerationService.GenerateSanitaryPlan` returns `Task.FromResult($"STUB: GenerateSanitaryPlan for employee {employeeId}")` (`DocumentGenerationService.cs:41-42`).
- `GenerateAllegato3B` (`DocumentsController.cs:70-78`) → returns `Task.FromResult($"STUB: GenerateAllegato3B for company {companyId}")` (`DocumentGenerationService.cs:44-45`).
- `GenerateFitnessJudgment` (`DocumentsController.cs:80-88`) → returns `Task.FromResult($"STUB: GenerateFitnessJudgment for visit {medicalVisitId}")` (`DocumentGenerationService.cs:47-48`).

Controllers wrap them as `Ok(new { message = result })` (`DocumentsController.cs:67`, `:77`, `:87`).

### C2. ReportsCenter "Genera PDF giudizio"
**There is no "Genera PDF giudizio" button in `ReportsCenter.jsx`.** Judgment PDF generation exists only in `GiudizioIdoneitaCenter.jsx:168-174` (`Scarica PDF`), which calls the **real** `DocumentsController.DownloadFitnessJudgmentPdf` endpoint (`DocumentsController.cs:113-136`) that returns `File(pdfBytes, "application/pdf", ...)`. This endpoint is **WORKING**.

### C3. MedicalVisitStepper save & deadline
- **POST target**: `/api/doctor-data/medical-visits` (`MedicalVisitStepper.jsx:227`) hits the real `CreateMedicalVisit` (`DoctorCrudController.cs:77-129`). DTO sent includes `employeeId`, `doctorId`, `visitDate`, `nextDeadlineDate`, `visitType`, `targetOrgans`, `objectiveExam`, `outcome`, `clinicalNotes` — full field coverage.
- **Deadline**: Auto-preview via `GetDeadlinePreview` (`DoctorCrudController.cs:389`). Frontend uses preview if present; otherwise leaves `nextDeadlineDate` empty, which causes backend to attempt auto-calculation via `IDeadlineCalculationService` because empty string parses to a date equal to `VisitDate` (`DoctorCrudController.cs:103`).
- **Visit type enum**: Backend `MedicalVisitType` enum is in **English** (`Preventive`, `Periodic`, `RoleChange`, `EmployeeRequest`, `EndOfRelationship`) (`DomainEnums.cs:10-17`). Frontend `VISIT_TYPES` also uses English strings (`MedicalVisitStepper.jsx:28-34`). PDF maps to Italian via `MapVisitType` (`DocumentGenerationService.cs:129-137`). Per `product_bible.md` SCREEN 6 and `ux_physician_analysis.md` this is **WRONG** — UI should be Italian.

### C4. CartellaSanitariaCenter API & Allegato-3A compliance
- **API**: `/api/medical-records-v2/...` (`CartellaSanitariaCenter.jsx:36`) — uses `MedicalRecordController` v2.
- **Model compliance**: `MedicalRecord` model has only `MedicalHistory`, `Notes`, `CurrentTherapies`, `Allergies`, `FamilyHistory`, `Status` (`MedicalRecord.cs:5-40`). `product_bible.md` SCREEN 7 explicitly states this is **minimal and non-compliant** with Allegato 3A DM 9 Luglio 2012 — missing sections for occupational exposures, structured health surveillance, exams with results, etc.

### C5. GiudizioIdoneitaCenter persistence & PDF
- **Persistence**: Yes, via `PUT /api/visit-judgments/{id}` (`GiudizioIdoneitaCenter.jsx:72`) → `VisitJudgmentController.SetJudgment` (`VisitJudgmentController.cs:32-50`). Data is persisted into `MedicalVisits` columns, not a separate judgment entity.
- **Real PDF**: Yes. `Scarica PDF` calls `/api/documents/visits/{id}/fitness-judgment-pdf` (`GiudizioIdoneitaCenter.jsx:86`) → `DocumentsController.DownloadFitnessJudgmentPdf` (`DocumentsController.cs:113-136`) → `DocumentGenerationService.GenerateFitnessJudgmentPdf` (`DocumentGenerationService.cs:51-97`) → QuestPDF `FitnessJudgmentPdfDocument` (`FitnessJudgmentPdfDocument.cs`). Returns real bytes.

---

## 3. Additional Risks

- **Cross-tenant data leak (MedicalRecord GET)**: `MedicalRecordController.GetByEmployee` filters only by `EmployeeId`, ignoring tenant (`MedicalRecordController.cs:28-29`). Any tenant can read another tenant's medical record if they know the employee ID.
- **Cross-tenant data leak (MedicalVisit POST)**: `DoctorCrudController.CreateMedicalVisit` never sets `TenantId` (`DoctorCrudController.cs:126`). The row is saved with `TenantId = 0`, violating the `[Range(1, int.MaxValue)]` constraint and breaking multi-tenant isolation for all newly created visits.
- **Cross-tenant data leak (MedicalRecord POST)**: `MedicalRecordController.Upsert` does not set `TenantId` on new records (`MedicalRecordController.cs:47`).
- **Tenant fallback to 1**: `DoctorCrudController.GetTenantId` falls back to `1` if claim is missing (`DoctorCrudController.cs:964`), making unauthenticated/incorrect-token requests resolve to tenant 1.
- **Allegato 3B fake schema**: The embedded XSD (`DocumentGenerationService.cs:150-165`) defines only 5 generic elements; it is not the official INAIL `allegato3b.xsd`. Validation is theater.
- **No sign / notify-employer UI in scoped screens**: These actions are not present in the 5 scoped components. `DoctorCrudController` exposes `BatchSignVisits` (`DoctorCrudController.cs:939`) and recall campaigns, but no frontend button in the reviewed screens triggers them.

---

## 4. Prioritized Fix List

### (A) Clear stubs / bugs to fix now

| ID | Page / Action | Classification | Root Cause (file:line) | Recommended Fix |
|---|---|---|---|---|
| A1 | MedicalVisitStepper — Salva Visita | **BROKEN** | `DoctorCrudController.cs:126` — missing `request.TenantId = tenantId;` before `_dbContext.MedicalVisits.Add(request)`; frontend payload omits tenantId (`MedicalVisitStepper.jsx:227`) | Add `request.TenantId = tenantId;` in `CreateMedicalVisit`; add server-side tenant validation; enforce tenant in model binder or global filter. |
| A2 | CartellaSanitariaCenter — GET record | **BROKEN** | `MedicalRecordController.cs:28` — `.FirstOrDefaultAsync(x => x.EmployeeId == employeeId)` without tenant filter | Add `.Where(x => x.EmployeeId == employeeId && x.TenantId == GetTenantId())`. |
| A3 | CartellaSanitariaCenter — POST record | **BROKEN** | `MedicalRecordController.cs:47` — `_dbContext.MedicalRecords.Add(request)` without setting `request.TenantId` | Set `request.TenantId = GetTenantId()` before add (mirror `DoctorCrudController.CreateMedicalRecord` line 44). |
| A4 | DocumentsController — GenerateSanitaryPlan / GenerateAllegato3B / GenerateFitnessJudgment | **STUB** | `DocumentGenerationService.cs:41-48` — all three return `Task.FromResult($"STUB: ...")` | Implement real generation: QuestPDF for sanitary plan and Allegato 3B (server-side), wire to `GenerateFitnessJudgmentPdf` pattern. |
| A5 | Allegato3BCenter — Invia a INAIL | **STUB** | `DocumentGenerationService.cs:124-125` — simulated receipt only | Replace with real INAIL telematic submission (or at minimum queue + external gateway); do not return fake receipt IDs in production. |
| A6 | MedicalVisitStepper — Tipo visita in inglese | **WRONG** | `MedicalVisitStepper.jsx:28-34` + `DomainEnums.cs:10-17` — enum and UI labels in English | Localize frontend labels to Italian; keep backend enum values stable or map on save. |
| A7 | DoctorCrudController — Tenant fallback = 1 | **WRONG / SECURITY** | `DoctorCrudController.cs:964` — `GetTenantId()` returns `1` on missing claim | Throw `UnauthorizedAccessException` instead of silently defaulting to tenant 1. |

### (B) Larger / architectural fixes

| ID | Page / Action | Classification | Root Cause (file:line) | Recommended Fix |
|---|---|---|---|---|
| B1 | CartellaSanitariaCenter — Allegato-3A compliance | **MINIMAL / NON-COMPLIANT** | `MedicalRecord.cs:5-40` — only 5 text fields; `product_bible.md` SCREEN 7 lists missing sections | Extend `MedicalRecord` model with structured sections (occupational exposures, exams, DPI, structured objective exam); version the record. |
| B2 | GiudizioIdoneitaCenter — Save judgment | **PARTIALLY WORKING** | `VisitJudgmentController.cs:41-45` — judgment fields inlined into `MedicalVisit` table | Introduce a dedicated `FitnessJudgment` entity; preserve structured history; link to visit. |
| B3 | ReportsCenter — Genera PDF | **PARTIALLY WORKING** | `ReportsCenter.jsx:181-731` — client-side `jsPDF` only; no server-side archival or digital signature | Move heavy PDF generation to backend `DocumentGenerationService`; store generated documents; enable digital signature. |
| B4 | Allegato3BCenter — Valida XSD | **PARTIALLY WORKING** | `DocumentGenerationService.cs:139-165` — stub XML + fake XSD | Replace with real INAIL `allegato3b.xsd`; generate XML from actual company/visit/risk data. |
| B5 | MedicalVisitStepper — nextDeadline | **PARTIALLY WORKING** | `MedicalVisitStepper.jsx:231-233` + `DoctorCrudController.cs:100-123` — sentinel-date hack; protocol dependency missing if client sends manual date | Refactor: expose protocol-based preview API; remove sentinel equality; require explicit `calculationSource` in DTO. |
| B6 | Scoped screens — Sign / Notify employer | **MISSING** | No buttons in reviewed components; `DoctorCrudController.BatchSignVisits` exists (`DoctorCrudController.cs:939`) but no UI trigger | Add "Firma" and "Notifica datore" actions to GiudizioIdoneitaCenter and MedicalVisitStepper post-save. |
