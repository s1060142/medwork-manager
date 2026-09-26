# FRONTEND UX AUDIT — MedWork Manager (v2)

> **Data audit**: 26 Settembre 2026
> **Baseline**: commit `83e1bb5` (dopo il refactor frontend `9442df52`)
> **Metodo**: esplorazione browser reale (Playwright/Chromium headless, viewport 1440×900 + 390×844), attraversamento di tutte le 6 aree e 40 moduli, screenshot + osservazioni strutturate
> **Prospettive**: Senior Product Designer · UX Architect · Occupational Health Domain Expert · Medico Competente al primo accesso · Segretaria Medica al primo accesso
> **Fuori scope** (per richiesta): backend, security, architettura

---

## 0. IL FINDING PIÙ IMPORTANTE (già risolto in questa sessione)

**"Il Mio Giorno" era stato eliminato dal refactor `9442df52`.**

- Prima di `9442df52`: area sidebar `home` → *Il Mio Giorno* (`AREA_DEFAULT_MODULE.home = 'dashboard'`) con render di `components/Dashboard.jsx` (KPI "GIUDIZI DA FIRMARE", agenda pazienti, one-click "Avvia Visita", Morning Digest).
- Dopo `9442df52`: `App.tsx` è passato da 1130 → 607 righe (−919 righe). Sono scomparse le voci `home`/`dashboard`, il caso di render `moduleKey === 'dashboard'` e **l'import di `Dashboard.jsx` rimasto orfano nel repository**.
- Effetti collaterali: 4 dei 5 test P1 (`tests/p1-improvements.spec.ts`) sono diventati rossi, insieme a ~28 componenti (Compliance Center, Giudizio Idoneità, Firma Massiva, Cartella 3A, Recall, Allegato 3B, Analytics, Migration, Global Search…) non più importati da nessuna parte.

**Azione implementata (non un TODO):**

| Modifica | File |
|---|---|
| Reintrodotto `import Dashboard` + caso di render `moduleKey === 'dashboard'` | `medwork-frontend/src/App.tsx` |
| Reintrodotta la voce `{ key: 'dashboard', label: 'Il Mio Giorno' }` in `MODULE_ITEMS` e come **prima** chip dell'area *Sorveglianza Sanitaria* | `medwork-frontend/src/App.tsx` |
| Il Medico torna ad atterrare su *Il Mio Giorno* (login e reload) | `medwork-frontend/src/App.tsx` |
| `LEGACY_MODULE_ALIASES` + `handleModuleNavigation()`: i drill-down delle card del cockpit non finiscono più su "Modulo non disponibile" | `medwork-frontend/src/App.tsx` |
| Test P1 allineato alla nuova IA (helper `openMyDay`) | `medwork-frontend/tests/p1-improvements.spec.ts` |

**Validazione eseguita**

| Verifica | Comando | Esito |
|---|---|---|
| Build produzione | `npm run build` | ✅ 2213 moduli, 16.4s |
| Unit test | `npx vitest run` | ✅ 2/2 pass |
| Regressione P1 | `npx playwright test tests/p1-improvements.spec.ts` | ✅ 2 pass (prima: 1) — test #1 *Il Mio Giorno* ora verde |
| Verifica funzionale browser | `node scripts/ux-audit-verify-myday.mjs` | ✅ **14/14 check** (landing, 4 KPI, 3 drill-down KPI, shortcut, + Nuova Visita → stepper, apertura lato Admin) |

Screenshot di prova: `screenshots/ux-audit/60-myday-restored-doctor.png`, `62-myday-restored-admin.png`.

**Decisione ancora aperta (serve il Product Owner):** i restanti 27 componenti orfani (Compliance Radar, Giudizio Idoneità, Firma Massiva, Cartella 3A, Recall, Allegato 3B, Analytics, Migration, Global Search Ctrl+K, Agenda, Scadenzari specialistici…) vanno **reintegrati nell'IA** o **rimossi dal repository**. Oggi sono codice + test che esistono ma che nessun utente può raggiungere: è il costo tecnico e di fiducia più alto emerso dall'audit.

---

## PHASE 1 — ESPLORAZIONE (prima impressione, area per area)

Viste esplorate dal vivo: **6 aree, 40 chip di modulo (Admin)**, 51 screenshot in `screenshots/ux-audit/`.

