# Company Groups — Final UI Validation: Implementation Plan

**Objective**: Fix confirmed functional UI defects in Company Groups module and enable complete browser evidence for every action. Distinguish must-fix blockers from optional hardening. Do not modify files.

---

## 1. Must-Fix Blockers

### D1. Compliance Remediation Action Keys Mismatch
- **File**: medwork-frontend/src/components/CompanyGroupsCenter.jsx lines 1247-1252
- **Problem**: UI calls handleRemediate with keys generate-missing-folders, assign-group-doctor, align-protocols. Backend switch handles only nominate-doctor, plan-visit, create-record. Buttons always 400.
- **Fix**: Map UI keys to backend keys. For align-protocols, add backend case or map to plan-visit as temporary.
- **Risk**: Medium if align-protocols has no backend equivalent.

### D2. Remove Doctor — Wrong ID
- **File**: CompanyGroupsCenter.jsx lines 1656, 1662
- **Problem**: Passes d.doctorId (Doctor personal ID) but backend DELETE expects GroupDoctor membership ID (d.Id). Always 404.
- **Fix**: Change d.doctorId to d.id in both React key (line 1656) and handler call (line 1662).
- **Risk**: Low — d.Id confirmed in API response.

### D3. Bulk Campaign Field Mapping
- **File**: CompanyGroupsCenter.jsx lines 106-111, 267
- **Problem**: campaignForm sends notes but backend BulkPlanCampaignRequest expects Description. CompanyIds, ProtocolId, TargetMonths not sent.
- **Fix**: Map payload fields to backend request model field names.
- **Risk**: Low.

### D4. No Destructive Confirmations
- **File**: CompanyGroupsCenter.jsx handleRemoveCompanyFromGroup (354), handleRemoveDoctorFromGroup (386)
- **Problem**: DELETE executes immediately without window.confirm(). Inconsistent with WorkersCenter.jsx, PhraseTemplatesCenter.jsx.
- **Fix**: Add window.confirm() guard before each DELETE.
- **Risk**: Medium — Playwright needs page.on(dialog) handler in tests.

### D5. No Refresh/Tab Persistence
- **File**: CompanyGroupsCenter.jsx state declarations (66-97)
- **Problem**: activeTab, selectedGroupId, filters reset on page refresh.
- **Fix**: Persist to localStorage; restore on initial load.
- **Risk**: Low.

### D6. Health Check Test Wrong Endpoint
- **File**: medwork-frontend/tests/ui.comprehensive.spec.ts line 278
- **Problem**: Tests /api/master-data/company-groups (404) instead of /api/company-groups.
- **Fix**: Change endpoint to /api/company-groups.

---

## 2. Optional Hardening

### O1. entityConfigs.js endpoints wrong (454-457) — dead code, /api/admin-data/ and /api/master-data/ instead of /api/company-groups
### O2. Bulk visits ambulatory field extra (252) — ignored by backend
### O3. Bulk site visits missing CompanyIds/Structure (281-285) — defaults exist in backend
### O4. Backend Create uses full entity model (CompanyGroupsController.cs 244-258) — over-posting

---

## 3. Routing Verification — CONFIRMED OK

- Sidebar Gestione aziende -> company-management area -> companies module
- Tab Gruppi aziendali -> company-groups module via COMPANY_TAB_TO_MODULE
- App.tsx line 594-596: moduleKey company-groups -> <CompanyGroupsCenter />
- Doctor AND Admin roles both see company-groups (line 338)
- LoginCard authLogin signature matches apiClient.ts (4 args)

---

## 4. apiSend Argument Order — CONFIRMED OK

All 11 apiSend calls in CompanyGroupsCenter.jsx use correct order: apiSend(method, endpoint, payload) matching apiClient.ts line 184. Previously fixed via fix_apisend.js script.

---

## 5. Test Coverage

### Existing
- company-groups-ui-validation.spec.ts: Add Doctor dialog only — needs expansion
- p0-beta-gate.spec.ts: No Company Groups section — must add
- CompanyGroupsIntegrationTests.cs: 7 GET/bulk-plan tests — exists

### Required additions (13 scenarios)
1. Create Group, 2. Add Company, 3. Remove Company (with confirm), 4. Add Doctor, 5. Remove Doctor (with confirm), 6. Bulk Plan Visits, 7. Bulk Campaign, 8. Bulk Site Visits, 9. Compliance Remediation, 10. Propagation, 11. Persistence/refresh, 12. Dashboard KPIs, 13. CSV Export

---

## 6. Priority

Phase 1 (Must-Fix): D1, D2, D3, D4, D5, D6
Phase 2 (Optional): O1, O2, O3, O4
Phase 3 (Tests): company-groups-full-matrix.spec.ts, expand validation spec, add to p0-beta-gate

---

## 7. Risks

- D1: align-protocols needs backend case or temporary mapping
- D4: window.confirm() needs Playwright dialog handler in tests
- P0-beta-gate missing Company Groups tests

---

## 8. Implementation Sequence

1. Fix compliance action keys (D1)
2. Fix Remove Doctor ID (D2)
3. Fix Campaign payload mapping (D3)
4. Add destructive confirmations (D4)
5. Add localStorage persistence (D5)
6. Fix test endpoint (D6)
7. Create company-groups-full-matrix.spec.ts
8. Expand company-groups-ui-validation.spec.ts
9. Add CG to p0-beta-gate.spec.ts
10. Optional hardening (O1-O4)

