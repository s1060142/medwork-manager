# MedWork Audit — Protocols / Compliance / Planning / Recall / Questionnaires / Tools / PhraseTemplates

Scope: `medwork-frontend/src/components/{ProtocolsCenter,ComplianceCenter,VisitPlanningCenter,RecallCampaignsCenter,QuestionnairesCenter,ToolsCenter,PhraseTemplatesCenter}.jsx`
Backend: `MedWork.Api/Controllers/DoctorCrudController.cs`, `ComplianceController.cs`, `QuestionnairesController.cs`, `PhraseTemplatesController.cs`, `MasterDataController.cs`, `SignatureController.cs`; `Compliance/ComplianceRuleEngine.cs`; `Data/AppDbContext.cs`, models.
Docs: `docs/product_bible.md`, `docs/ux_physician_analysis.md`.

## 1. Executive summary

- **Protocols**: migrated OFF localStorage (docs are STALE), but the list `GET` hits a non-existent route `/api/protocols` → **BROKEN list**. Create/PATCH correctly target `api/doctor-data/protocols` and DO persist with `TenantId`.
- **Compliance**: read-only, real tenant-isolated endpoint, **WORKING** for 3 operational checks. The 5 codified `C1–C5` rules in `ComplianceRuleEngine` are implemented but **orphaned** (only reachable via `api/compliance/evaluate-protocol`, which the UI never calls). There is **no manual form** in the current component (doc premise is outdated).
- **VisitPlanning**: **WORKING** (real tenant-scoped reads + convocation POST).
- **Recall**: candidates list **WORKING**; "Lancia Campagna" **BROKEN** by reversed `apiSend` argument order → 404.
- **Questionnaires**: list **WORKING** (no tenant filter); submit **PARTIALLY WORKING** — scoring works but `employeeId`/`medicalVisitId` hardcoded to `0`.
- **Tools**: diagnostic metrics **WORKING**; "Registra firma" **BROKEN** (404; wrong URL + no backend create endpoint; localStorage persistence path is dead).
- **PhraseTemplates**: CRUD endpoints exist but **BROKEN for any real tenant** — `Create` omits `TenantId` (stored as 0), `Search` GET has no tenant filter (cross-tenant leak), `Update`/`Delete` require matching `TenantId` → 404.

## 2. ProtocolsCenter (`ProtocolsCenter.jsx`)

- Load list — handler `ProtocolsCenter.jsx:47-58` (`load()`) — API `GET /api/protocols` (`ProtocolsCenter.jsx:51`) — backend: **NO controller for `/api/protocols`** (routes live under `api/doctor-data` and `api/admin`) → **404** — classification **BROKEN**. Root cause `ProtocolsCenter.jsx:51`.
- "Nuovo protocollo" (open dialog) — `ProtocolsCenter.jsx:143-149` — no API — n/a — **WORKING** (UI only; doc claim "salva in localStorage prima del form" is STALE: current code only `setDialogOpen(true)`).
- Save — `ProtocolsCenter.jsx:73-96` — API `POST /api/doctor-data/protocols` (`ProtocolsCenter.jsx:81`) — backend `DoctorCrudController.cs:489 CreateProtocol`, sets `TenantId = GetTenantId()` (`DoctorCrudController.cs:497`), persists `Protocols` — **WORKING** (DB + tenant isolation OK). But after save it calls `load()` which re-hits the broken GET → list stays empty/error.
- Toggle Attiva/Disattiva — `ProtocolsCenter.jsx:98-107` — `PATCH /api/doctor-data/protocols/{id}/toggle` (`ProtocolsCenter.jsx:100`) — backend `DoctorCrudController.cs:549 ToggleProtocol`, tenant-guarded (`DoctorCrudController.cs:553`) — endpoint **WORKING** but unreachable in UI because the list never renders rows (broken GET).
- Esporta CSV — `ProtocolsCenter.jsx:109-118` — local only (`downloadCsv`) — **WORKING** (client-side).
- **localStorage check**: NO `useState`/`useEffect`/`localStorage` for protocols in this file. Docs `product_bible.md:292,295,301` ("salvati in localStorage") describe an OLD version; current code calls the backend. **Answer: protocols are NOT in localStorage now.**

## 3. ComplianceCenter (`ComplianceCenter.jsx`)

