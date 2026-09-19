# MedWork Manager — Operational Workflows
**Data**: Settembre 2026

Workflow operativi per ruolo, passo per passo.

---

## 👤 Medico Competente

### Mattina: Dashboard
- Login con email, password, tenant slug
- Vista "Oggi": visite programmate, scadenze, documenti da firmare
- "Da firmare": lista giudizi pending
- "Anomalie": aziende con overdue

### Visita Periodica Standard
1. **Cerca paziente** → `GlobalSearchModal` (Ctrl+K) o lista lavoratori
2. **Crea visita** → `MedicalVisitStepper`:
   - Step 1: Lavoratore + data + tipo visita
   - Step 2: Anamnesi (lavorativa, personale, familiare)
   - Step 3: Esame obiettivo
   - Step 4: Giudizio (dropdown esito + prescrizioni)
   - Step 5: Prossima scadenza (auto-calcolata)
3. **Calcolo scadenza automatico**: legge protocollo del lavoratore → PersonalProtocol (override) oppure JobRole protocol (fallback) → età >50 riduce cadenza del 20%
4. **Salva visita** → Dati nel DB, scadenza registrata
5. **Genera PDF** → `FitnessJudgmentPdfDocument` (QuestPDF, server-side, 1 click)
6. **Notifica datore** → `AlertMultiChannelService` invia notifica
7. **Aggiorna scadenziario** → Automatico nella `DashboardScadenze`

---

## 👤 Segreteria

### Gestione Aziende
- Apri `CompanyProfileDialog` → anagrafica, sedi, figure aziendali, medici assegnati
- `CompanyGroupsCenter` → CRUD gruppi aziendali con flag Archivio Documentale Unico
- `MasterDataController` → dati anagrafici master

### Gestione Lavoratori
- Apri `WorkersCenter` → tabella con filtri azienda/sede/stato
- Aggiungi dipendente → `EmployeeProfileDialog` (23+ campi)
- `GlobalSearchModal` → ricerca rapida
- Stato archiviato server-side (non localStorage)
- `HrImportExportDialog.tsx` → import/export HR

### Gestione Documenti
- **Cartella 3A**: `MedicalRecordController` (GET/POST/PUT/PATCH/DELETE) → `Allegato3APdfDocument`
- **Allegato 3B**: `DocumentsController` validate/submit → `Allegato3BCenter.jsx`
- **Firma**: `SignatureController` (RSA SHA-256) → `BatchSignatureCenter.jsx`

---

## 👤 Datore di Lavoro

### Monitoraggio
- Dashboard: scadenze aziendali, compliance rate, visita scadenze
- Riceve notifiche (email digest, alert scadenze)
- Alert automatico 30/15/7 gg prima della scadenza

### Gestione Proattiva
- Pianifica visite → Calendar view, raggruppamento per azienda
- Genera report → `AnnualHealthReportPdfDocument` (relazione art. 40)
- Scadenziario PDF per l'azienda

---

## 👤 RSPP

### Compliance
- `ComplianceCenter.jsx` → valutazione protocolli con 5+ regole D.Lgs. 81/08
- `QuestionnairesController` → questionari compliance con scoring
- `JobRoleRiskFactor` → rischi assegnati a mansione
- DVR: link in profilo azienda

### Audit
- `AuditController` → log di ogni operazione
- `AuditCenter.jsx` → visualizzazione log (data, utente, entità, azione)
- Immutabile, server-side, GDPR-compliant

---

## Workflow Trasversali

### Scadenziario Automatico
```
Visita creata → DeadlineCalculationService.attiva
  → Cerca PersonalProtocol override
  → Se null → Fallback JobRole protocol
  → Calcola cadenza (età >50: -20%, floor 30gg)
  → nextDeadline = visitDate + cadenceDays
  → Appare in DashboardScadenze + alert automatici
```

### Generazione Documenti
```
Giudizio completato → DocumentGenerationService.GenerateFitnessJudgmentPdf()
  → FitnessJudgmentPdfDocument (QuestPDF) → download PDF legale

Visita completata → DocumentGenerationService.GenerateAllegato3A()
  → Allegato3APdfDocument → Cartella 3A conforme DM 9/7/2012

Fine anno → DocumentGenerationService.GenerateAnnualHealthReport()
  → AnnualHealthReportPdfDocument → Relazione art. 40
```

### Audit Trail
```
Ogni operazione (CRUD) → AuditEvent creato automaticamente
  → TenantId + UserId + EntityType + EntityId + Action + Timestamp + Diff
  → Salvato nel DB (server-side, immutabile)
  → Visualizzabile in AuditCenter.jsx
```

---

*Vedere `OPERATIONAL_WORKFLOWS.md` per più dettagli sui workflow (versione più lunga).*