| Area | Chip | Moduli raggiungibili | Percezione |
|---|---|---|---|
| **Sorveglianza Sanitaria** | 11 (Admin) / 10 (Medico) | Il Mio Giorno, Dashboard Medico, Stepper visita, Calendario, Cartelle 3A, Registro visite, Anamnesi, Esami visita, Accertamenti, Vaccinazioni, Sopralluoghi | La più ricca e la più moderna (Dashboard Medico + Stepper) |
| **Gestione Aziende** | 9 (Medico: 3) | Aziende, Gruppi, Figure, Lavoratori, Protocolli, Scadenze, Sedi, Reparti, Luoghi di lavoro | Mista: 4 moduli sono tabelle CRUD generiche identiche tra loro |
| **Gestione Lavoratori** | 5 (Medico: 4) | Lavoratori, Lavoratori (CRUD), Rischi, Cartelle 3A, Registro visite | **Duplicazione evidente**: "Lavoratori" e "Lavoratori (CRUD)" nella stessa area |
| **Scadenzario & Visite** | 5 (Medico: 3) | Dashboard Scadenze, Scadenze & Agende, Calendario, Disponibilità medici, Log notifiche | La landing (Dashboard Scadenze) è la schermata più curata; "Disponibilità Medici" mostra tabella vuota (API in errore 500) |
| **Analisi & Relazioni** | 2 (Medico: 1, senza chip) | Reportistica & All. 3B, Audit Trail | "Centro Report" densissimo, 3 paradigmi di filtro sovrapposti |
| **Amministrazione** | 8 | Registro protocolli, Protocolli personali, Fatturazione, Cataloghi, Mansioni, Strumenti, Impostazioni, Fattori di rischio | Solo 1 modulo nativo (Fatturazione); 6 sono la stessa tabella generica |

**Login (prima impressione):** card centrata pulita, logo, "MedWork Manager / Piattaforma Professionale di Medicina del Lavoro (D.Lgs. 81/08)". Sfondo chiaro, tipografia corretta. Sembra **2023-2024**: sobrio e credibile, ma anonimo — nessun valore percepito ("perché MedWork e non carta e penna?"), e "Ricordami (30 giorni)" è una promessa non mantenuta (marketing negativo).

**Osservazioni trasversali immediatamente visibili**

1. **Doppia navigazione**: sidebar area → *strip di chip* modulo → (in alcune aree) una **seconda riga di tab** (`Gruppi Aziendali / Anagrafica Lavoratori / Protocolli Sanitari / Pianificazione Visite`). Tre livelli di navigazione per arrivare a un contenuto.
## PHASE 2 — PERCORSO MEDICO COMPETENTE

| # | Passo | Clic reali | Attrito |
|---|---|---|---|
| 1 | Apri l'app | — | Login: tenant + user + password. "Ricordami" non ha effetto: **ogni giorno si rifà il login** |
| 2 | Inizio giornata | 0 | Atterra su *Il Mio Giorno* (ripristinato): 4 KPI + agenda del giorno + 3 shortcut. **"Cosa devo fare oggi" è risolto in 1 schermata** |
| 3 | Rivedere le visite di oggi | 0→1 | KPI "VISITE IN PROGRAMMA OGGI" + tabella Agenda con orario/lavoratore/CF/azienda/mansione/tipo/stato e pulsante **Avvia Visita**. Empty state esplicativo (buono) |
| 4 | Aprire un lavoratore | 2-3 | Da `WorkersCenter` (due toolbar di filtro + **due pulsanti "Reset"**) o dalla tabella CRUD generica con header sbagliati. **Nessuna ricerca globale**: `Ctrl+K` non esiste più |
| 5 | Eseguire una visita | 2 | *Sorveglianza Sanitaria → Nuova Visita (Step)*: stepper 3 step (Anamnesi → Esame obiettivo → Giudizio), chip "Standard SIML Conforme", "Copia da ultima visita", Frasi Rapide con macro `.norm .vdt .mmc`. **La schermata migliore del prodotto** |
| 6 | Emettere il giudizio | +1 step | Step 3 dentro lo stepper. **Non esiste più un "Centro Giudizi & Firma Massiva" raggiungibile** → giudizio possibile solo a fine visita, uno per uno |
| 7 | Firmare documenti | **non raggiungibile** | `BatchSignatureCenter` / `FirmaGrafometricaCenter` non sono importati da `App.tsx`. Il KPI "GIUDIZI DA FIRMARE" porta a *Registro Visite Mediche* (alias), non alla firma massiva |
| 8 | Generare PDF | 3-4 | *Analisi & Relazioni → Reportistica & All. 3B*: 6 card "Genera PDF" + toolbar "Salva giudizi / Salva visite / Invia / Stampa" |

**Attriti principali del medico**

- 🔴 **Firma massiva e centro giudizi irraggiungibili** (funzionalità già costruita, non esposta).
- 🟠 **Chip strip tagliata**: il medico non scopre Esami / Accertamenti / Vaccinazioni.
- 🟠 **Dossier clinico laterale vuoto** finché non si seleziona il lavoratore (340px sprecati nello stepper).
- 🟡 **Attenzione divisa**: sidebar (5 voci) + chip (10) + step (3) + pannello destro: più chrome che contenuto clinico.
- 🟡 **Micro-copy da sviluppatore**: "Macro: .norm, .vdt, .mmc, .rum, .guida, .notte + Spazio".
- 🟢 Buono: **time-to-visit = 2 clic** dalla landing (verificato dal vivo).

