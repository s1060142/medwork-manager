# DOCUMENT STATUS REPORT
**Date**: 2026-09-19
**Auditor**: Documentation Architect (Hermes Agent)
**Scope**: All files in `/docs/` + root-level `.md` files
**Reference**: Actual codebase state at commit `7b87097`

---

## Classification Summary

| # | File | Classification | Reason |
|---|------|---------------|--------|
| 1 | `audit_report.md` | **OBSOLETE** | Contains specific code corrections (GiudizioIdoneitaCenter fetch, AdminCrudController protocol endpoints, TenantId in Protocol creation) that were ALREADY FIXED in later commits. The `localStorage` protocol issue is resolved (DB persistence now exists). References `api/documents/...` fetch in GiudizioIdoneitaCenter — now `VisitJudgmentController` exists with proper routes. |
| 2 | `BACKLOG_FASE1_FASE2.md` | **OBSOLETE** | Marks FASE 0/1/3/4 as "COMPLETATO" with specific items (MedicalRecordController, VisitJudgmentController, SignatureController, AlertsController, Allegato 3B). All these exist in codebase NOW. Also references `npm run build` and `dotnet test` passing — those were true then but the codebase has moved on (new controllers: CompanyGroups, MasterData, MedicalVisitAI, Appointments, etc.). The migration status is also wrong — migrations exist and have been applied. |
| 3 | `Beta Test Plan.md` | **OBSOLETE** | Lists only 18 lines of audience types (Medico Competente, Piccola azienda, etc.) — content was a placeholder/stub. The actual Playwright campaign is in `PLAYWRIGHT_E2E_CAMPAIGN.md`. No actionable test plan content. |
| 4 | `dependencies.md` | **OBSOLETE** | Discusses "Fase 0, Fase 1, Fase 2" parallel work with mock APIs for React Native/Next.js stack. The actual stack is ASP.NET Core + React Vite + MUI (not Next.js/React Native). Timeline table shows weeks 1-3 from August 2026 — everything referenced as "in corso" is now completed or superseded. References `/docs/ux/flussi_utente.md` which exists but is PARTIALLY OUTDATED. |
| 5 | `due_diligence_report.md` | **PARTIALLY OUTDATED** | Extensive report (673 lines) with accurate architecture analysis and security findings. **MANY CRITICAL ISSUES ARE NOW FIXED**: Admin123! backdoor removed from production code (only in test fixtures), TenantId fallback partially fixed (server-side now), AlertMultiChannelService TenantId fixed, DocumentGenerationService now uses QuestPDF (not stub), PDF generation is server-side and working (`FitnessJudgmentPdfDocument`, `Allegato3APdfDocument`, `AnnualHealthReportPdfDocument` exist). **STILL ACCURATE** for: competitor benchmark, feature gap analysis, many HIGH/MEDIUM issues (DTOs missing, pagination absent, EPPlus license, AdminCrudController copy-paste bug). |
| 6 | `phase6_plus_vision.md` | **OBSOLETE** | Describes a React Native mobile app + Next.js web app + "Protocol Designer Visivo" + "AI-Assisted Charting" flows. None of this is implemented. The actual frontend is React Vite/MUI only. Contains "Design System & UX/UI (Fase 2)" placeholder content that was never fully built. References mock APIs and React Native/Next.js stack that doesn't exist. |
| 7 | `PLAYWRIGHT_E2E_CAMPAIGN.md` | **PARTIALLY OUTDATED** | The most operationally useful document. Contains real Playwright test spec IDs (AUTH-01 through ADMIN-03, 45 tests). **ACCURATE**: Test structure, auth flows, companies, employees, visits, medical records, protocols, deadline calculation, PDF generation, imports/exports, notifications, administration test cases. **OUTDATED**: Default admin password `Admin123!` only exists in test fixtures now (not production). References `api/medical-records-v2` but `MedicalRecordController` now exists at `api/medical-records`. Missing: CompanyGroups tests, MasterData tests, CompanyNominations, Appointments, ActivityDeadlines. Beta gate says "47/47 PASS" but current backend has 48+ tests and new modules exist. |
| 8 | `product_bible.md` | **PARTIALLY OUTDATED** | The largest document (1234 lines). Contains deep audit of every screen. **STILL VALUABLE**: Screen-by-screen analysis, UX problems, click audits, competitor comparison (vs CartSan), feature ranking, missing features report, roadmap phases. **OUTDATED IN**: Protocol persistence (says "salvati in localStorage, non nel database" — NOW FIXED, protocols persist in DB), PDF generation (says "stub that returns a string" — NOW QuestPDF works with `FitnessJudgmentPdfDocument`, `Allegato3APdfDocument`, `AnnualHealthReportPdfDocument`), Allegato 3B (was XML stub — now has `DocumentsController` with validate/submit), audit trail (was localStorage — now server-side AuditController exists), Admin123! backdoor (removed from production), TenantId fallback (fixed). Missing from docs: CompanyGroups, MasterData, MedicalVisitAI, Appointments, ActivityDeadlines, CompanyNominations, HealthPlanPreview, BatchSignature, GlobalSearchModal. |
| 9 | `QA_MASTER_CHECKLIST.md` | **REDUNDANT** | Only 31 lines, essentially a keyword list: "AUTH, JWT, ROLES, TENANT ISOLATION, EMPLOYEES, COMPANIES, PROTOCOLS, VISITS, ANAMNESIS, DEADLINES, PDF, SEARCH, DASHBOARD, CALENDAR, RECALL CAMPAIGNS, HEALTH PLAN, COMPLIANCE, ALLEGATO 3B, PATIENT PORTAL, BATCH SIGNATURE". No structure, no priority levels, no test steps. Superseded by `PLAYWRIGHT_E2E_CAMPAIGN.md` (45 detailed test cases) and the `grid-sync-*.spec.ts` files (5 files, 5/5 PASS). Purely redundant. |
| 10 | `ux_physician_analysis.md` | **PARTIALLY OUTDATED** | Excellent physician-perspective analysis (361 lines). **STILL VALUABLE**: Task analysis (5 slow tasks), click audit table, missing information during visits, switch triggers, feature ranking (Top 20), tier analysis, competitor gaps, time savings calculations. **OUTDATED IN**: References specific files/lines that may have changed. Task 2 (visit registration) — MedicalVisitStepper now has more structure. Task 3 (PDF judgment) — now WORKING via QuestPDF. Task 4 (scadenziario) — `DeadlineCalculationService` now integrated, JobRole fallback working. The "12 min/visita × 20 visite" delta may be reduced. The "Copia ultima visita" feature (Rank #2) may exist in `MedicalVisitStepper`. The "AlertMultiChannelService console only" — now has real notification transport interfaces. |

---

## Detailed Classification Rationale

### `audit_report.md` — OBSOLETE
Written to correct 4 blocking issues in an "implementation plan." All 4 issues were fixed in subsequent commits:
1. **Feature 1 (PDF)** — `VisitJudgmentController` now exists at `api/visit-judgments` with proper routes. `GiudizioIdoneitaCenter.jsx` uses `apiClient.ts` correctly.
2. **Feature 2 (Protocols)** — Protocol CRUD moved to `DoctorCrudController.cs`. Frontend `ProtocolsCenter.jsx` uses correct endpoints.
3. **Feature 2 (TenantId)** — Protocol entity creation now includes `TenantId = GetTenantId()`.
4. **Feature 3 (Deadlines)** — `DeadlineCalculationService.cs` now implements JobRole fallback in `CalculateAsync`.

### `BACKLOG_FASE1_FASE2.md` — OBSOLETE
Lists FASE 0-4 as completed with specific implementation details (controller names, routes, frontend file names). All items listed now exist in the codebase plus many more. The document is a historical record with no forward-looking content.

### `Beta Test Plan.md` — OBSOLETE
18 lines of audience definitions only. No test scenarios, no pass criteria, no execution plan. The actual test strategy is fully documented in `PLAYWRIGHT_E2E_CAMPAIGN.md`.

### `dependencies.md` — OBSOLETE
Based on a React Native + Next.js architecture that was never implemented. The actual stack is ASP.NET Core + React Vite + MUI. The timeline (weeks 1-3 of August 2026) is completely past. References `/docs/ux/flussi_utente.md` which exists but is outdated.

### `due_diligence_report.md` — PARTIALLY OUTDATED
Contains the most comprehensive analysis in the repository. Security section has **3 of 4 critical issues fixed** (Admin123! removed from production, TenantId fixed, AlertMultiChannelService fixed). Document generation is now QuestPDF-based (not stub). **Still accurate** for: architecture analysis, DTO issues, pagination, EPPlus license, competitor benchmark, feature gap matrix, innovation opportunities. The due diligence report's roadmap (P0-P3, 90-day plan) was essentially EXECUTED — the items it listed as P0 are now done.

### `phase6_plus_vision.md` — OBSOLETE
Describes a product vision (React Native mobile + Next.js web + Protocol Designer + AI charting) that has ZERO implementation. The `ux_physician_analysis.md` also references this as "Fase 2" design system work. The actual product is React Vite/MUI only. Contains placeholder content with design system mockups that were never built.

### `PLAYWRIGHT_E2E_CAMPAIGN.md` — PARTIALLY OUTDATED
The most valuable surviving document. Test IDs (AUTH-01, COMP-01, etc.) and test structure are solid. **Outdated**: doesn't cover CompanyGroups, MasterData, CompanyNominations, Appointments, ActivityDeadlines, MedicalVisitAI, HealthPlanPreview, BatchSignature, Questionnaires, PhraseTemplates, RecallCampaigns modules. Beta gate says "47/47" but actual test count is now higher. Default admin `Admin123!` only in test fixtures now (correct for Playwright). Missing grid-sync spec files (5 files, 5/5 PASS).

### `product_bible.md` — PARTIALLY OUTDATED
Largest and most detailed document. Screen-by-screen analysis from physician perspective is timeless. **Critically outdated** on: Protocol persistence (was localStorage, now DB), PDF generation (was stub, now QuestPDF working), Allegato 3B (was XML stub, now has validation/submit), audit trail (was localStorage, now server-side), Admin123! (removed), TenantId fallback (fixed). Missing: all modules added after August 2026 (CompanyGroups, MasterData, etc.).

### `QA_MASTER_CHECKLIST.md` — REDUNDANT
31 keyword lines. No test cases, no priorities, no structure. Completely superseded by `PLAYWRIGHT_E2E_CAMPAIGN.md` (45 test cases with steps, expected results, failure conditions) and grid-sync specs. Should be deleted.

### `ux_physician_analysis.md` — PARTIALLY OUTDATED
Highest-quality physician-perspective document. The core insights are timeless: slow task times, missing context during visits, click audits, switch triggers. **Updated**: PDF generation now works (Rank #1 switch trigger achieved), scadenziario auto-calculation partially implemented, "Copia ultima visita" may exist. Time savings calculations may be optimistic since some features are still partial.

---

## Duplicated Information Across Documents

| Topic | Documents | Issue |
|-------|-----------|-------|
| Security vulnerabilities (Admin123!, TenantId, credentials) | `audit_report.md`, `due_diligence_report.md`, `product_bible.md` | All 3 cover same issues. `audit_report.md` provides exact fixes (now done), `due_diligence_report.md` gives full analysis, `product_bible.md` repeats them in screen audits. |
| Protocol localStorage issue | `product_bible.md`, `audit_report.md`, `ux_physician_analysis.md` | Same problem described 3 times. Now FIXED in code. |
| PDF generation stub | `due_diligence_report.md`, `product_bible.md`, `ux_physician_analysis.md`, `PLAYWRIGHT_E2E_CAMPAIGN.md` | Described as stub in 4 docs. Now WORKING with QuestPDF. |
| Allegato 3B XML stub | `due_diligence_report.md`, `product_bible.md`, `BACKLOG_FASE1_FASE2.md` | Now has `DocumentsController` with validate/submit and `Allegato3BCenter.jsx`. |
| Audit trail localStorage | `product_bible.md`, `due_diligence_report.md` | Now has server-side `AuditController.cs`. |
| Missing features list | `product_bible.md`, `due_diligence_report.md`, `ux_physician_analysis.md` | Three separate missing-feature lists with significant overlap. |
| Competitor comparison | `product_bible.md`, `due_diligence_report.md`, `ux_physician_analysis.md` | Winasped/81ML/Twind comparisons appear in all 3. |
| Playwright test scenarios | `PLAYWRIGHT_E2E_CAMPAIGN.md`, `QA_MASTER_CHECKLIST.md` | QA checklist is a 31-word keyword list; Playwright doc has all details. |
| Roadmap phases | `product_bible.md`, `phase6_plus_vision.md`, `due_diligence_report.md` | Each has a different roadmap version. |

---

## Obsolete Claims to Remove

When rewriting documentation, these claims must be REMOVED or UPDATED:

1. ❌ "Protocolli salvati in localStorage" → ✅ Persistiti nel DB
2. ❌ "PDF generati client-side con jsPDF" → ✅ Server-side con QuestPDF (`FitnessJudgmentPdfDocument`, `Allegato3APdfDocument`, `AnnualHealthReportPdfDocument`)
3. ❌ "Allegato 3B XML stub" → ✅ XSD validation + INAIL submit endpoint exists
4. ❌ "Admin123! backdoor" → ✅ Removed from production code (only in test fixtures)
5. ❌ "TenantId fallback = 1" → ✅ Fixed in `TenantContextFilter` and server-side
6. ❌ "AlertMultiChannelService TenantId hardcoded = 1" → ✅ Fixed
7. ❌ "DocumentGenerationService = STUB" → ✅ QuestPDF implementation working
8. ❌ "Audit trail in localStorage" → ✅ Server-side `AuditController.cs`
9. ❌ "No paginazione API" → ✅ Partial pagination exists
10. ❌ "Next.js / React Native stack" → ✅ React Vite + MUI (actual stack)
11. ❌ "Fase 2 Design System (mock APIs)" → ✅ Never executed as described
12. ❌ "48/48 test count" → ✅ Now more tests across grid-sync specs + integration tests

---

*Report complete. Proceed to create new documentation structure upon approval.*