- Load alerts — `ComplianceCenter.jsx:28-42` — `GET /api/doctor-data/compliance-alerts` (`ComplianceCenter.jsx:33`) — backend `DoctorCrudController.cs:762 GetComplianceAlerts` — real queries: (1) Employees with `JobRoleId == null` "Manca la Mansione" Warning; (2) Companies with empty RSPP "RSPP non definito" Critical; (3) MedicalVisits dated > now+1d "Data visita nel futuro" Warning — tenant-isolated (`DoctorCrudController.cs:765`) — **WORKING**.
- Manual form / 5 hardcoded rules: **There is NO manual form** in this component. The "5 rules" the user remembers are `C1`–`C5` in `ComplianceRuleEngine.cs:41-83` (C1 audiometry for acoustic/vibration risk; C2 lab exams for chemical risk; C3 minors require periodic/preventive; C4 "NON_IDONEO" requires prescription/notes; C5 periodic visit with zero exams = warning). These are **only invoked by `POST api/compliance/evaluate-protocol`** (`ComplianceController.cs:34`), which **no frontend page calls**. ComplianceCenter instead shows the 3 operational data-quality alerts above. So the rules exist but are **orphaned** from the UI.
- Classification: **WORKING** for what it shows; **MISSING INTEGRATION** of the C1–C5 rule engine.

## 4. VisitPlanningCenter (`VisitPlanningCenter.jsx`)

- Load — `VisitPlanningCenter.jsx:45-67` — `GET /api/master-data/medical-visits` + `/api/master-data/employees` (`VisitPlanningCenter.jsx:52-53`) — backend `MasterDataController.cs:224` (tenant via master-data) & `:66` — **WORKING**.
- Orizzonte select / Aggiorna — `VisitPlanningCenter.jsx:156-168` — client-only — **WORKING**.
- Nuova visita — `VisitPlanningCenter.jsx:169` `onOpenMedicalVisitCreate` prop — handler lives outside this file — n/a — depends on parent.
- Convoca — `VisitPlanningCenter.jsx:130-142` — `POST /api/doctor-data/convocations` (`VisitPlanningCenter.jsx:133`) — backend `DoctorCrudController.cs:364 ConvocateEmployee`, tenant-checked employee (`DoctorCrudController.cs:368`), calls `INotificationService.SendConvocationAsync` — **WORKING** (creates `NotificationLog`).
- Note: `scopedEmployees` company/branch filter (`VisitPlanningCenter.jsx:81-93`) is client-side; backend already scopes by tenant. Acceptable.

## 5. RecallCampaignsCenter (`RecallCampaignsCenter.jsx`)

- Load companies — `RecallCampaignsCenter.jsx:37-41` — `GET /api/master-data/companies` — `MasterDataController.cs:21` — **WORKING**.
- Load candidates — `RecallCampaignsCenter.jsx:43-57` — `GET /api/doctor-data/recall-candidates?companyId&days` (`RecallCampaignsCenter.jsx:48`) — backend `DoctorCrudController.cs:679 GetRecallCandidates`, tenant-guarded (`DoctorCrudController.cs:689`) — **WORKING**.
- Slider / Select — client-only — **WORKING**.
- **Lancia Campagna — `RecallCampaignsCenter.jsx:59-78` — `apiSend('/api/doctor-data/recall-campaign', 'POST', {...})` (`RecallCampaignsCenter.jsx:64`)** — `apiSend(method, endpoint, payload)` signature is `apiClient.ts:121`. Here the args are **reversed**: method=`'/api/doctor-data/recall-campaign'`, endpoint=`'POST'`. Result: `fetch(API_BASE+'POST', {method:'/api/doctor-data/recall-campaign', body})` → **404 / malformed request**. Endpoint `POST /api/doctor-data/recall-campaign` DOES exist (`DoctorCrudController.cs:704`, tenant-scoped, persists `NotificationLogs`) — **BROKEN due to frontend bug**. Root cause `RecallCampaignsCenter.jsx:64`.

## 6. QuestionnairesCenter (`QuestionnairesCenter.jsx`)