---

## PHASE 3 — PERCORSO SEGRETERIA MEDICA

| # | Attività | Clic | Attrito rilevato |
|---|---|---|---|
| 1 | Creare azienda | 3 | *Gestione Aziende → Aziende → + Nuovo*. Form generato da `entityConfigs` (**330 label, 23 entità**), coerente e in italiano ✅ |
| 2 | Creare lavoratore | 4-6 | Due percorsi divergenti: `WorkersCenter` (filtri + tabella, due pulsanti "Reset") e `Lavoratori (CRUD)`. Campo "Sede" obbligatorio con label = indirizzo |
| 3 | Import lavoratori | **non raggiungibile** | `HrImportExportDialog` orfano; restano solo "Esporta CSV" / "Esporta dati in excel" |
| 4 | Pianificare visite | 2-3 | *Scadenze & Agende*: "Pianificazione Visite & Batch Session Planner" ✅ funziona (test P1 #4 verde) |
| 5 | Gestire scadenze | 1-2 | *Scadenzario → Dashboard Scadenze*: 4 KPI + "Alert Critici" con "Avvia Visita" ✅ (ma numeri "00" e hero invisibile) |
| 6 | Inviare comunicazioni | **non raggiungibile** | `RecallCampaignsCenter` (Morning Digest, template convocazione) e `AlertMulticanaleCenter` orfani; resta "Log notifiche" (436 righe di log) |
| 7 | Fatturare | 2 | *Amministrazione → Fatturazione* ✅ (3 KPI + 1 tabella) |

**Attriti segreteria:** duplicazione delle viste lavoratori, assenza di import HR e di campagne di convocazione, filtri delle tabelle che usano il placeholder come label (sparisce appena si scrive), nessuna selezione multipla/azione massiva sulle tabelle generiche, **nessun feedback di salvataggio** (0 `Skeleton`, nessun toast a livello shell, 9 `window.confirm()` nativi del browser).

2. **Chip strip tagliata**: a 1440px lo strip misura 1478px in un contenitore da 1142px → **336px di chip invisibili** ("Accertam…") senza scrollbar visibile. Costo: scopribilità dei moduli.
3. **Header di tabella non tradotti e sbagliati**: nelle tabelle CRUD compaiono header derivati dai nomi campo tecnici — `Company Name`, `Branch Address`, `Mansione`, `Azione` (le altre colonne sono in italiano). Peggio: la colonna **"Branch Address" mostra una data di nascita** (`01/01/1974` su tutte le righe). Un medico legge immediatamente "questo dato non è affidabile".
4. **Numeri "00"/"02"**: nelle KPI di Dashboard Scadenze i valori sono stringhe zero-padded (`00`, `02`, `10`). Sembra un contatore rotto.
5. **Testo invisibile**: nella Dashboard Scadenze il titolo *"Benvenuto in Medwork"* e il sottotitolo *"Oggi è … con N scadenze"* sono **bianco su sfondo chiaro** (contrasto ~1:1). Il blocco saluto è di fatto illeggibile.
6. **Rumore console**: 4 errori in navigazione (`useFlexGap` prop, `key` mancante nel `tbody` di `CrudEntityView`, 2× HTTP 500 su `/api/master-data/doctor-availabilities`).

---

---

## PHASE 4 — VISUAL DESIGN REVIEW

| Dimensione | Voto | Evidenza |
|---|---|---|
| **Spacing** | 6/10 | Shell coerente (padding 18px topbar, 12px content); ma convivono 3 griglie di spaziatura (MUI `spacing`, `legacy-*` px fissi, inline `sx`) |
| **Typography** | 6.5/10 | Font `Inter/Segoe UI` con scala definita in `theme.ts` (14/13/12px). Problema: gerarchia schiacciata — molti `h6`/`subtitle2` e caption 12px che competono; negli strumenti densi il testo utile è a 12-13px |
| **Hierarchy** | 4.5/10 | Breadcrumb + strip + tab + titolo pagina + titolo card duplicato (es. "Dashboard Medico" 3 volte in 1 schermata). L'occhio non sa dove atterrare |
| **Density** | 4/10 | 2 schermi con 350-436 righe di tabella (Audit Trail 436 righe in un colpo), fino a **51 pulsanti visibili** in una sola vista (Esami Visita), 11 input nella vista Lavoratori |
| **Button consistency** | 4/10 | 108 `contained` vs 352 `outlined` vs 1 `text`; pulsanti icone non standard; nelle stesse card "Genera PDF" ha **icona Save, Refresh o nulla** a seconda della riga |
| **Icon consistency** | 3.5/10 | Mix di `@mui/icons-material` (outline + filled), emoji nella UI (📅, 🌐, ✓) e icone usate con semantica sbagliata: il KPI "Anomalie protocolli" usa un'icona **Play**, "Compliance" uno **Shield** |
| **Colors** | 6/10 | Palette solida (navy `#0f1f3d`/`#113a7b`, superfici `#f4f6fa`) ma **5 KPI dello stesso peso usano 5 colori diversi** (blu, rosso, arancio, viola) + badge "Critico/A Presto/Vedi tutti" con colori arbitrari → il colore non significa più nulla |
| **Dialogs** | 5.5/10 | 157 `<Dialog>` MUI (raggio 12px coerente) ma **9 `window.confirm()`** nativi del browser per le eliminazioni: dialogo di sistema del 1995 dentro una UI MUI |
| **Tables** | 3.5/10 | Tabelle MUI corrette tecnicamente; header non tradotti/sbagliati (`Company Name`, `Branch Address`), nessuna colonna sticky, nessuna selezione multipla, nessun ordinamento visibile, paginazione in basso, nessuno stato di caricamento (skeleton) |
| **Forms** | 6/10 | `TextField small/outlined` con label flottante coerente; errori in linea buoni; ma label = placeholder nei filtri, campi "Sede" con etichetta-indirizzo, nessun aiuto contestuale/suggerimento, nessuna validazione visiva progressiva |
| **Responsiveness** | **2/10** | A 390px: `scrollWidth 532 / clientWidth 390` → **scroll orizzontale su tutta la pagina**; la sidebar diventa una riga di chip che esce dallo schermo (`width 532px`, 4 righe), nessun hamburger, tabella tagliata ("1-4 o…"), chip ruolo della topbar tagliato. **Usabile da tablet in su, non da telefono** |
| **Motion / feedback** | 3/10 | 0 `Skeleton`, transizioni 0.2s, nessuna micro-interazione su hover delle card (il cockpit le ha solo inline), nessun toast globale, spinner a tutta pagina |

### Verdetto "che anno sembra?"

**MedWork sembra un prodotto 2019-2021 con due schermate del 2024.**

- **Aspetto 2019-2021**: sidebar dark + topbar navy + strip di tab; tabelle piene; `window.confirm()`; assenza di skeleton/empty state curati; header di colonna non tradotti; densità da gestionale desktop.
- **Aspetto 2024**: `Dashboard Medico` (KPI con bordo colorato, avatar circolari, chip) e `MedicalVisitStepper` (stepper, card, macro, pannello dossier), più `Dashboard Scadenze` con "Quick Actions" e barra compliance.
- **Non è 2026** perché mancano i tre marcatori di un SaaS 2026: (1) **ricerca globale/command palette**, (2) **stati di sistema** (skeleton, toast, autosave, undo), (3) **mobile/tablet reale**.
- Il difetto percettivo numero uno non è il colore: è il **dualismo CSS** — 79 selettori nel vecchio `App.css` (`legacy-*`, 21 usi nel JSX) che convivono con MUI v7. Alcune superfici hanno raggio 8px, altre 6px, altre 12px; alcuni pulsanti sono `<button className="legacy-btn">`, altri `<Button variant="contained">`.

---


## PHASE 5 — COMPETITIVE FEELING (percepito, non funzionale)

| Modulo MedWork | vs CartSan | vs WinAspi | vs Zucchetti | vs Simpledo | Motivo |
|---|---|---|---|---|---|
| Login / avvio | SAME | SAME | WORSE | WORSE | Nessun SSO/remember-me reale, impostazione 2020 |
| Cockpit "Il Mio Giorno" | **BETTER** | **BETTER** | SAME | SAME | KPI + agenda + 1-click visita: CartSan/WinAspi non hanno un "mio giorno" così diretto |
| Dashboard Medico | **BETTER** | SAME | SAME | WORSE | Triage/readiness real-time è un differenziatore percepito |
| Stepper visita | **BETTER** | **BETTER** | SAME | WORSE | Macro anamnestiche + copia ultima visita: produttività visibile |
| Anagrafica lavoratori | WORSE | WORSE | WORSE | WORSE | Header in inglese, dati in colonna sbagliata, due viste duplicate |
| Aziende/CRUD master data | WORSE | WORSE | WORSE | WORSE | Tabelle generiche identiche, zero personalizzazione per dominio |
| Scadenzario | SAME | SAME | WORSE | WORSE | Bella la dashboard, ma "00" e hero invisibile abbassano la credibilità |
| Pianificazione massiva | **BETTER** | SAME | SAME | SAME | Batch session planner è avanti rispetto a tutti |
| Centro Report / All. 3B | SAME | SAME | WORSE | WORSE | Potente ma 3 sistemi di filtro sovrapposti |
| Centro Giudizi / Firma | **WORSE** | **WORSE** | **WORSE** | WORSE | Esiste nel DB ma **non è raggiungibile**: su questo si perde contro chiunque |
| Recall / comunicazioni | WORSE | WORSE | WORSE | WORSE | Costruito ma non esposto |
| Audit Trail / log | WORSE | SAME | WORSE | WORSE | 436 righe in una pagina, nessun filtro temporale visibile |
| Mobile / tablet | WORSE | WORSE | WORSE | WORSE | Scroll orizzontale forzato |

**Sintesi competitiva: WORSE, con due eccezioni BETTER (cockpit + stepper visita).**
Il prodotto vince dove mostra il lavoro clinico, perde dove mostra la struttura (anagrafiche, master data, amministrazione). Il problema non è la mancanza di funzioni: è che **le funzioni migliori non sono raggiungibili** e le tabelle generiche fanno sembrare "vecchio" il resto.

---

## PHASE 6 — DESIGN SYSTEM REVIEW

**Incoerenze rilevate**

1. **Pulsanti**: 3 famiglie che convivono — `legacy-btn`/`legacy-btn-secondary`/`legacy-btn-success` (CSS custom, `min-width:110px`), `<Button variant="contained|outlined">` MUI, e `<button class="legacy-module-chip">`. Raggi 6/8/999px.
2. **Dialoghi**: 157 `<Dialog>` MUI + **9 `window.confirm()`** + 1 `SignaturePadModal` custom.
3. **Tabelle**: `legacy-data-table` (CSS) + `<Table>` MUI + `EntityDataView`/`CrudEntityView` con densità e toolbar diverse.
4. **Toolbar di filtro**: 3 pattern — riga "Cerca + Aggiorna + Nuovo + Esporta CSV + Filtro avanzato" (CRUD), riga a placeholder senza label (WorkersCenter), riga mista a 2 livelli (Centro Report).
5. **Navigazione**: 2 pattern di tab (`.legacy-tab` e `.legacy-module-chip`) nella stessa schermata.
6. **Feedback**: 70 `CircularProgress` sparsi, **0 `Skeleton`**, nessun toast globale, 4 errori React in console.
7. **Token**: `theme.ts` definisce palette/raggi, ma `App.css` ridefinisce gli stessi colori (`.legacy-*`), quindi i token non sono la fonte di verità.

### DESIGN SYSTEM IMPROVEMENTS

1. **`design/` unico**: mantenere `theme.ts` come unica fonte (colori, raggi, spacing 4/8/12/16/24, elevazioni). Eliminare i valori hardcoded `#113a7b`, `#0f1f3d`, `1px solid #e5e8ef` dai componenti.
2. **`AppButton`** (`primary | secondary | ghost | danger`, `sm | md`, `loading`), **`AppToolbar`**, **`AppTable`** (header sticky, sorting, selezione multipla, skeleton, empty state), **`AppConfirmDialog`** (sostituisce i 9 `window.confirm`), **`AppFiltersBar`**, **`AppToast`** (successo/errore globale), **`AppPageHeader`** (breadcrumb + titolo + azioni).
3. **Rimuovere le classi `legacy-*`** dai componenti: sono la causa principale della sensazione "2020".
4. **Stati obbligatori per ogni schermata**: `loading` (skeleton), `empty` (illustrazione + azione), `error` (retry), `no-permission`.
5. **Localizzazione dei dati**: nessun header derivato da nomi campo tecnici (`keyToLabel` in `CrudEntityView` deve usare `entityConfigs.fields[].label`, non il nome API).
6. **Densità controllata**: `dense` di default sulle tabelle, max 8-10 colonne visibili, colonne secondarie in un "dettaglio" laterale.


---

## PHASE 7 — TOP 20 UX IMPROVEMENTS

Ordinati per **impatto utente × sforzo** (1-2 = quick win, 3 = media, 4-5 = strutturale).

| # | Problema | Raccomandazione | Sforzo | Guadagno atteso |
|---|---|---|---|---|
| 1 | 27 moduli già costruiti (firma massiva, centro giudizi, recall, import HR, search) non raggiungibili | Reintegrarli in `MODULE_ITEMS`/`AREA_MODULE_KEYS` o eliminarli. Nessun'altra azione ha questo ritorno | 4 | Recupera ~1/3 del prodotto + 3 test rossi |
| 2 | "Il Mio Giorno" era scomparso | ✅ **Fatto in questa sessione** (landing medico + chip + alias di navigazione) | 1 | Ripristina il cockpit del medico |
| 3 | Chip strip tagliata (336px invisibili) | Chip con `overflow` visibile + frecce di scroll, oppure selettore a tendina del modulo; ordinare per frequenza d'uso | 2 | Scopribilità di 4-5 moduli per area |
| 4 | Header tabella in inglese + dato nella colonna sbagliata | Usare le label di `entityConfigs` per tutte le colonne e correggere il mapping dei valori | 1 | **Credibilità clinica**: un dato sbagliato in anagrafica distrugge la fiducia |
| 5 | Hero della Dashboard Scadenze illeggibile (bianco su bianco) | Colore testo scuro o sfondo scuro | 1 | 15 minuti, elimina la prima impressione "rotta" |
| 6 | Numeri "00"/"02" nei KPI | Formattazione numerica (`Intl.NumberFormat`) e assenza di zero-padding | 1 | Percezione di prodotto finito |
| 7 | Nessuna ricerca globale (`Ctrl+K` perso) | Ripristinare `GlobalSearchModal` + scorciatoia globale (lavoratore, azienda, azione) | 3 | -50% tempo "trova il paziente" (il medico lavora per nome) |
| 8 | `window.confirm()` per le eliminazioni | `AppConfirmDialog` uniforme + messaggio con nome entità e conseguenza | 1 | Coerenza + sicurezza percepita |
| 9 | Nessun feedback di salvataggio | Toast globale + autosave bozza nello stepper con indicatore "Salvato 12:04" | 3 | Elimina il "il mio click ha funzionato?" |
| 10 | Doppia vista lavoratori / doppio "Reset" | Un solo modulo Lavoratori (lista + dettaglio), eliminare `employees-crud` dall'area | 2 | -1 navigazione, -2 click per lavoratore |
| 11 | "Disponibilità Medici" mostra tabella vuota (HTTP 500) | Correggere l'endpoint o nascondere lo stato vuoto con messaggio/retry | 2 | Rimuove una schermata rotta |
| 12 | 51 pulsanti in una vista (Esami Visita), 436 righe (Audit) | Toolbar primaria + "azioni" in menu overflow; paginazione e filtri temporali di default | 3 | Riduce il carico cognitivo dei moduli densi |
| 13 | Icone con semantica sbagliata (Play su "Anomalie", Save su "Genera PDF") | Set icone coerente + regola: 1 icona = 1 significato | 1 | Percezione di rifinitura |
| 14 | Colori senza significato (5 KPI = 5 colori, badge arbitrari) | Usare colore solo per stato (ok/warn/critical) | 2 | Gerarchia leggibile in 2 secondi |
| 15 | Mobile/tablet inutilizzabile (scroll orizzontale) | Hamburger + sidebar drawer, tabelle a card su <768px, topbar compressa | 4 | Visite in azienda con tablet = differenziatore |
| 16 | Login: "Ricordami (30 giorni)" non funziona | Implementare il refresh token o rimuovere l'opzione | 2 | Fiducia + meno attrito quotidiano (era nel backlog B4) |
| 17 | Stepper: pannello "Dossier Clinico" vuoto | Mostrare dati del lavoratore già nel passo 1 (rischi, ultima visita, scadenze) | 3 | Meno cambi di contesto durante la visita |
| 18 | Centro Report: 3 paradigmi di filtro sovrapposti | Un solo pannello filtri a scomparsa + filtri salvati | 3 | Report in 2 clic invece di 6 |
| 19 | Micro-copy tecnica ("Macro: .norm …") | Tooltip/legenda in linguaggio clinico + comando rapido sulla tastiera | 1 | Adozione reale delle macro |
| 20 | Bundle monolitico 1.43 MB (431 kB gzip), nessun code-splitting | `React.lazy` per area/modulo + manualChunks | 3 | Primo paint più rapido su reti sanitarie lente |

---

## FINAL DELIVERABLE — SINTESI

| Metrica | Voto | Nota |
|---|---|---|
| **First Impression Score** | **6.5/10** | Login credibile e pulito; la prima schermata dopo il login (Admin) è una tabella generica |
| **Visual Quality Score** | **6.0/10** | MUI v7 + `theme.ts` moderni, ma contaminati da 79 selettori `legacy-*` e da 5 tipi di raggio bordo |
| **Usability Score** | **5.5/10** | Tutto è raggiungibile in 2-3 clic, ma la scopribilità è bassa (chip tagliata, aree quasi vuote per ruolo, nessuna ricerca) |
| **Physician Productivity Score** | **6.5/10** | Cockpit + stepper sono forti; mancano firma massiva, ricovero storico e mobile |
| **Secretary Productivity Score** | **4.5/10** | Import HR, recall e azioni massive assenti; anagrafiche duplicate e con header errati |
| **Information Architecture Score** | **4.5/10** | 6 aree × 3 livelli di navigazione, 4 moduli duplicati, un'area con 1 solo modulo per il medico, 27 moduli orfani |
| **Design System Score** | **4.0/10** | Nessun `AppTable`/`AppButton`/`AppToast`; token duplicati tra `theme.ts` e `App.css`; `window.confirm` e 0 skeleton |
| **Competitive Position** | **WORSE** (con 2 eccezioni BETTER: cockpit Il Mio Giorno, stepper visita) | Si perde dove l'app mostra struttura, si vince dove mostra clinica |


### Screens That Need Redesign

| Priorità | Schermata | Perché | Intervento |
|---|---|---|---|
| P0 | **Tabelle CRUD generiche** (`CrudEntityView`: Aziende, Sedi, Reparti, Mansioni, Cataloghi, Fattori di rischio…) | Header in inglese, dato nella colonna sbagliata, toolbar rumorosa, nessun ordinamento/selezione | `AppTable` + label da `entityConfigs` + toolbar primaria |
| P0 | **Anagrafica Lavoratori** (`WorkersCenter`) | Due toolbar di filtro, due "Reset", due tabelle sovrapposte nella stessa vista | Una sola vista: filtri compatti + tabella densa + drawer dettaglio |
| P1 | **Centro Report** (`ReportsCenter`) | 3 sistemi di filtro, pulsanti senza testo ("S…"), icone incoerenti | Pannello filtri a scomparsa + card report + filtri salvati |
| P1 | **Dashboard Scadenze** | Hero illeggibile, numeri "00", badge decorativi | Fix contrasto + formattazione + KPI con semantica chiara |
| P1 | **Area "Gestione Aziende" per il Medico** | Mostra 3 moduli su 9 e "Sede" con label errata | Rivedere il filtro per ruolo e le label |
| P2 | **Audit Trail** | 436 righe in una pagina, nessun filtro temporale | Filtri + paginazione + raggruppamento per giorno/utente |
| P2 | **Amministrazione** | 8 chip, 6 sono la stessa tabella | Riorganizzare in "Master data / Sistema" con sottovoci |

### Quick Wins (< 1 giorno)

1. ~~Ripristinare **"Il Mio Giorno"** come landing del medico~~ ✅ **fatto** (con alias di navigazione anti-vicolo-cieco).
2. Hero della Dashboard Scadenze: contrasto testo (1 riga CSS).
3. Formattazione KPI: togliere lo zero-padding (`00` → `0`).
4. Header di tabella: usare `fields[].label` invece di `keyToLabel` (e correggere il mapping della colonna).
5. Chip strip: frecce di scorrimento visibili + `padding-right`.
6. `AppConfirmDialog` che sostituisce i 9 `window.confirm()`.
7. Fix `key` mancante nel `tbody` di `CrudEntityView` (errore React in console).
8. Rimuovere l'opzione "Ricordami (30 giorni)" finché non è implementata (o implementarla: era backlog B4).
9. Unificare le icone di "Genera PDF" e dei KPI (1 icona = 1 significato).
10. Rinominare "Nuova Visita (Step)" in "Nuova Visita" e "Lavoratori (CRUD)" in "Elenco Lavoratori".

### High Impact Improvements (1-5 giorni)

1. **Reintegrare o eliminare i 27 moduli orfani** (con priorità: Centro Giudizi/Firma Massiva, Recall, Import HR, Ricerca Globale Ctrl+K) — decisione di prodotto + 1-3 giorni di wiring.
2. **`AppTable` + `AppToolbar` + `AppToast`** come componenti riusabili e migrazione delle 6 tabelle generiche.
3. **Stato di sistema**: skeleton, empty state illustrati, retry sugli errori (oggi 1 endpoint in 500 = tabella vuota senza spiegazione).
4. **Ricerca globale + command palette** (`Ctrl+K`) con azioni ("nuova visita per <lavoratore>", "nuova azienda").
5. **Feedback di salvataggio**: toast + autosave bozza nello stepper (con timestamp "Salvato 12:04").
6. **Fix responsive tablet** (hamburger + drawer + tabelle card <768px): abilita le visite in azienda.
7. **Code splitting per area** (bundle 1.43 MB → import dinamici).

### Major UX Refactoring

1. **Architettura dell'informazione**: da 6 aree × 3 livelli a 1 sidebar a 2 livelli (area → modulo) con **moduli guidati dal ruolo** e azioni frequenti in alto. Le aree per il medico non devono mai essere vuote (oggi "Analisi & Relazioni" ha 1 modulo e nessuno strip).
2. **Design system applicato**: rimuovere le classi `legacy-*`, un solo set di token, un solo `AppButton`.
3. **Densità clinica**: introdurre un pattern "lista + dettaglio" (master-detail) al posto delle tabelle da 40 colonne, e un pannello paziente persistente durante la visita.
4. **Mobile/tablet-first per il sopralluogo e la visita in sede**.

---

### La domanda più importante

> **Se un medico vede MedWork per la prima volta domani, cosa appare immediatamente datato, confuso o inferiore ai SaaS moderni?**

**In ordine di impatto percettivo:**

1. **Le tabelle.** Header `Company Name` / `Branch Address` con dentro date di nascita, toolbar con 5 pulsanti identici, nessun ordinamento visibile, nessuna selezione multipla. È la prima cosa che un medico guarda dopo il login admin ed è la più vecchia del prodotto. Sembra **2015**.
2. **La navigazione a tre livelli.** Sidebar → strip di chip (per giunta tagliata) → seconda riga di tab, con la stessa voce "Lavoratori" in due aree e "Lavoratori (CRUD)" come nome di una schermata. Un medico non sa dove si trova e non trova ciò che cerca senza leggere tutto. Sembra **prodotto costruito per reparto, non per ruolo**.
3. **Ciò che manca e che gli altri hanno.** Nessuna ricerca globale, nessuna firma massiva, nessun centro giudizi: arriva dal medico che "i miei 6 giudizi da firmare li firmo uno per uno?". La promessa "GIUDIZI DA FIRMARE 5" senza un pulsante che li firmi è peggio di non mostrarla.
4. **I segnali di non-finito**: "00" nei KPI, il saluto bianco su fondo bianco, `window.confirm()` del browser per cancellare un'azienda, nessuno skeleton al caricamento. Sono i classici dettagli che fanno dire **"software interno"** invece di "prodotto".
5. **Il telefono/tablet.** Il medico che apre MedWork su iPad durante un sopralluogo trova scroll orizzontale e menu fuori schermo: **non è utilizzabile**, e nel 2026 questo è un giudizio immediato.

**Cosa invece funziona e va protetto:** *Il Mio Giorno* (cockpit con KPI, agenda e "Avvia Visita" in 1 clic), *Dashboard Medico* (triage/readiness), *Nuova Visita (Step)* (macros anamnestiche, copia ultima visita, standard SIML) e il *Batch Session Planner* dello scadenzario. Questi 4 moduli sono **più avanti di CartSan e WinAspi**: il problema è che oggi il medico non li vede tutti dallo stesso posto.


---

## APPENDICE — METODOLOGIA, ARTEFATTI, LIMITI

### Strumenti effettivamente usati

- **Playwright 1.62 (Chromium headless)** — esplorazione browser reale di tutte le aree/moduli, 1440×900 e 390×844.
  Nota: `agent-browser@^0.38.1` è dichiarato in `medwork-frontend/package.json` ma **non è installato** nel repository (`node_modules/agent-browser` assente): è stata usata la suite Playwright già presente.
- **Harness di audit** (aggiunti in questa sessione, riutilizzabili):
  - `medwork-frontend/scripts/ux-audit-explore.mjs` (51 screenshot + `observations.json`)
  - `medwork-frontend/scripts/ux-audit-http.mjs` (raccolta richieste ≥400)
  - `medwork-frontend/scripts/ux-audit-doctor-ia.mjs` (IA per ruolo + misura overflow chip strip)
  - `medwork-frontend/scripts/ux-audit-verify-myday.mjs` (verifica funzionale del ripristino)
- **Test esistenti** eseguiti come controprova: `vitest run` (2/2 ✅), `playwright test tests/p1-improvements.spec.ts` (2 pass / 3 fail).

### Evidenze prodotte

- Screenshot: `screenshots/ux-audit/00-login.png` … `62-myday-restored-admin.png` (51 + 3 file).
- Dati strutturati: `screenshots/ux-audit/observations.json`, `screenshots/ux-audit/http-failures.json`.
- Errori console raccolti: `useFlexGap` prop, `key` mancante in `tbody` (`CrudEntityView`), 2× `500 /api/master-data/doctor-availabilities`.

### Riproduzione

```powershell
# backend + frontend (SQLite locale)
.\start-medwork.ps1
# audit
cd medwork-frontend
node scripts/ux-audit-explore.mjs
node scripts/ux-audit-doctor-ia.mjs
node scripts/ux-audit-verify-myday.mjs
```

### Limiti

- Audit condotto su **dati di test** (5 lavoratori, 3 aziende): i giudizi sulla densità delle tabelle sono stati integrati con la lettura del codice (`entityConfigs` 330 label, Audit Trail 436 righe), non con volumi reali.
- Nessun test di usabilità con utenti reali: il "percepito" è quello di un valutatore esperto di dominio.
- Non sono stati valutati: backend, sicurezza, multi-tenancy, performance API (fuori scope), né i PDF generati.
- Il comportamento sotto carico (500+ lavoratori) non è verificabile con il dataset di test.

