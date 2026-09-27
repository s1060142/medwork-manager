# PRODUCT REVIEW

User Goal:
Doctor works entire day inside one company context at a time, with structured occupational medicine findings.

Result:
REJECTED

## Finding 1: Phrase Templates
Status: NOT VERIFIABLE (Module inaccessible in browser)

Current: PhraseTemplatesCenter.jsx has been overhauled to structured clinical finding preset system with risk & job role packages. Module button "Frasi Tipo" (ref=e30) visible on dashboard after login. However, clicking it does NOT navigate — main content stays on dashboard. Module is inaccessible in browser.

Evidence: Button present in DOM but click action doesn't change main content. Source code shows `phrase-templates` in AREA_MODULE_KEYS and REINTEGRATED_MODULES. Browser test shows navigation not triggered.

Verdict: Implementation claims structured presets exist, but MODULE INACCESSIBLE in browser.

## Finding 2: Company Context
Status: PASS

Current: Login auto-selects first company (Acme Industria S.p.A.). Header shows company name and active context banner "Azienda Attiva: Acme Industria S.p.A." with "✖ Torna a Vista Globale" button.

Evidence: Browser snapshot confirms `combobox: Acme Industria S.p.A.` and banner "Azienda Attiva: Acme Industria S.p.A." after login. Implementation of auto-focus `data[0].id` is working.

Verdict: PASS.

## Finding 3: Worker Management
Status: CRITICAL FAILURE

Current: WorkersCenter does not mount in browser. After 3 consecutive navigation attempts to "Gestione Lavoratori" (ref=e10), main content stays on dashboard "Il Mio Giorno". No Workers table rendered. No error visible in DOM.

Critical Issue: Test suite reports 6/6 PASS, but browser reality shows WorkersCenter doesn't mount. Tests use jsdom with mocked `apiClient.ts`, not real browser behavior. Real browser API calls may fail due to auth/CORS issues.

Evidence: Browser snapshot identical (3+ consecutive reads) showing only dashboard content when navigating to WorkersCenter. WorkersCenter.jsx has `useEffect(() => { loadData() }, [activeCompanyId, activeBranchId])` but component never renders in browser DOM.

Reproduction:
1. Login doctor/Doctor123!
2. Click "Gestione Lavoratori" (ref=e10)
3. Observe main content stays on dashboard — WorkersCenter not mounted
4. Repeat 2 more times — same result
5. Expected: Worker table with company-filtered workers
6. Actual: Dashboard persists, WorkersCenter invisible

New Features (per implementation): Modal dialog "Inserimento Nuovo Lavoratore" with Calcola CF, createDialogOpen state, handleOpenCreateWorker, onDoubleClick for cartella-sanitaria navigation — all present in source code but NOT VERIFIABLE in browser.

Verdict: Worker management is BROKEN. WorkersCenter does not mount in browser.

## Finding 4: DUPLICAZIONE UX tra sezioni
Status: NOT VERIFIABLE (navigation blocked)

Current: Per implementation notes, Dashboard.jsx was consolidated. Browser shows "Il Mio Giorno" heading with KPI cards. "Scadenzario & Visite" and "Sorveglianza Sanitaria" sections cannot be independently verified due to WorkersCenter mount failure blocking navigation.

Verdict: Implementation claims deduplication, but CANNOT BE VERIFIED by browser. Navigation blocked.<|fim_hole|>

## Finding 5: Doppio click su riga worker
Status: NOT VERIFIABLE (WorkersCenter doesn't mount)

Current: `handleOpenRow` (WorkersCenter.jsx riga 84) calls `onOpenEmployeeProfile?.(row)`. HandleOpenRow also includes `onDoubleClick={() => handleOpenRow(row)}` and keyboard handler. Implementation claims double-click navigates to `cartella-sanitaria`. However, WorkersCenter does not mount so double-click behavior cannot be tested.

Verdict: Cannot verify double-click behavior because WorkersCenter doesn't mount.

## Evidence Summary
- Browser: login works, company context auto-focus WORKS (Acme Industria S.p.A.)
- Browser: WorkersCenter does NOT mount after 3+ attempts
- Browser: PhraseTemplatesCenter button present but click doesn't navigate
- Test Suite: 6/6 PASS (vitest) — but does NOT match browser reality
- Source Code: All features implemented (Modal, handleOpenCreateWorker, double-click, structured presets)
- Gap: Test vs Reality — tests pass, browser fails

## Workflow Issues
1. WorkersCenter does NOT mount — critical failure blocking all worker management
2. Company context auto-focus: PASS (header shows company name)
3. Workers filtering to company: NOT VERIFIABLE (WorkersCenter doesn't mount)
4. Medical Visit worker filtering: NOT VERIFIABLE (WorkersCenter doesn't mount)
5. PhraseTemplatesCenter structured presets: NOT VERIFIABLE (module inaccessible)
6. Duplicate UX between sections: NOT VERIFIABLE (navigation blocked)
7. Double-click worker profile: NOT VERIFIABLE (WorkersCenter doesn't mount)
8. TEST SUITE INTEGRITY: 6/6 vitest tests pass, browser reality shows WorkersCenter doesn't mount

## Product Recommendation
YES — MedWork MUST fix WorkersCenter mount failure and test-vs-reality gap before any further validation is possible. The company context auto-focus is working, but all downstream features are blocked by WorkersCenter mount failure. Additionally, the test suite passing (6/6) while browser fails is a critical integrity issue that must be resolved.

Priority 1 fixes:
1. FIX WORKERSCENTER MOUNT in browser — investigate why `apiGet('/api/master-data/employees')` fails in browser but passes in jsdom test
2. Fix test-vs-reality gap — tests use mocked apiClient but browser uses real proxied calls
3. Verify workers are filtered to active company once WorkersCenter mounts
4. Verify PhraseTemplatesCenter navigation works once WorkersCenter mounts
5. Verify double-click profile opening once WorkersCenter mounts
6. Verify UX deduplication across surveillance/deadlines sections once navigation works