- Load templates — `QuestionnairesCenter.jsx:25-29` — `GET /api/questionnaires` — `QuestionnairesController.cs:26 List` — query `Where(x => x.IsActive)` **NO `TenantId` filter** (`QuestionnairesController.cs:29`) → cross-tenant read of templates. Classification **PARTIALLY WORKING** (works, but leaks across tenants). Root cause `QuestionnairesController.cs:29`.
- Apri template — `QuestionnairesCenter.jsx:31-35` — client-only (renders `definitionJson`) — **WORKING**.
- Calcola score (submit) — `QuestionnairesCenter.jsx:41-60` — `POST /api/questionnaires/responses` (`QuestionnairesCenter.jsx:49`) — backend `QuestionnairesController.cs:45 SubmitResponse`, tenant-checked questionnaire (`QuestionnairesController.cs:50`), scores via `IQuestionnaireScoringService`, persists `QuestionnaireResponse`. **But payload hardcodes `employeeId: 0, medicalVisitId: 0` (`QuestionnairesCenter.jsx:51-52`)** → response saved against nonexistent employee/visit. Classification **PARTIALLY WORKING** (scoring + persistence OK; linkage broken). Root cause `QuestionnairesCenter.jsx:51-52`.

## 7. ToolsCenter (`ToolsCenter.jsx`)

- Load — `ToolsCenter.jsx:51-68` — `GET /api/master-data/employees`, `/exam-types`, `/medical-visits` — `MasterDataController.cs:66,162,224` — **WORKING**.
- Online/offline indicator — client-only (`navigator.onLine`) — **WORKING**.
- **Registra firma — `ToolsCenter.jsx:96-114` — `POST /api/tools/signatures` (`ToolsCenter.jsx:101`)** — backend has **NO `/api/tools/signatures`** route. `SignatureController.cs:13` base is `api/signatures` and exposes only `POST verify` (`SignatureController.cs:23`) and `GET hash-sample` — **no create/persist endpoint at all**. So the call 404s; the `catch` alerts and returns (no save). The localStorage write (`ToolsCenter.jsx:106-107`) only runs on API success, so it is **dead**; the list (`signatures` state, `ToolsCenter.jsx:40`) is always empty after reload. Classification **BROKEN / MISSING IMPLEMENTATION**. Root cause `ToolsCenter.jsx:101` (wrong URL) + missing backend signature-create endpoint.

## 8. PhraseTemplatesCenter (`PhraseTemplatesCenter.jsx`)

- Load — `PhraseTemplatesCenter.jsx:41-51` — `GET /api/phrase-templates?q&category&favouritesOnly` (`PhraseTemplatesCenter.jsx:46`) — backend `PhraseTemplatesController.cs:24 Search` — query **NO `TenantId` filter** (`PhraseTemplatesController.cs:31`) → returns ALL tenants' phrases (cross-tenant leak). **PARTIALLY WORKING / WRONG BEHAVIOR**.
- Nuova/Modifica (save) — `PhraseTemplatesCenter.jsx:67-80` — `POST /api/phrase-templates` or `PUT /api/phrase-templates/{id}` (`PhraseTemplatesCenter.jsx:71-72`) — backend `Create` (`PhraseTemplatesController.cs:50-56`) **does NOT set `TenantId`** → row stored as `TenantId = 0` (model requires it, `PhraseTemplate.cs:15`). `Update` (`PhraseTemplatesController.cs:61`) and `Delete` (`PhraseTemplatesController.cs:76`) filter `x.TenantId == GetTenantId()`. For any real tenant (id ≠ 0), a just-created phrase (id 0) is **not found → NotFound** on edit/delete. So create "succeeds" but the row is then unmanageable and visible to every tenant. Classification **BROKEN** (multi-tenant). Root cause `PhraseTemplatesController.cs:50-56` (+ `:31` read).
- Elimina — `PhraseTemplatesCenter.jsx:82-87` — `DELETE /api/phrase-templates/{id}` — same tenant-mismatch 404 for real tenants — **BROKEN**.
- Toggle preferito — `PhraseTemplatesCenter.jsx:89-93` — `PUT /api/phrase-templates/{id}` — same issue — **BROKEN**.

## 9. PRIORITIZED FIX LIST

### (A) Clear bugs — fix now

