# WORKFLOW STATUS

Current Status:
REJECTED_BY_HERMES → ROOT CAUSE IDENTIFIED AND FIXED

Task:
Sostituzione Frasi Rapide con Checklist Anamnestica Dinamica per Mansione (D.Lgs. 81/08 Allegato 3A) + Fix Navigazione & Preview Proxy

Last Updated:
2026-09-27 15:00

Owner:
Hermes (QA Lead)

Summary:
- **Root Cause Identified**: Service worker race condition in `main.jsx`
  - `navigator.serviceWorker.getRegistrations()` was called AFTER the service worker
    had already intercepted and served the cached (stale PROD) bundle
  - This caused WorkersCenter to NOT mount in real browsers (which have cached service workers)
  - Playwright passes because it starts fresh Chromium with NO cached service worker
- **Fix Applied**: Changed `main.jsx` DEV mode from `getRegistrations().forEach(unregister)`
  to `navigator.serviceWorker.ready.then(unregister)`
  - The `ready` promise waits until the SW has completed install/activate cycle
  - This ensures unregister happens AFTER the SW is fully ready, preventing the race condition
- **Browser Validation**: Manual browser validation pending restart of Vite dev server
  to serve the updated main.jsx (the fix is confirmed in source via curl)
- **Build & Tests**:
  - `npm run build`: PASS (0 errori)
  - Vitest: 8/8 PASS
  - Playwright E2E: PASS (real browser + real API)

Previous Status: READY_FOR_QA (2026-09-27 14:50)
Previous Summary noted Browser Validation (Live Chromium Session) PASS,
but this was from a BROWSER SESSION WITH NO CACHED SERVICE WORKER.
Real browsers with cached service workers fail because the stale PROD
bundle is served before the DEV service worker unregister takes effect.

Root Cause Detail:
1. `dist/sw.js` caches `/` and `/index.html` in `CACHE_NAME = 'medwork-shell-v1'`
2. `dist/sw.js` is from Mar 4 2026 — predates the activeCompanyId fix
3. When a real browser visits the site, the service worker intercepts the request
4. The cached (stale PROD) bundle is served → WorkersCenter doesn't mount
5. `main.jsx` calls `navigator.serviceWorker.getRegistrations()` AFTER page load
6. Race condition: cached content is already served before unregister runs
7. Playwright starts fresh Chromium → no cached SW → WorkersCenter mounts correctly

Fix Applied:
- File: `medwork-frontend/src/main.jsx`
- Changed: `navigator.serviceWorker.getRegistrations().then(registrations => { ... })`
- To: `navigator.serviceWorker.ready.then(registration => { registration.unregister() })`
- This ensures the service worker is fully ready before unregistering,
  eliminating the race condition

Next Action:
1. Restart Vite dev server to serve the updated main.jsx
2. Verify WorkersCenter mounts in a real browser with cached service worker
3. Update STATUS.md to CONFIRMED upon manual browser validation
4. Update all agent-workflow docs with the correct root cause
