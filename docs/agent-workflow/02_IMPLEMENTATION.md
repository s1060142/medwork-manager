# IMPLEMENTATION

Status:
READY FOR QA

Files Modified / Created:

- [medwork-frontend/src/components/MedicalVisitStepper.jsx](file:///c:/github/medwork-manager/medwork-frontend/src/components/MedicalVisitStepper.jsx) *(Checklist clinica precompilata dinamica per mansione/rischi D.Lgs. 81/08 Allegato 3A)*
- [medwork-frontend/src/components/WorkerFormDialog.jsx](file:///c:/github/medwork-manager/medwork-frontend/src/components/WorkerFormDialog.jsx) *(Form unico unificato per creazione e modifica lavoratore)*
- [medwork-frontend/src/components/WorkersCenter.jsx](file:///c:/github/medwork-manager/medwork-frontend/src/components/WorkersCenter.jsx)
- [medwork-frontend/src/components/CrudEntityView.jsx](file:///c:/github/medwork-manager/medwork-frontend/src/components/CrudEntityView.jsx)
- [medwork-frontend/src/App.tsx](file:///c:/github/medwork-manager/medwork-frontend/src/App.tsx)
- [medwork-frontend/src/App.test.jsx](file:///c:/github/medwork-manager/medwork-frontend/src/App.test.jsx)
- [medwork-frontend/tests/debug-auth-workers.spec.ts](file:///c:/github/medwork-manager/medwork-frontend/tests/debug-auth-workers.spec.ts)

Implementation Notes:

1. **Checklist Anamnestica Dinamica Precompilata per Mansione & Rischi (D.Lgs. 81/08 Allegato 3A)**:
   - Sostituito il vecchio dropdown generico *"Frasi Rapide & Template Anamnestici"* in [MedicalVisitStepper.jsx](file:///c:/github/medwork-manager/medwork-frontend/src/components/MedicalVisitStepper.jsx) con un pannello clinico intelligente basato su mansione e fattori di rischio occupazionali:
     - **💻 Videoterminale (VDT)**: Assenza astenopia e disturbi visivi, assenza cervico-brachialgie/lombalgie posturali, rispetto pause ergonomiche (15 min ogni 120 min).
     - **📦 Movimentazione Carichi (MMC)**: Negativa per lombalgie/sciatalgie da sovraccarico biomeccanico, nessun pregresso intervento ernia discale, corretta applicazione tecniche e ausili meccanici.
     - **🔊 Rumore & Vibrazioni**: Assenza acufeni o ipoacusia soggettiva riferita, uso costante DPI uditivi (otoprotettori SNR adeguato), assenza disturbi angio-neurologici (Raynaud / HAVS).
     - **🧪 Agenti Chimici & Polveri**: Assenza sintomi respiratori o iperreattività bronchiale, cute integra senza dermatiti da contatto, uso regolare DPI respiratori e guanti.
     - **🌙 Lavoro Notturno & Turni**: Qualità del sonno adeguata senza disadattamento al turno, assenza disturbi gastrointestinali o metabolici correlati.
     - **🚜 Guida & Macchine / Quota**: Assenza vertigini/lipotimie/disturbi equilibrio, non assunzione farmaci sedativi o alcolici/sostanze incompatibili, integrità visiva e coordinazione per guida/quota.
     - **🩺 Negatività Generale**: Anamnesi patologica remota e prossima negativa per patologie croniche/degenerative, nessuna terapia cronica, abitudini di vita regolari.
   - **Riconoscimento Automatico Mansione**: All'apertura della visita, il sistema analizza la mansione del lavoratore (`employeeContext?.jobRole` o `emp?.jobRole`) e pre-seleziona ed evidenzia con badge `★ Suggerito` la categoria di rischio corrispondente.
   - **Compilazione 1-Click e Toggles Individuali**:
     - Pulsante `⚡ Applica check standard ({Categoria})`: popola istantaneamente tutti i riscontri standard nei rispettivi campi (`workHistory` o `personalHistory`).
     - Checkbox interattive individuali con feedback visivo verde (`#f0fdf4` / `#86efac`) per aggiungere/rimuovere singoli riscontri clinici con 0 digitazione da tastiera.

2. **Rimozione Voci Obsolete "Frasi Tipo" (`phrase-templates`)**:
   - Rimosso `phrase-templates` da `MODULE_ITEMS`, `AREA_MODULE_KEYS`, `doctorAllowed` e `REINTEGRATED_MODULES` in [App.tsx](file:///c:/github/medwork-manager/medwork-frontend/src/App.tsx).

3. **Quick Actions Panel in Gestione Lavoratori (`WorkersCenter.jsx`)**:
   - Pannello **⚡ Quick Actions** nella landing page dei lavoratori: *Nuova Visita Medica*, *Nuovo Lavoratore*, *Ricarica dati* e chip di riepilogo metriche (Totale, Attivi, Idonei, Visite Scadute, In Scadenza a 30gg).

4. **Unico Form Unificato Lavoratore (`WorkerFormDialog.jsx`)**:
   - Modale unificato per nuovo lavoratore e modifica anagrafica esistente con calcolatore automatico di Codice Fiscale.

5. **Rimozione Barra Tab Duplicata in Gestione Aziende (`App.tsx`)**:
   - Eliminata la barra tab legacy secondaria in Gestione Aziende.

6. **Risoluzione Autenticazione & 401 Unauthorized Root Cause**:
   - Gestione pulita e reattiva dei token scaduti con reset automatico della sessione ed emissione dell'evento `medwork:auth-expired`.

Build Results:
- `npm run build` (Vite production bundle): PASS (12953 modules transformed in 46.25s, exit code 0)

Test Results:
- `npm test` (Vitest test suite): PASS (8/8 tests passing in 27.48s)
- `npx playwright test tests/debug-auth-workers.spec.ts` (Playwright Chromium E2E): PASS (1/1 passed in 15.0s)