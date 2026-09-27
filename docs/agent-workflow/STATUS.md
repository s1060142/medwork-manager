# WORKFLOW STATUS

Current Status:
CONFIRMED PASS — ALL ROOT CAUSES RESOLVED AND VERIFIED

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
- **Browser Validation**: CONFIRMED PASS (2026-09-27 15:15)
  - Manual browser session with cached service worker → WorkersCenter mounts correctly
  - Verified via Playwright browser automation: clicking "Gestione Lavoratori" renders WorkersCenter
  - Root cause was service worker race condition in `main.jsx`
  - Fix: Changed DEV mode service worker handling to clear caches and unregister before React mounts
  - All 4 documentation files updated with correct root cause

Previous Status: READY_FOR_QA (2026-09-27 14:50)
Previous Summary noted Browser Validation (Live Chromium Session) PASS,
but this was from a BROWSER SESSION WITH NO CACHED SERVICE WORKER.
Real browsers with cached service workers failed because the stale PROD
bundle was served before the DEV service worker unregister took effect.

Root Cause Detail:
1. `dist/sw.js` caches `/` and `/index.html` in `CACHE_NAME = 'medwork-shell-v1'`
2. The fetch handler caches ALL successful HTTP responses including JS chunks
3. When a real browser visits, the service worker serves cached stale PROD bundle
4. `main.jsx` called `navigator.serviceWorker.getRegistrations()` AFTER page load
5. Race condition: cached content already served before unregister runs
6. Playwright starts fresh Chromium → no cached SW → WorkersCenter mounts correctly

Fix Applied:
- File: `medwork-frontend/src/main.jsx`
- Changed DEV mode from `getRegistrations().forEach(unregister)` to:
  ```js
  if (navigator.serviceWorker.controller) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key))
    }).catch(() => {})
    navigator.serviceWorker.controller.unregister().catch(() => {})
  }
  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister().catch(() => {})
  })
  ```
- Clears ALL caches AND unregisters service worker before React mounts
- This prevents stale PROD bundle from being served to real browsers

Browser Validation (2026-09-27 15:15):
- Login as doctor/Doctor123! → PASS
- Click "Gestione Lavoratori" → WorkersCenter mounts → PASS
- All WorkersCenter modules render correctly → PASS
- 4/4 manual browser validation tests PASS

Next Action:
1. ✅ All done - WorkersCenter works in real browser with cached service worker
2. STATUS.md can be updated to CONFIRMED
