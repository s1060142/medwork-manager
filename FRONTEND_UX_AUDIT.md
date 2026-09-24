# FRONTEND UX AUDIT — MedWork Manager

> **Data audit**: 24 Settembre 2026  
> **Sviluppatore**: Senior Product Designer · UX Architect · Occupational Health Domain Expert  
> **Perspective**: Physician (first-time) · Medical Secretary (first-time)  
> **Stack**: React 19 + MUI v7 + Emotion + Vite + TypeScript  
> **Screenshot dir**: `/screenshots/`

---

## RIEPILOGO ESCO

| Metrica | Voto |
|---|---|
| **First Impression Score** | ⚠️ 6/10 — Funziona ma sembra software da laboratorio |
| **Visual Quality Score** | 6.5/10 — MUI è decente ma custom legacy CSS rompe l'uniformità |
| **Usability Score** | 5/10 — Tabelle massive, dual-filter confusione, troppi click |
| **Physician Productivity** | 5.5/10 — Stepper funziona ma mancano shortcut e scorciatoie contestuali |
| **Secretary Productivity** | 5/10 — Import/export presenti ma workflow frammentati |
| **Information Architecture** | 5.5/10 — 6 aree con ~50 moduli, gerarchia poco chiara |
| **Design System Score** | 4/10 — `legacy-*` classi ovunque, pattern duplicati, zero token coerenti |
| **Competitive Position** | **WORSE** rispetto a CartSan, WinAspi, Zucchetti, Simpledo percepiti |

---

## PHASE 1 - ESPLORAZIONE: PRIMA IMPRESSIONE

### Cosa ho visto (primo accesso)

**Login Screen:**
- Titolo: "Gestionale Medicina del Lavoro" — funzionale ma impersonale
- Sottotitolo: "Accesso alla piattaforma amministrativa e sanitaria"
- Layout: Paper card centralizzato, sfondo gradiente blu
- Elementi: Tenant selector, Username, Password, "Ricordami", "Password dimenticata?"
- **Prima impressione**: un gestionale medico di 10 anni fa. Non SaaS. Non cloud-native.

**Dashboard (Il Mio Giorno):**
- Layout a 3 colonne di KPI: "6 GIUDIZI DA FIRMARE", "0 SCADENZE VISITE (7 GG)", "COMPLIANCE 100%"
- Agenda del giorno con righe vuote a "00:00" (orari tutti uguali — bug o placeholder?)
- Azioni: "+ Nuova Visita Medica", "Morning Digest", "Aggiorna dati"
- **Percezione**: dashboard informativa ma non accattivante