| id | page | action | classification | root cause file:line | recommended fix |
|----|------|--------|----------------|----------------------|-----------------|
| A1 | Protocols | Load list (GET) | BROKEN (404) | `ProtocolsCenter.jsx:51` | Change `/api/protocols` → `/api/doctor-data/protocols` (matches `DoctorCrudController.cs:462`). |
| A2 | Recall | Lancia Campagna (POST) | BROKEN (reversed args) | `RecallCampaignsCenter.jsx:64` | `apiSend('POST', '/api/doctor-data/recall-campaign', {...})` (match `apiClient.ts:121`). |
| A3 | Tools | Registra firma (POST) | BROKEN / MISSING IMPL | `ToolsCenter.jsx:101` + no backend endpoint | Add `POST /api/signatures` (or `/api/tools/signatures`) create endpoint persisting a `Signature` entity with `TenantId`; remove dead localStorage pattern (list should load from DB). |
| A4 | PhraseTemplates | Create/Read/Update/Delete | BROKEN (tenant isolation) | `PhraseTemplatesController.cs:50-56` (no TenantId on Create), `:31` (Search no filter), `:61,:76` (require TenantId) | Set `request.TenantId = GetTenantId()` in `Create`; add `Where(x => x.TenantId == GetTenantId())` to `Search`. |
| A5 | Questionnaires | Submit response | PARTIALLY WORKING (linkage) | `QuestionnairesCenter.jsx:51-52` | Pass real `employeeId`/`medicalVisitId` from visit/employee context instead of `0`. |

### (B) Larger features

| id | page | action | classification | root cause file:line | recommended fix |
|----|------|--------|----------------|----------------------|-----------------|
| B1 | Protocols | Full protocol model | MISSING FEATURE | `ProtocolsCenter.jsx` form + `Protocol` model (single `JobRoleId`, no steps/exams) | N risks + N exams with independent cadences, versioning, auto-assign protocol→job role, inline compliance check, ATECO template library (per `product_bible.md:296-300`). |
| B2 | Compliance | Surface C1–C5 rules | MISSING INTEGRATION | `ComplianceRuleEngine.cs:41-83` orphaned; `ComplianceController.cs:34` never called by UI | Call `evaluate-protocol` from ComplianceCenter (or fold C1–C5 into `GetComplianceAlerts`) so the 5 codified rules appear alongside the 3 operational alerts. |
| B3 | Tools | Signature persistence/audit | MISSING FEATURE | `ToolsCenter.jsx:21-34,96-114` + `SignatureController.cs:13` (no create) | Replace localStorage with server-side, tenant-scoped signature store + load endpoint; emit immutable server-side audit event. |
| B4 | Questionnaires | Tenant-scoped list | WRONG BEHAVIOR | `QuestionnairesController.cs:29` | Add `Where(x => x.TenantId == GetTenantId())` to `List`. |
| B5 | Cross-cutting | Tenant hardening | WRONG BEHAVIOR | `PhraseTemplatesController.cs:31`, `QuestionnairesController.cs:29` | Audit all list endpoints for missing `TenantId` filters (defense-in-depth) — PhraseTemplates + Questionnaires confirmed. |

## 10. Answers to the specific verification questions

- **Are protocols saved to localStorage?** No. Current `ProtocolsCenter.jsx` uses `apiGet`/`apiSend` (lines 47-107); no `localStorage`/useState persistence for protocols. Docs `product_bible.md:292,295,301` are STALE (describe the old localStorage build). 
- **Backend ProtocolsController / is frontend calling it?** No dedicated `ProtocolsController` class. Endpoints live in `DoctorCrudController` (`api/doctor-data/protocols`: GET `:462`, POST `:489`, PUT `:528`, PATCH toggle `:549`) and `AdminCrudController` (`api/admin/protocols`). Frontend POST/PATCH are correct; the **frontend GET targets the non-existent `/api/protocols`**, so it effectively ignores the working `api/doctor-data/protocols` GET.
- **Compliance manual form / 5 hardcoded rules?** No manual form exists. The 5 rules are `C1` acoustic→audiometry, `C2` chemical→lab, `C3` minor→periodic, `C4` non-idoneo→prescription, `C5` periodic w/ no exam (`ComplianceRuleEngine.cs:41-83`); they are implemented but only reachable via `api/compliance/evaluate-protocol`, which the UI never calls. ComplianceCenter shows 3 operational alerts instead (missing JobRole / missing RSPP / future-dated visit).
- **VisitPlanning/Recall/Questionnaires/Tools/PhraseTemplates real endpoints?** VisitPlanning = real (working). Recall = real reads; send broken by arg order. Questionnaires = real (list no tenant filter; submit hardcodes 0). Tools = metrics real; signature 404. PhraseTemplates = real endpoints but multi-tenant broken.
