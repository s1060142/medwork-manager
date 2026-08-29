# MedWork Frontend Button & Click Handler Analysis

**Scope:** `C:\github\medwork-manager\medwork-frontend\src\components`  
**Date:** 2026-08-28  
**Type:** Research only — no files modified

## Objective

Audit all buttons and clickable elements across 35 component files to identify:
1. Missing `onClick` handlers entirely
2. Handlers that exist but do NOT call the backend API

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Component files analyzed | 35 |
| Total buttons/clickable elements found | ~95 |
| Buttons WITH handler AND backend call | ~55 |
| Buttons WITH handler but NO backend call (intentional) | ~35 |
| Buttons MISSING handler entirely | **1** |
| Handlers missing backend call (unintentional gaps) | **3** |

---

## Critical Finding: Missing Handler

### 1. WorkersCenter.jsx — "Filtra" button
- **File:** `C:\github\medwork-manager\medwork-frontend\src\components\WorkersCenter.jsx`
- **Line:** ~480
- **Button text:** `Filtra`
- **Current state:** `<Button className="legacy-btn" startIcon={<SearchIcon />}>Filtra</Button>` — **no `onClick` prop**
- **Impact:** The button renders but is completely non-functional. The worker search/filter inputs above it (`workerSearch`, `Nome`, `Codice fiscale`, `Stato`) have no way to trigger filtering.
- **Suggested fix:** Add an `onClick` handler that triggers the filter logic. Currently `filteredWorkerRows` is derived from state, so clicking "Filtra" should either:
  - Trigger a backend search via `apiGet('/api/master-data/employees?search=...')` if a search endpoint exists, or
  - At minimum, log/apply the current filter state (the derived `filteredWorkerRows` already reacts to state changes, so this may just need a `loadData()` call or the button is redundant if filtering is already reactive).

---

## Handlers Existing but Missing Backend API Call

### 2. BillingCenter.jsx — "Registra documento" button
- **File:** `C:\github\medwork-manager\medwork-frontend\src\components\BillingCenter.jsx`
- **Line:** 144
- **Button text:** `Registra documento`
- **Handler:** `createDoc()` (line 76)
- **Current behavior:** Creates document in `localStorage` only (`saveDocs(next)`), appends audit event to localStorage. No `apiSend` or `apiPost` call.
- **Impact:** Billing documents are not persisted to the backend. Data is lost on refresh/clear. The `companies` dropdown is loaded from the backend (`apiGet('/api/master-data/companies')`), but document creation is entirely client-side.
- **Suggested fix:** Add `apiSend('POST', '/api/billing/documents', payload)` inside `createDoc()` and update the local state from the response.

### 3. ToolsCenter.jsx — "Registra firma" button
- **File:** `C:\github\medwork-manager\medwork-frontend\src\components\ToolsCenter.jsx`
- **Line:** 167
- **Button text:** `Registra firma`
- **Handler:** `registerSignature()` (line 96)
- **Current behavior:** Saves signature record to `localStorage` only (`saveSignatures(next)`), appends audit event. No `apiSend` call.
- **Impact:** Signature registrations are not persisted to the backend. The `FirmaGrafometricaCenter` and `BatchSignatureCenter` both correctly call backend APIs for verification and batch signing, but this tool registration is orphaned.
- **Suggested fix:** Add `apiSend('POST', '/api/tools/signatures', payload)` inside `registerSignature()`.

### 4. WorkersCenter.jsx — Company archive icon button
- **File:** `C:\github\medwork-manager\medwork-frontend\src\components\WorkersCenter.jsx`
- **Line:** ~401
- **Button text/icon:** `📁` (archive/restore company)
- **Handler:** Inline `onClick` with `event.stopPropagation()` then local state update only
- **Current behavior:** Toggles `row.status` between `'Attiva'` and `'Archiviata'` in local `companies` state only. No backend API call.
- **Impact:** Company archival status is not persisted. Refreshing the page reverts to the backend state. Other parts of the app (e.g., `WorkersCenter` filters, `CrudEntityView`) read from the backend.
- **Suggested fix:** Add `apiSend('PATCH', `/api/admin-data/companies/${row.id}`, { status: newStatus })` inside the click handler.

---

## Notable Patterns

### Native HTML Buttons (no MUI Button wrapper)
Two components use raw `<button>` elements instead of MUI `<Button>`:
- **QuestionnairesCenter.jsx** (lines 89, 140): `<button type="button" onClick={...}>Apri</button>` and `<button type="button" onClick={submit}>Calcola score</button>`
  - These have handlers and the submit one calls the backend. The "Apri" button only opens local state. Consider wrapping in MUI `<Button>` for consistency.

