# QA REVIEW

Reviewer:
Hermes

Browser Validation:

FAIL

Evidence:

1. Company Context auto-focus: PASS. Login auto-selects first company (Acme Industria S.p.A.). Header shows "Acme Industria S.p.A." not "🌐 Tutte le Aziende (Globale)". Context banner shows "Azienda Attiva: Acme Industria S.p.A." with "✖ Torna a Vista Globale" button. WORKING.

2. WorkersCenter MOUNT: STILL FAILING in browser after 3 navigation attempts to "Gestione Lavoratori" (ref=e10). Main content stays on dashboard. WorkersCenter component does not render in browser DOM. Test suite reports PASS (6/6) but browser reality contradicts — WorkersCenter not mounting.

3. Workers filtering: NOT VERIFIABLE — WorkersCenter does not mount in browser, cannot test whether workers are filtered to Company A.

4. Medical Visit worker filtering: NOT VERIFIABLE — cannot reach MedicalVisitStepper due to WorkersCenter failure.

5. PhraseTemplatesCenter: Module button "Frasi Tipo" (ref=e30) visible on dashboard after login, but clicking it does NOT navigate — main content stays on dashboard. Module inaccessible.

6. Navigation SIMPLIFICATION: FAILED. "Gestione Lavoratori" button (ref=e10) does not load WorkersCenter in browser. "Frasi Tipo" button (ref=e30) does not navigate to PhraseTemplatesCenter. Module navigation is broken in browser but tests pass in jsdom.

7. Duplicate company selector: RESOLVED in App.tsx header.

8. WorkersCenter NEW features implemented (per 02_IMPLEMENTATION.md): Modal dialog "Inserimento Nuovo Lavoratore" with Calcola CF, handleOpenCreateWorker, createDialogOpen state, onDoubleClick handler to navigate to cartella-sanitaria — all present in source code but NOT VERIFIABLE in browser because WorkersCenter doesn't mount.

Critical Finding: TEST SUITE LIES. `npx vitest run` passes 6/6 tests but WorkersCenter doesn't mount in browser. Tests use jsdom with mocked API (apiClient.ts mocked), not real browser behavior. The mock returns employees data successfully, but real browser API calls fail silently. WorkersCenter relies on `apiGet('/api/master-data/employees?includeArchived=true&pageSize=1000')` — this call may be failing in the real browser due to CORS/auth issues.

Reproduction Steps:
1. Login as doctor/Doctor123!
2. Verify header shows "Acme Industria S.p.A." — PASS
3. Click "Gestione Lavoratori" (ref=e10) — WorkersCenter DOES NOT MOUNT (FAIL)
4. Click "Frasi Tipo" (ref=e30) — PhraseTemplatesCenter DOES NOT LOAD (FAIL)
5. Expected: WorkersCenter table with workers, PhraseTemplatesCenter modal
6. Actual: Dashboard persists, no module content

Test Suite Analysis:
- 6/6 tests PASS in jsdom (vitest)
- Tests mock `apiClient.ts` — returns hardcoded data
- Tests render `<App />` directly without login flow
- Tests set localStorage with `activeCompanyId: '1'`
- Real browser login does NOT set localStorage correctly (different auth mechanism)
- WorkersCenter's `useEffect(() => { loadData() }, [activeCompanyId])` depends on activeCompanyId being set correctly — may fail if auth token missing

Screenshots:
- browser_screenshot_e5f7d8240d58437d8a110b177f98d116.png: Dashboard with Acme Industria context
- browser_screenshot after clicking Gestione Lavoratori 3 times: still dashboard — WorkersCenter not mounted
- browser_screenshot after clicking Frasi Tipo: still dashboard — PhraseTemplatesCenter not loaded

Verdict:

REJECTED

Critical Issue: Test suite (6/6 PASS) does not match browser reality (WorkersCenter doesn't mount). This is a test-vs-reality gap that must be resolved before approval.

Partial PASS: Company Context auto-focus works correctly in browser.

All 6 task verification questions:
1. Duplicate company selector? → RESOLVED (header shows company name)
2. Workers filtered to Company A? → NOT VERIFIABLE (WorkersCenter doesn't mount)
3. Medical Visit filtered to Company A? → NOT VERIFIABLE (WorkersCenter doesn't mount)
4. Remaining local filters? → NOT VERIFIABLE (WorkersCenter doesn't mount)
5. PhraseTemplatesCenter improved? → NOT VERIFIABLE (button present but click doesn't navigate)
6. Navigation simpler? → FAILED (WorkersCenter and PhraseTemplatesCenter both don't navigate)

Test Suite Integrity Issue: 6/6 vitest tests pass, but WorkersCenter doesn't mount in browser. The test mocks return data successfully while real browser API fails silently. This discrepancy must be investigated before any approval.