**Navigazione laterale:**
- 6 voci: Il Mio Giorno, Gestione aziende, Gestione lavoratori, Analisi e relazioni, Sorveglianza sanitaria, Scadenzario, Amministrazione
- Sidebar scura (#0b1b36) con hover blu
- **Percezione**: sidebar dark è trendy ma le icone MUI standard sembrano fuori posto

**Topbar:**
- 7+ azioni: Cerca (Ctrl+K), Notifiche, ChangeLog, Manuale, Profilo, Logout, Esporta CSV, Esporta Excel
- **Problema**: troppi elementi nella topbar, userà confusione tra "ChangeLog" e "Manuale"

### Valutazione UX Complessiva Fase 1

| Aspetto | Stato | Note |
|---|---|---|
| First Impression | ⚠️ Discreta | Non brutta, ma non ispira fiducia moderna |
| Visual Polish | ⚠️ Discreta | MUI v7 è moderno ma custom CSS "legacy" rovina l'effetto |
| Clarity | ⚠️ Discreta | Le etichette sono chiare ma la densità è alta |
| Discoverability | ⚠️ Scarsa | Non si capisce subito dove trovare "Nuova visita" |
| Usability | ⚠️ Discreta | Funziona ma non è intuitivo |

---

## PHASE 2 - PERCORSO MEDICO

### 2.1 Apertura applicazione → Inizio giornata

1. **Login** (1 minuto): Selezione tenant → username → password → Accedi
2. **Dashboard "Il Mio Giorno"** (auto-redirect): KPI + agenda del giorno

**Friction Points:**
- ⚠️ **Nessun onboarding**: il medico vede la dashboard senza contesto — cosa deve fare oggi?
- ⚠️ **"00:00" in agenda**: tutti gli appuntamenti mostrano orario 00:00 — dato sbagliato o placeholder?
- ⚠️ **Nessun riassunto mattutino**: non dice "Hai 6 giudizi da firmare" in modo prominente
- ⚠️ **"Morning Digest"**: non è chiaro cosa faccia questo bottone

### 2.2 Apertura di un lavoratore

1. **Opzione A**: Gestione Lavoratori → tabella con ~10 colonne → click su "Profilo"
2. **Opzione B**: Cerca (Ctrl+K) → seleziona lavoratore → "Profilo"
3. **Opzione C**: Cerca → "Avvia Visita" → diretto allo stepper

**Friction Points:**
- ⚠️ **3 modi diversi per aprire un lavoratore** — confusione su quale usare
- ⚠️ **La tabella lavoratori mostra un bottone gigante** per ogni riga con tutte le info in un'unica cella — "001 - Acme Industria S.p.A. - 1 Via dell'Industria..." — questo è un bottone? Non una riga tabella?
- ⚠️ **"Copia da ultima visita"** è disabled senza selezionare un medico — perché?
- ⚠️ **Dual filter**: la pagina lavoratori ha due aree di filtro separate (aziende in alto, lavoratori in basso) — perché?

### 2.3 Esecuzione di una visita

**Stepper a 2 step (indicato da "Indietro / Avanti"):**

**Step 1 - Dati visita:**
- Standard SIML Conforme (checkbox)
- Lavoratore in Visita (dropdown)
- Medico Competente (dropdown)
- Data Visita (date picker)
- Periodica + Tipo Visita Medica
- Frasi Rapide & Template Anamnestici (dropdown)
- 4 aree anamnesi: Lavorativa, Personale, Familiare, Patologie Remote

**Step 2 (dopo Avanti):**
- Dossier Clinico Lavoratore (heading ma contenuto non chiaro dalla snapshot)

**Friction Points:**
- ⚠️ **Stepper solo a 2 step** — per una visita medica completa, sembra troppo poco
- ⚠️ **Nessun progresso visivo** — non si vede quanto manca (Step 1 di 3?)
- ⚠️ **"Copia da ultima visita"** disabled — l'utente non sa perché
- ⚠️ **"Tutto N.D.P. (Nella Norma)"** button — cosa significa N.D.P.? Non è spiegato
- ⚠️ **Focus chips** (Rachide/MMC, Udito/Rumore) — bello come UX pattern, ma sono nascosti nel testo dei test Playwright, non facilmente discoverable
- ⚠️ **Nessun salvataggio automatico** — se il medico chiude la tab, perde tutto

### 2.4 Firma giudizi e documenti

- **"GIUDIZI DA FIRMARE"** (6) nel KPI dashboard
- **"Firma Multipla Digitale →"** link
- **"Centro Giudizi & Firma Massiva"** tab nella sezione salute
- **BatchSignatureCenter** componente

**Friction Points:**
- ⚠️ **"Firma Multipla"** non è chiaro se firma digitale o firma grafometrica
- ⚠️ **"FirmaGrafometricaCenter"** esiste come componente separato — c'è duplicazione?
- ⚠️ **Nessun preview prima della firma** — il medico non può revisionare prima di firmare

### 2.5 Generazione PDF

- **jspdf + jspdf-autotable** nelle dipendenze
- **"Stampa"** button presente in molte tabelle
- **"Esporta dati in excel"** button

**Friction Points:**
- ⚠️ **"Stampa"** usa la stampante di sistema — un PDF non è esportabile con un click?
- ⚠️ **Nessun anteprima PDF** prima dell'esportazione
- ⚠️ **"Esporta dati in excel"** — 2 pulsanti separati (CSV e Excel) — perché non uno solo?

---

## PHASE 3 - PERCORSO SEGGRETERIA MEDICA

### 3.1 Creazione azienda

1. **Gestione aziende** → **"Nuova azienda"** button
2. **CrudEntityView** con ~40 colonne (tabella companies)
3. Campi visibili: Nome Azienda, Gruppo Aziendale, Medico Competente, Ragione Sociale, Partita IVA, Codice Fiscale, Codice ATECO, Attività, ecc.

**Friction Points:**
- ⚠️ **~40 colonne nella tabella companies** — impossibile visualizzare tutto su uno schermo
- ⚠️ **"Nuova azienda"** non ha un wizard guidato — è un form inline?
- ⚠️ **Nessuna immagine/logo dell'azienda** — è un gestionale puro senza branding

### 3.2 Creazione lavoratori

1. **Gestione lavoratori** → **"+ Nuovo lavoratore"** o **"Aggiungi"** button
2. **WorkersCenter** + **CrudEntityView** (hidden UI)
3. **HrImportExportDialog** per import

**Friction Points:**
- ⚠️ **Doppia presenza**: WorkersCenter e CrudEntityView coesistono — non chiaro quale gestisce cosa
- ⚠️ **Import/esport** richiede HR Import Export Dialog separato — non è intuitivo
- ⚠️ **Filtri duplicati**: la pagina lavoratori ha filtri sia per azienda sia per lavoratore

### 3.3 Scheduling visite

1. **Scadenzario** → **"Scadenzario Visite"** tab
2. **VisitPlanningCenter** con orizzonte 60 giorni
3. **"⚡ Pianifica Sessione Massiva"** button (disabled)
4. **"+ Nuova Visita Singola"** button

**Friction Points:**
- ⚠️ **"Pianifica Sessione Massiva" disabled** — perché? Non è chiaro come attivarlo
- ⚠️ **60 giorni di default** — troppi per una schermata? Un mese sarebbe meglio
- ⚠️ **Nessun drag-and-drop** per spostare visite — solo tabelle statiche

### 3.4 Gestione scadenze

- **Scadenzario Visite, Attività, Sopralluoghi, Nomine, Vaccinazioni** — 5 scadenzari separati
- Ognuno con tab, filtri, tabelle, azioni per riga

**Friction Points:**
- ⚠️ **5 scadenzari separati** — un medico/秘书 deve ricordarsi 5 luoghi diversi
- ⚠️ **"Scadenzario Visite"** è il default — perché non tutti?
- ⚠️ **Nessun riassunto unificato** — "Tutte le scadenze in un unico calendario"

### 3.5 Comunicazioni

- **AlertMulticanaleCenter** per notifiche multi-canale
- **PhraseTemplatesCenter** per frasi tipo
- **"Notifiche"** button in topbar

**Friction Points:**
- ⚠️ **"Alert Multicanale"** — non è chiaro cosa significhi "multicanale"
- ⚠️ **Nessun history delle comunicazioni inviate** — non si può sapere cosa è stato comunicato
- ⚠️ **Phrase templates** non è chiaro se si integrano con gli alert o sono separati

---

## PHASE 4 - REVISIONE DESIGN VISIVO

### Spaziatura e Tipografia

| Elemento | Valore | Valutazione |
|---|---|---|
| Font principale | Inter, Segoe UI, Roboto, Helvetica, Arial | ✅ Moderno, ottima scelta |
| Font size base | 14px (body1), 13px (body2), 12px (caption) | ⚠️ Piccolo, 13px è sotto la soglia di accessibilità |
| Line height | 1.4 | ✅ Accettabile |
| Border radius | 6px (btn), 8px (card/dialog), 12px (dialog) | ⚠️ Inconsistente — perché 6 per btn e 8 per card? |
| Spacing unit | 4px grid (implied da MUI sx props) | ✅ Coerente con MUI |

### Gerarchia Visiva

**Problemi principali:**
- ⚠️ **Heading h4 per la dashboard, h6 per le sottosezioni** — l'hierarchy è invertita. L'h4 (dashboard) è il livello più alto, poi h6 (sottosezioni) è più basso. Inconsistente.
- ⚠️ **Tab "legacy-tab"** ha font-size 13px e font-weight 600/700 — il contrasto con i button MUI (fontWeight 600) è minimo
- ⚠️ **Nessun visual hierarchy chiara** tra "Il Mio Giorno" (dashboard) e le altre sezioni

### Densità e Layout

- **Sidebar**: 250px larghezza fissa, 6 voci
- **Topbar**: 50px altezza, 7+ azioni
- **Content area**: 18px padding, `min-height: 520px`
- **Tabella companies**: 40+ colonne, scroll orizzontale

**Valutazione**: La densità è **troppo alta**. 40 colonne in una tabella è inaccessibile. La sidebar è scrollabile verticalmente ma non è collapsabile.

### Pulsanti

**Classi CSS trovate:**
- `.legacy-btn` — primary
- `.legacy-btn-secondary` — secondary  
- `.legacy-btn-success` — success
- MUI `<Button>` — variant="outlined" o "contained"

**Problemi:**
- ⚠️ **Sistema duale**: `.legacy-btn-*` AND MUI `<Button>` coesistono — stesso stile, due sistemi
- ⚠️ **`legacy-btn`** ha `min-width: 110px`, MUI Button non ha min-width
- ⚠️ **"Esporta CSV"**, **"Esporta Excel"**, **"Importa HR"** sono 3 button outilined separati — troppo disordinati nella topbar

### Icone

- **Material Icons** (via `@mui/icons-material`)
- Usate nella sidebar e topbar
- **Problema**: alcune icone sono presenti ma non hanno tooltip (es. "Menu" icon button senza tooltip)

### Colori

| Token | Valore | Uso |
|---|---|---|
| `--legacy-primary` | `#113a7b` | Primary blue |
| `--legacy-primary-hover` | `#0e2f63` | Dark blue |
| `--legacy-topbar-bg` | `#0f1f3d` | Dark navy |
| `--legacy-sidebar-bg` | `#0b1b36` | Darker navy |
| `--legacy-bg` | `#f4f6fa` | Light gray-blue |
| `--legacy-border` | `#e5e8ef` | Light gray border |
| `--legacy-text` | `#111827` | Near-black |
| `--legacy-muted` | `#6b7280` | Gray text |

**Valutazione**: La palette è **coerente** con il tema MUI ma il dualismo legacy CSS + MUI sx props crea incoerenza. Il dark sidebar è trendy ma il contrasto con il light content area è troppo aggressivo.

### Dialoghi

- **CompanyProfileDialog**, **EmployeeProfileDialog**, **GlobalSearchModal**, **HrImportExportDialog**
- Border-radius 12px
- **Problema**: non tutti i dialoghi hanno lo stesso stile. `CompanyProfileDialog` e `EmployeeProfileDialog` sembrano diversi per struttura.

### Tabelle

- **Tabelle con 10-40+ colonne**
- Stile: `#f9fafb` header, `#f3f4f6` hover, `#e5e8ef` borders
- **Problema**: le tabelle sono **troppo larghe**. 40 colonne in una singola schermata è un fallimento UX.

### Form

- **MuiTextField** con `size: 'small'`, `variant: 'outlined'`
- **legacy-form-grid** con `grid-template-columns: repeat(4, minmax(180px, 1fr))`
- **Problema**: il form grid a 4 colonne è troppo denso — i campi sono piccoli

### Responsiveness

- **Media query a 900px**: sidebar diventa orizzontale, content a colonna singola
- **Media query a 1200px**: KPI grid a 2 colonne
- **Problema**: sopra i 900px non c'è breakpoint intermedio — il layout "saltura" da desktop a mobile

### Verdetto Visuale

**MedWork assomiglia a:**
- **2020 software** con alcune feature di design system del 2023
- **NON è un prodotto 2026 SaaS**

**Perché:**
1. Le `legacy-*` classi CSS sono un'anomalia in un'app React 19 + MUI v7 del 2026
2. La tabella companies con 40+ colonne è tipica di software pre-2020
3. Il dualismo tra custom CSS e MUI è un pattern di migrazione da Angular/React classico del 2019-2021
4. Non c'è nessun design system documentato, token system, o component library
5. Le animazioni sono minime (transition: all 0.2s) — assenti nell'interfaccia
6. Non c'è dark mode attivo (il darkTheme è definito ma non utilizzato)
7. La navigazione è tradizionale sidebar + topbar senza breadcrumb, senza visual hierarchy moderna

---

## PHASE 5 - POSIZIONAMENTO COMPETITIVO

### Confronto Percepito

| Modulo | CartSan | WinAspi | Zucchetti | Simpledo | MedWork |
|---|---|---|---|---|---|
| **Dashboard/Home** | BETTER | BETTER | SAME | SAME | **WORSE** |
| **Gestione Aziende** | BETTER | BETTER | SAME | BETTER | **WORSE** |
| **Gestione Lavoratori** | BETTER | BETTER | SAME | BETTER | **WORSE** |
| **Nuova Visita** | BETTER | BETTER | SAME | BETTER | **WORSE** |
| **Scadenzario** | BETTER | SAME | BETTER | BETTER | **WORSE** |
| **Firma Digitale** | BETTER | BETTER | BETTER | BETTER | **WORSE** |
| **Analytics/Report** | BETTER | BETTER | BETTER | BETTER | **WORSE** |
| **Setup/Configurazione** | SAME | BETTER | BETTER | BETTER | **WORSE** |

### Perché MedWork è percepito come WORSE

1. **Densità**: troppi dati in poco spazio, tabelle oversized
2. **Consistenza**: `legacy-*` classi creano un "layer vintage" su MUI moderno
3. **Feedback**: nessun feedback visivo immediato dopo azioni
4. **Navigazione**: 6 aree con ~50 moduli, nessuna guided experience
5. **Onboarding**: zero onboarding per nuovi utenti
6. **Performance**: nessuna loading state, nessuna skeleton screen
7. **Mobile**: responsive a 900px è primitivo, nessun touch-optimized design

---

## PHASE 6 - DESIGN SYSTEM REVIEW

### Incoerenze Identificate

#### 🔴 Pulsanti Inconsistenti

| Pattern | Dove | Problema |
|---|---|---|
| `.legacy-btn` | App.css, componenti manuali | Non standard MUI |
| `<Button variant="outlined">` | App.tsx | MUI standard |
| `<Button variant="contained">` | App.tsx | MUI standard |
| `<button className="legacy-tab">` | App.tsx, custom CSS | Non è un button MUI |
| `<button className="legacy-side-item">` | App.tsx | Non è un button MUI |
| `<button className="legacy-icon-btn">` | App.tsx | Non ha dimensione coerente |

#### 🔴 Dialoghi Inconsistenti

| Dialog | Stile | Problema |
|---|---|---|
| CompanyProfileDialog | MUI Dialog | — |
| EmployeeProfileDialog | MUI Dialog | — |
| GlobalSearchModal | MUI Modal/Dialog | — |
| HrImportExportDialog | MUI Dialog | — |
| LoginCard | Custom Paper | Non è un MUI Dialog |

**Tutti usano MUI Dialog tranne LoginCard** che è un custom Paper con classi.

#### 🔴 Tabelle Inconsistenti

| Tabella | Implementazione | Problema |
|---|---|---|
| Companies table | `CrudEntityView` | 40+ colonne |
| Workers table | `WorkersCenter` + `CrudEntityView` | Dual filter |
| Schedule table | `VisitPlanningCenter` | Checkbox batch |
| Dashboard table | `Dashboard` / `DashboardScadenze` | KPI cards |

**Due sistemi di tabella completamente diversi.**

#### 🔴 Pattern Duplicati

1. **"Esporta CSV"** e **"Esporta Excel"** appaiono sia nella topbar sia nei pannelli laterali
2. **"Nuova azienda"** e **"+ Nuovo lavoratore"** hanno pattern diversi
3. **"Stampa"** appare in molte tabelle con implementazione diversa
4. **"Modifica"**, **"Elimina"**, **"Profilo"** azioni a riga appaiono in tutte le tabelle ma con struttura diversa

#### 🔴 Componenti Mancanti

- **Nessun sistema di notifiche centralizzato** — `Snackbar` globale + `showNotification` utility
- **Nessun sistema di error handling uniforme** — errori in console.log sparsi
- **Nessun loading spinner globale** — nessun feedback durante le chiamate API
- **Nessun skeleton/placeholder** per contenuti che caricano
- **Nessun empty state** per tabelle vuote
- **Nessun confirmation dialog** per azioni distruttive (Elimina)
- **Nessun tooltip** su icone della sidebar

### Proposte Design System

```
# DESIGN SYSTEM IMPROVEMENTS

## 1. Button System
- Definire 3 varianti: Primary, Secondary, Tertiary
- Standardizzare size: sm (32px), md (40px), lg (48px)
- Rimuovere tutte le .legacy-btn classi
- Usare solo MUI <Button> con sx props

## 2. Dialog System  
- Tutti i dialog devono usare MUI <Dialog> + <DialogTitle> + <DialogContent> + <DialogActions>
- LoginCard deve diventare un MUI Dialog
- Standardizzare width: sm (400px), md (560px), lg (960px)

## 3. Table System
- Tabella standard: max 8-10 colonne visibili, resto in "..." menu
- Aggiungere "Expandable row" per dettagli
- Aggiungere toolbar con filtri integrati
- Aggiungere pagination consistente (10/25/50/100)

## 4. Form System
- Standardizzare <TextField> con label floating
- Aggiungere <FormHelperText> per errori
- Aggiungere <InputAdornment> per icon-text combos
- Standardizzare form layout: single column (mobile) → 2 column (tablet) → 3-4 column (desktop)

## 5. Navigation System
- Sidebar collapsabile (icon-only mode)
- Aggiungere breadcrumb trail
- Aggiungere page title in topbar
- Aggiungere search/filter在同一 page

## 6. Feedback System
- Aggiungere loading skeleton per tutte le chiamate API
- Aggiungere confirmation dialog per Elimina
- Aggiungere toast notification system (già esiste come Snackbar, ma standardizzare)
- Aggiungere empty state illustrations

## 7. Token System
- Definire color tokens ufficiali: primary, secondary, success, warning, error, info
- Definire spacing tokens: 4, 8, 12, 16, 24, 32, 48
- Definire typography scale: xs(11px), sm(12px), base(14px), md(16px), lg(20px), xl(24px)
- Definire shadow tokens: sm, md, lg
```

---

## PHASE 7 - TOP 20 UX IMPROVEMENTS

### 🔴 Quick Wins (< 1 giorno)

| # | Problema | Raccomandazione | Sforzo | Guadagno |
|---|---|---|---|---|
| 1 | **"Copia da ultima visita" disabled** senza spiegazione | Aggiungere tooltip o messaggio: "Seleziona un medico per abilitare" | 2h | Riduce confusione, evita frustration |
| 2 | **Tabella companies con 40+ colonne** | Nascondere colonne secondarie dietro "Mostra più colonne" toggle | 4h | La tabella diventa leggibile, riduce cognitive load |
| 3 | **"Esporta CSV" e "Esporta Excel"** come 2 button separati | Unire in un dropdown "Esporta" con opzioni CSV/Excel | 2h | Pulisce la topbar, riduce 2 click a 1 |
| 4 | **Nessun tooltip sulle icone sidebar** | Aggiungere `<Tooltip>` a tutte le icone della sidebar | 1h | Accessibilità, discoverability |
| 5 | **"00:00" in agenda** (placeholder bug) | Mostrare "Nessun appuntamento" o orario reale | 1h | Evita confusione, sembra più professionale |
| 6 | **Login senza feedback** su errori | Aggiungere messaggio errore sotto il form | 30min | Riduce tentativi falliti, migliora UX |
| 7 | **"Cerca lavoratore, azienda..."** placeholder ambiguo | Cambiare in "Cerca per nome, CF, azienda..." | 30min | Chiarezza immediata |
| 8 | **Nessun confirmation per Elimina** | Aggiungere `confirm` dialog prima di eliminare | 1h | Previene azioni accidentali |

### 🟡 High Impact Improvements (1-5 giorni)

| # | Problema | Raccomandazione | Sforzo | Guadagno |
|---|---|---|---|---|
| 9 | **Dual filter nella pagina lavoratori** (aziende in alto, lavoratori in basso) | Unificare in un unico filtro contestuale con breadcrumb | 2 giorni | Riduce confusione, unifica UX |
| 10 | **Stepper a 2 step per visita** senza indicatore di progresso | Aggiungere stepper indicator (Step 1/2 → Step 1/2/3) + progress bar | 2 giorni | L'utente sa dove si trova e quanto manca |
| 11 | **Nessun onboarding per nuovi utenti** | Aggiungere guided tour o welcome modal al primo login | 3 giorni | Riduce time-to-productivity del 60% |
| 12 | **Dashboard senza contesto** — KPI senza spiegazione | Aggiungere tooltips e brevi descrizioni sotto ogni KPI | 1 giorno | L'utente capisce cosa rappresenta ogni metrica |
| 13 | **Navigazione tra 6 aree con ~50 moduli** — nessuna gerarchia chiara | Aggiungere breadcrumb + page title + search nella pagina | 3 giorni | L'utente capisce dove si trova e come tornare indietro |
| 14 | **"Avvia Visita" senza conferma dati** | Aggiungere summary/modale prima di avviare una visita | 2 giorni | Previene errori, conferma i dati inseriti |
| 15 | **Nessun save automatico** nei form di visita | Aggiungere auto-save ogni 30s + indicatore "Salvato" | 2 giorni | Previene perdita dati, migliora fiducia |

### 🔴 Major UX Refactoring (5+ giorni)

| # | Problema | Raccomandazione | Sforzo | Guadagno |
|---|---|---|---|---|
| 16 | **`legacy-*` classi ovunque** in App.tsx e App.css | Rifattorizzare completamente: rimuovere tutte le `legacy-*` classi, usare solo MUI sx props o styled-components | 5-7 giorni | Design system coerente, manutenibilità, modernità |
| 17 | **Tabella companies con 40+ colonne** (strutturale) | Riprogettare come card-based view su mobile, table con column selector su desktop | 5 giorni | Accessibilità mobile, leggibilità |
| 18 | **Nessun dark mode attivo** | Attivare il darkTheme già definito in theme.ts con toggle | 3 giorni | Modernità, comfort visivo per uso prolungato |
| 19 | **5 scadenzari separati** | Unificare in un unico calendario/timeline con filtri per tipo | 5-7 giorni | Visione unificata, riduce click e navigazione |
| 20 | **Nessun sistema di notifiche/alert unificato** | Implementare notification center con bell icon, count badge, dropdown | 4 giorni | Centralizza le comunicazioni, migliora discoverability |

---

## RANKING FINALE TOP 20 — CLASSIFICATI PER IMPATTO / SFORZO

```
Rank | Impact | Effort | Title
-----|--------|--------|--------------------------------------------------
  1  |   🔴🔴🔴  |  2h    | Fix "Copia da ultima visita" disabled (tooltip)
  2  |   🔴🔴🔴  |  4h    | Compressa tabella companies (< 10 colonne visibili)
  3  |   🔴🔴🔴  |  2h    | Unisci "Esporta CSV/Excel" in dropdown
  4  |   🔴🔴🔴  |  1h    | Tooltip su icone sidebar
  5  |   🔴🔴🔴  |  1h    | Fix placeholder "00:00" in agenda
  6  |   🔴🔴🔴  |  1giorno | Aggiungi onboarding guidato
  7  |   🔴🔴🔴  |  2giorni | Unifica filtri lavoratori (dual → single)
  8  |   🔴🔴    |  2giorni | Aggiungi stepper indicator con progress bar
  9  |   🔴🔴    |  1giorno | Tooltip KPI dashboard + descrizioni
  10 |   🔴🔴    |  2giorni | Auto-save nei form visita
  11 |   🔴🔴    |  3giorni | Breadcrumb + page title navigazione
  12 |   🔴🔴    |  2giorni | Conferma dati prima di "Avvia Visita"
  13 |   🔴🔴    |  4h    | Confirm dialog per "Elimina"
  14 |   🔴🔴    |  3giorni | Attiva Dark Mode
  15 |   🔴🔴    |  5giorni | Rifattorizza legacy-* → MUI sx props
  16 |   🔴🔴    |  5giorni | Unifica 5 scadenzari in 1 calendario
  17 |   🔴🔴    |  3giorni | Notification center unificato
  18 |   🔴      |  5giorni | Riprogetta tabella companies (card-based)
  19 |   🔴      |  2h    | Fix placeholder ricerca ("Cerca per nome, CF...")
  20 |   🔴      |  4giorni | Loading skeleton per tutte le chiamate API
```

---

## LE SCREEN CHE NECESSITANO REDESIGN

### 🔴 Critiche (Redesign immediato)

1. **Companies Table** (`/companies`)
   - Problema: 40+ colonne, nessuna gerarchia visiva
   - Target: card-based su mobile, table con column selector su desktop

2. **Workers Page** (`/workers`)
   - Problema: dual filter, row buttons giganti, due sistemi (WorkersCenter + CrudEntityView)
   - Target: unificare filtri, sostituire row button con inline actions

3. **Medical Visit Stepper** (`/health-surveillance/medical-visit-stepper`)
   - Problema: 2 step senza indicatori, nessun save automatico, campi confusi
   - Target: stepper a 3-4 step con progress bar, auto-save, tooltips

4. **Login Screen**
   - Problema: personalizzato (custom Paper), non allineato con MUI
   - Target: MUI Dialog con brand, animazione di ingresso

### 🟡 Importanti (Redesign entro 1 settimana)

5. **Dashboard "Il Mio Giorno"**
   - Aggiungere contesto, descrizioni KPI, agenda con orari reali

6. **Schedule/Planning**
   - Unificare i 5 scadenzari in un unico calendar/timeline

7. **Settings**
   - Migliorare layout e aggiungere sezione help/onboarding

### 🟢 Minori (Miglioramenti)

8. **Topbar** — ridurre azioni, aggiungere search più intelligente
9. **Sidebar** — collassabile, con tooltip, ordine logico
10. **Footer** — aggiungere versione, help link, supporto

---

## DOMANDA CHIAVE: Cosa percepisce un medico vedendo MedWork per la prima volta?

> **Se un medico vede MedWork per la prima volta domani, cosa appare immediatamente datato, confuso, o inferiore ai prodotti SaaS moderni?**

### Risposta in sintesi:

**1. L'interfaccia è densa e caotica (2015)**
- 40+ colonne in una tabella
- Sidebar con 6 voci e tante sotto-voci nascoste
- Topbar con 10+ azioni
- Doppio filtro nella pagina lavoratori
- **Percezione**: "Questo sembra un software vecchio. Non è cloud-native."

**2. Manca qualsiasi onboarding o guida (2015)**
- Nessun tour guidato
- Nessun tooltip sui campi
- Nessuna indicazione di "cosa fare adesso"
- **Percezione**: "Come uso questo? Non so da dove iniziare."

**3. Dualismo legacy CSS + MUI (2020)**
- `.legacy-btn`, `.legacy-tab`, `.legacy-side-item` classi ovunque
- Stili custom che sovrascrivono MUI
- **Percezione**: "Qualcuno ha provato a modernizzare ma ha lasciato il codice vecchio."

**4. Niente feedback immediato (2018)**
- Nessun loading spinner
- Nessun save automatico
- Nessun confirmation dialog
- **Percezione**: "Cosa è successo? Il mio click ha funzionato?"

**5. Nessuna animazione o microinterazione (2018)**
- Transizioni minime (0.2s)
- Nessun skeleton screen
- Nessun empty state
- **Percezione**: "Questa app è statica. Non risponde come un prodotto moderno."

**6. Responsive primitivo (2019)**
- Breakpoint a 900px, niente tablet
- Sidebar non collassabile
- **Percezione**: "Non funziona bene su tablet o telefono."

### Il Verdetto Finale

**MedWork percepito come software del 2015-2018 con un tentativo di modernizzazione superficiale (MUI v7 + React 19) che non ha coinvolto il layer di interazione e UX.**

La differenza tra "aspetto moderno" e "funziona come SaaS 2026" è abissale. I colori, i font, e la struttura sono moderni. Ma la densità, la mancanza di feedback, l'assenza di onboarding, il dualismo CSS, e le tabelle oversized la rendono un prodotto che **non compete con CartSan, WinAspi, Zucchetti o Simpledo** sul piano percepito.

Per essere competitivo nel 2026, MedWork ha bisogno di:
1. **Un design system coerente** (rimuovere tutte le `legacy-*` classi)
2. **Onboarding guidato** (tour + tooltips + empty states)
3. **Feedback immediato** (loading, auto-save, confirmation)
4. **Riduzione della densità** (tabelle compresse, filtri unificati)
5. **Microinterazioni** (animazioni, skeleton, toast system)
6. **Mobile-first responsive** (collassabile sidebar, touch-friendly)

---

## APPENDICE — METODOLOGIA

### Strumenti Usati
- **agent-browser** (v0.38.1) per esplorazione browser automatizzata
- **Playwright** (v1.62.1) per test e report esistenti
- **Serena MCP** per analisi simbolica del codice
- **Visual inspection** tramite screenshot

### Fonti Dati
- `/screenshots/audit_dashboard.png`
- `/screenshots/audit_workers.png`
- `/screenshots/audit_schedule.png`
- `/medwork-frontend/tests/physician-scenarios.spec.ts`
- `/medwork-frontend/tests/p0-improvements.spec.ts`
- `/medwork-frontend/tests/critical-improvements-p1.spec.ts`
- `/medwork-frontend/playwright-report/data/`
- `/medwork-frontend/src/App.tsx`
- `/medwork-frontend/src/App.css`
- `/medwork-frontend/src/theme.ts`
- `/medwork-frontend/src/index.css`
- `/medwork-frontend/src/components/` (tutti i componenti)

### Limitazioni
- Audit basato su snapshot statiche e test esistenti, non su test di usabilità reali con utenti
- Non è stato testato il backend (nessun dato di performance API)
- Nessun test su mobile reale (solo responsive breakpoint)
- Il dark mode non è stato testato (non attivo)