### Placeholder Buttons (intentionally non-functional)
Multiple components have buttons with `window.alert('... non ancora disponibile')`:
- **ReportsCenter.jsx**: "Mostra archiviate", "Ricerca avanzata", "Ricarica elenco", "Altri filtri", "Reset", "Ricerca", "Esporta dati in excel", "Salva giudizi", "Salva visite", "Invia", "Vedi analisi", "+ Nuovo documento", "Esporta" (×2), "File excel", "File inail"
- **CrudEntityView.jsx**: "Operazioni massive", "Importa dati"
- **WorkersCenter.jsx**: "Stampe massive", "Operazioni massive", "Importa lavoratori"

These are **intentional placeholders** and do not need backend calls.

### Buttons with Handlers but No Backend Call (Intentional)
These are correctly scoped as UI-only actions:
- Dialog open/close (`onClose`, `setDialogOpen`, etc.)
- Navigation callbacks (`onNavigate`, `onOpenMedicalVisitCreate`, etc.)
- Print actions (`window.print()`)
- Client-side CSV exports (`downloadCsv`)
- Local state updates (calendar navigation, filter toggles, tab changes)

---

## Complete Button Inventory by Component

| Component | Button Description | Has Handler | Calls Backend | Missing |
|-----------|-------------------|-------------|---------------|---------|
| AlertMulticanaleCenter | Invia alert | Yes | Yes | — |
| Allegato3BCenter | Valida XSD | Yes | Yes | — |
| Allegato3BCenter | Invia a INAIL | Yes | Yes | — |
| Allegato3BPreview | Chiudi | Yes | No (dialog close) | — |
| Allegato3BPreview | Stampa PDF / Salva CSV | Yes | No (print) | — |
| AnalyticsCenter | Calcola probabilità | Yes | Yes | — |
| AnalyticsCenter | Ottimizza per azienda | Yes | Yes | — |
| AppointmentsCalendar | Today | Yes | No (local state) | — |
| AppointmentsCalendar | ChevronLeft/Right | Yes | No (local state) | — |
| AppointmentsCalendar | Record New Appointment | Yes | No (callback) | — |
| AppointmentsCalendar | Chiudi (popover) | Yes | No (local state) | — |
| AppointmentsCalendar | Invia Link Anamnesi | Yes | Yes | — |
| AppointmentsCalendar | Day cell click | Yes | No (local state) | — |
| AppointmentsCalendar | Event chip click | Yes | No (local state) | — |
| AuditCenter | Aggiorna | Yes | No (localStorage) | — |
| AuditCenter | Svuota | Yes | No (localStorage) | — |
| BatchSignatureCenter | Firma N Selezionati | Yes | Yes | — |
| **BillingCenter** | **Registra documento** | **Yes** | **NO** | **Backend call** |
| CartellaSanitariaCenter | Aggiorna/Crea cartella | Yes | Yes | — |
| CompanyProfileDialog | Allegato 3B | Yes | No (dialog open) | — |
| CompanyProfileDialog | Analytics | Yes | No (dialog open) | — |
| CompanyProfileDialog | Piano Sanitario | Yes | No (dialog open) | — |
| CompanyProfileDialog | Salva | Yes | Yes | — |
| CompanyProfileDialog | Chiudi | Yes | No (dialog close) | — |
| CompanyProfileDialog | Assegna/Rimuovi medico | Yes | No (local state) | — |
| CrudEntityView | Aggiorna | Yes | Yes | — |
| CrudEntityView | Nuovo | Yes | No (dialog open) | — |
| CrudEntityView | Esporta CSV | Yes | No (client export) | — |
| CrudEntityView | Filtro avanzato | Yes | No (local state) | — |
| CrudEntityView | Modifica/Elimina/Profilo (row) | Yes | Mixed | — |
| CrudEntityView | Stampa/Excel/Operazioni/Importa | Mixed | Mixed | — |
| CrudEntityView | Elimina (confirm dialog) | Yes | Yes | — |
| CrudEntityView | Salva (edit dialog) | Yes | Yes | — |
| DashboardScadenze | Esporta Report | Yes | No (client export) | — |
| DashboardScadenze | Nuova Visita Medica | Yes | No (callback) | — |
| DashboardScadenze | Aggiungi Dipendente | Yes | No (callback) | — |
| DashboardScadenze | Backup Dati Now | Yes | Yes | — |
| DashboardScadenze | Vedi Calendario Completo | Yes | No (callback) | — |
| EmployeeProfileDialog | Nuova visita/Controllo periodico | Yes | No (callback) | — |
| EmployeeProfileDialog | Chiudi | Yes | No (dialog close) | — |
| EmployeeProfileDialog | Salva | Yes | Yes | — |
| EnterpriseAnalyticsDashboard | Chiudi | Yes | No (dialog close) | — |
| FirmaGrafometricaCenter | Verifica firma | Yes | Yes | — |
| FirmaGrafometricaCenter | Carica hash di esempio | Yes | Yes | — |
| GiudizioIdoneitaCenter | Salva giudizio | Yes | Yes | — |
| GiudizioIdoneitaCenter | Scarica PDF | Yes | Yes (direct fetch) | — |
| HealthPlanPreview | Chiudi | Yes | No (dialog close) | — |
| HealthPlanPreview | Stampa | Yes | No (print) | — |
| HomeCapabilities | Scopri di più | Yes | No (callback) | — |
| HrImportExportDialog | Seleziona file | Yes | No (file picker) | — |
| HrImportExportDialog | Esporta CSV | Yes | Yes | — |
| HrImportExportDialog | Esporta Excel | Yes | Yes | — |
| HrImportExportDialog | Chiudi | Yes | No (dialog close) | — |
| LoginCard | Accedi | Yes | Yes | — |
| MedicalVisitStepper | Copia da ultima visita | Yes | Yes | — |
| MedicalVisitStepper | Indietro/Avanti | Yes | No (local state) | — |
| MedicalVisitStepper | Salva Visita | Yes | Yes | — |
| PatientAnamnesisForm | Invia Dati al Medico | Yes | Yes (direct fetch) | — |
| PhraseTemplatesCenter | Nuova frase | Yes | No (dialog open) | — |
| PhraseTemplatesCenter | Toggle favourite | Yes | Yes | — |
| PhraseTemplatesCenter | Modifica/Elimina | Yes | Yes | — |
| PhraseTemplatesCenter | Salva (dialog) | Yes | Yes | — |
| ProtocolsCenter | Esporta CSV | Yes | No (client export) | — |
| ProtocolsCenter | Nuovo protocollo | Yes | No (dialog open) | — |
| ProtocolsCenter | Disattiva/Attiva | Yes | Yes | — |
| ProtocolsCenter | Salva protocollo | Yes | Yes | — |
| QuestionnairesCenter | Apri | Yes | No (local state) | — |
| QuestionnairesCenter | Calcola score | Yes | Yes | — |
| RecallCampaignsCenter | Lancia Campagna | Yes | Yes | — |
| ReportsCenter | Genera PDF (×4) | Yes | Yes | — |
| ReportsCenter | Placeholder buttons (×13) | Yes | No (placeholders) | — |
| SettingsCenter | (no buttons; uses Chip selects) | — | — | — |
| **ToolsCenter** | **Registra firma** | **Yes** | **NO** | **Backend call** |
| VisitPlanningCenter | Aggiorna | Yes | Yes | — |
| VisitPlanningCenter | Nuova visita | Yes | No (callback) | — |
| VisitPlanningCenter | Convoca | Yes | Yes | — |
| WorkersCenter | Gestione completa/Aggiungi | Yes | No (callback) | — |
| WorkersCenter | Reset | Yes | No (local state) | — |
| WorkersCenter | Ricerca | Yes | Yes | — |
| WorkersCenter | + Nuovo lavoratore | Yes | No (callback) | — |
| WorkersCenter | Stampa | Yes | No (print) | — |
| WorkersCenter | Stampe massive/Operazioni/Importa | Yes | No (placeholders) | — |
| WorkersCenter | Esporta dati in excel | Yes | No (client export) | — |
| **WorkersCenter** | **Filtra** | **NO** | **NO** | **Handler + Backend** |
| WorkersCenter | Company archive icon | Yes | NO | Backend call |
| WorkersCenter | Row action icons | Mixed | Mixed | — |

---

## Recommended Fixes (Priority Order)

### P0 — Non-functional button
1. **WorkersCenter.jsx "Filtra"**: Add `onClick` handler. Since `filteredWorkerRows` is already reactive to state, the simplest fix is either:
   - Wire it to `loadData()` to re-fetch from backend with current filters, or
   - Remove the button if filtering is purely client-side (the inputs already drive `filteredWorkerRows` reactively).

### P1 — Data loss risk (localStorage-only persistence)
2. **BillingCenter.jsx "Registra documento"**: Add `apiSend('POST', '/api/billing/documents', { ...formData, companyId: Number(formData.companyId), amount: Number(formData.amount) })` and update state from response.
3. **ToolsCenter.jsx "Registra firma"**: Add `apiSend('POST', '/api/tools/signatures', { employeeId: Number(formData.employeeId), signer: formData.signer, method: formData.method, note: formData.note })`.
4. **WorkersCenter.jsx company archive icon**: Add `apiSend('PATCH', `/api/admin-data/companies/${row.id}`, { status: newStatus })` to persist the archival toggle.

---

## Files with No Buttons/Clickable Elements
- `ComplianceCenter.jsx` — read-only display
- `Dashboard.jsx` — read-only summary cards
- `DashboardMedico.jsx` — read-only dashboard
- `EntityDataView.jsx` — read-only table
- `SettingsCenter.jsx` — uses select dropdowns and chips, no traditional buttons
