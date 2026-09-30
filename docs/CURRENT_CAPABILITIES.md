# MedWork Manager — Current Capabilities
**Data**: Settembre 2026

Cosa funziona oggi, organizzato per modulo.

---

## 🖥️ Interfaccia Utente & SaaS Navigation Shell
- **Browser History & Hash Routing (Indietro / Avanti)**: Navigazione fluida e bidirezionale integrata con la cronologia del browser (`#/<macro-area>/<modulo>?employeeId=...`) e ascolto su `hashchange`/`popstate`. Premere il tasto "Indietro" o gesture torna alla vista/entità precedente senza mai uscire dal browser.
- **In-App Navigation Controls & Interactive Breadcrumbs**: Pulsanti rapidi "← Indietro" e "Avanti →" nella barra del contesto, breadcrumb gerarchiche interattive e pulsante di risalita rapida *"← Torna a Elenco Lavoratori"* quando si consulta una cartella sanitaria o stepper clinico.
- **Unified Clinical Navigation & Accorpamento Tempo/Pianificazione**: Accorpamento completo e pulito di tutte le attività cliniche sotto l'unica macro-area **Sorveglianza Sanitaria** (`Il Mio Giorno`, `Agenda & Pianificazione`, `Nuova Visita (Step)`, `Cartella Sanitaria 3A`, `Centro Giudizi & Firma`, `Convocazioni & Recall`, `Vaccinazioni`, `Sopralluoghi Ambienti`, `Firma su Tablet`). Accorpati i vecchi calendari frammentati nel nuovo centro unificato **Agenda & Pianificazione** con doppia vista sincronizzata (Calendario Appuntamenti & Scadenzario Normativo Batch Planner).
- **Cockpit "Il Mio Giorno"**: Landing operativa dedicata al Medico Competente con KPI *Visite in programma oggi / Giudizi da firmare / Scadenze visite 7 gg / Compliance D.Lgs. 81/08*, agenda pazienti del giorno con **Avvia Visita** in 1 clic, Morning Digest e collegamenti diretti alla pianificazione unificata.
- **Active Company & Branch Context Hub**: Selettore rapido globale nella topbar con persistenza in `localStorage`.
- **Persistent Clinical Context Banner**: Banner contestuale sticky presente in ogni modulo e schermata, indicante Ragione Sociale attiva, Sede operativa, status isolamento clinico e pulsante rapido per ripristino modalità globale.
- **Universal Context Propagation**: Filtraggio automatico end-to-end su Lavoratori, Registro Visite, Centro Giudizi & Firma, Cartelle Sanitarie (All. 3A), Scadenzario Attività, Convocazioni Recall, Compliance Radar, Allegato 3B, Calendario Visite, Dashboard e Fatturazione.
- **Zero-Selection Table UX & Doppio Click Operativo**: Nelle tabelle entità (`CrudEntityView`, `WorkersCenter`, `ProtocolsCenter`, `MedicalStaffCenter`, ecc.) è stato eliminato qualsiasi effetto visivo di selezione al clic singolo (rimosso outline di focus, rimossi sfondi `.Mui-selected` spuri, `user-select: none` per prevenire evidenziazioni di testo accidentali ed eliminata la colonna checkbox vuota). L'apertura e la modifica dell'elemento avvengono esclusivamente con il **doppio clic** (o tasto Invio), garantendo un'esperienza rapida, pulita e priva di attriti visivi.
- **MUI X Date Localization**: Integrazione a livello root di `LocalizationProvider` con `AdapterDateFns` e locale italiano (`it`).

---

## 🔐 Autenticazione

- Login email/password con tenant slug
- JWT Bearer + refresh token
- "Ricordami" checkbox
- RBAC: Admin, Doctor, RSPP con Role → Permission
- TenantContextFilter per isolamento multi-tenant
- BCrypt password hashing
- SPID/CIE: stub HTTP client (non integrato)
- AI charting: `AIChartingService.cs` implementato

---

## 👨‍⚕️ Centro Gestione Personale Sanitario (Medical Staff Center)

- **Gestione Multiruolo Team Sanitario**: Supporto completo per Medici Competenti (Art. 38), Medici Coordinati, Medici Sostituti, Infermieri Sanitari, Tecnici della Prevenzione e Segreteria Sanitaria (`MedicalStaffController.cs`, `MedicalStaffCenter.jsx`).
- **Anagrafica & Iscrizione Ordine**: Tracciamento Codice Fiscale, Numero Iscrizione Ordine/Albo, Provincia di Iscrizione, Scadenza Iscrizione, Specializzazioni e Contatti.
- **Firma Digitale & PEC**: Gestione parametri Firma Digitale (thumbprint certificato, scadenza certificato), PEC e collegamento automatico all'account `User` di login MedWork.
- **Motore Assenze & Sostituzioni**: Registrazione ferie, malattie, congressi e permessi con designazione automatica del Medico Sostituto per la continuità operativa delle visite mediche.
- **Assegnazione Aziende & Sedi**: Mappatura granulare professionisti su aziende e sedi (anche multilivello) con qualifica di Medico Coordinatore o Medico Competente Nominato.
- **Dashboard Executive KPI**: Monitoraggio in tempo reale del personale attivo per ruolo, assenti oggi, scadenze imminenti di certificati e copertura % aziende.


---

## 🔄 Universal Migration Engine (Migrazione & Import)

- **Multi-Format Ingestion**: Parser nativi per Winasped / WinAspi, CartSan, Zucchetti e CSV/Excel unificato.
- **Dry-Run Validation Pipeline**: Validazione preventiva a due fasi (rilevamento KPI, conteggio aziende/lavoratori/visite, deduping codice fiscale, normalizzazione esiti di idoneità).
- **Transactional Commit**: Inserimento atomico transazionale con isolamento per TenantId (`LegacyMigrationService.cs`, `MigrationController.cs`, `MigrationCenter.jsx`).

---

## 📬 PEC Delivery Hub (Notifiche Legali & Giudizi)

- **Configurazione Server PEC**: Gestione parametri SMTP PEC (Host, Porta, SSL, credenziali cifrate con `IFieldEncryptionService`) per singolo tenant.
- **Test Connessione Handshake**: Verifica istantanea autenticazione server PEC da `SettingsCenter.jsx`.
- **Invio Singolo & Massivo con PDF Allegato**: Trasmissione automatica giudizi di idoneità via PEC con certificato PDF QuestPDF generato in-memory (`PecDeliveryService.cs`, `AlertsController.cs`, `GiudizioIdoneitaCenter.jsx`).
- **Audit & Legal Logging**: Tracciamento di ogni tentativo di invio in `NotificationLogs` con stato e data/ora.

---

## 🏢 Portale Datore di Lavoro & RSPP

- **Cruscotto di Conformità (D.Lgs. 81/08)**: Visualizzazione organico sorvegliato, idoneità attive, scadenze entro 60 giorni e scadenze superate (`EmployerPortalView.jsx`).
- **Isolamento GDPR Dati Sanitari**: Accesso limitato alle sole conclusioni legali e prescrizioni operative, con blocco rigido di anamnesi e dati clinici.
- **Download Massivo Archivio Giudizi (ZIP)**: Azione primaria 1-click in evidenza nell'header per generare e scaricare immediatamente l'archivio ZIP con tutti i certificati PDF validi dell'azienda (`DocumentsController.cs`, `EmployerPortalView.jsx`).
- **Segnalazione Nuove Assunzioni / Variazioni**: Modulo per il Datore di Lavoro per richiedere visite preventive o cambi mansione direttamente al Medico Competente.

---

## 🏭 Gestione Aziende

- CRUD completo aziende (nome, P.IVA, ATECO, PEC, SDI)
- **Lookup Medico Competente Nominato (D.Lgs. 81/08 Art. 38)**: Selezione del Medico Competente sia nella modale "Modifica azienda" (`CrudEntityView`) che nella "Scheda Azienda" (`CompanyProfileDialog`). Supporta autocompletamento istantaneo inline (ricerca per nome, cognome, specializzazione, albo) e finestra di lookup tabellare avanzata con selezione a 1-click o rimozione assegnazione. Sincronizzazione automatica su database (`CompanyDoctors` con `IsCoordinator = true`), proiezione immediata nella griglia principale aziende e rispetto rigoroso dell'isolamento multi-tenant (`TenantId`).
- Navigazione pulita: rimosso sottomenu ridondante Checklist e rimossi tab orizzontali superflui
- Gestione sedi/branche + figure aziendali
- **Company Groups** (`CompanyGroupsController` + `CompanyGroupsCenter.jsx`) con flag `Archivio Documentale Unico`
- Master Data (`MasterDataController`)
- Company Nominations (`CompanyNominationsController`)
- Import CSV/Excel aziende (EPPlus)
- Dashboard con KPI aziendali

---

## 👤 Gestione Lavoratori

- CRUD dipendenti (23+ campi, migration applicata)
- **Associazione Medico Competente & Inquadramento Normativo (D.Lgs. 81/08 Art. 38)** (`WorkerFormDialog.jsx`, `EmployeeProfileDialog.jsx`): Selettore dinamico con autocompletamento del Medico Competente incaricato (con specialità e n. albo), sincronizzazione automatica a livello aziendale (`CompanyDoctors`) o ereditarietà dal coordinatore aziendale, integrato con **Data Assunzione (Allegato 3A)** per il computo dell'anzianità lavorativa specifica e **Stato Lavoratore** ('Attivo', 'In prova', 'Sospeso', 'Cessato') per il corretto scoping nella sorveglianza sanitaria e nello scadenzario.
- **Worker Quick Add (Reverse CF Parsing)**: Parsing automatico in tempo reale del Codice Fiscale (`taxCode.js`, `EmployeeProfileDialog.jsx`) con auto-popolamento immediato di Data di Nascita, Sesso, Comune di nascita e Codice Belfiore.
- `EmployeeProfileDialog` con tab: Anagrafica, Sorveglianza, Fattori di rischio, Cartella sanitaria
- Fattori di rischio assegnabili (`JobRoleRiskFactor`)
- Stato archiviato server-side (non localStorage)
- `GlobalSearchModal` per ricerca rapida
- Vaccinazioni tracciate
- `HrImportExportDialog.tsx` per import/export HR

---

## 🏥 Visite Mediche

- `MedicalVisitStepper` — flusso step-by-step (anamnesi → obiettivo → giudizio) con **Checklist Anamnestica Dinamica per Mansione & Rischi (Allegato 3A)**: 7 categorie di rischio (VDT, MMC, Rumore, Chimico, Notturno, Guida/Quota, Generale) con riconoscimento automatico mansione, badge `★ Suggerito`, 1-click apply e check interattivi.
- **Questionario Anamnestico Pre-Visita (Self-Service QR Code & Smartphone)** (`PreVisitQuestionnaireModal.jsx`): Dialogo interattivo e generazione QR Code per permettere al lavoratore in sala d'attesa di precompilare su smartphone abitudini di vita, patologie remote, terapie farmacologiche e sintomi occupazionali, con sintesi clinica 1-click nello Step 1 dell'Allegato 3A.
- **Resilienza Offline & Auto-Drafting nello Stepper Visite**: Salvataggio automatico debounced in storage locale (`medwork_visit_draft_*`), badge visivo verde *"Bozza offline protetta"*, rilevamento e ripristino istantaneo di bozze non salvate in caso di caduta connessione o chiusura accidentale del browser, con pulizia automatica al salvataggio definitivo.
- **Centro Firma su Tablet & Kiosk Paziente (FEA)** (`FirmaGrafometricaCenter.jsx`): Interfaccia touch a pieno schermo ottimizzata per tablet/iPad per la sottoscrizione del lavoratore con valore di Firma Elettronica Avanzata (FEA), riepilogo dati lavoratore e giudizio, clausola legale Art. 41 comma 9 D.Lgs. 81/08 (ricorso 30gg), calcolo impronta SHA-256 in tempo reale, registro firme archiviate (`/api/signatures`) e tool integrato di verifica crittografica forense.
- **Accertamenti Strumentali Rapidi & Diagnostici (D.Lgs. 81/08)** (`InstrumentalExamsCard.jsx`): Modulo diagnostico avanzato integrato nello Step 2 dell'esame obiettivo con pannelli dedicati per Visiotest/Ergovision (visus naturale/corretto OD/OS, senso cromatico, stereopsi), Audiometria Tonale (soglia frequenze 500-8000 Hz, pattern normale e deficit/notch 4kHz da rumore), Spirometria (FVC %, FEV1 %, Indice di Tiffeneau %, deficit ostruttivo/restrittivo) e Screening Tossicologico / Drug Test rapido su urine (8 sostanze d'abuso con elenco ministeriale conforme) corredato da preset 1-click "✓ Tutti nella Norma" che valorizza e sintetizza istantaneamente tutti i test per l'Allegato 3A.
- **Fascicolo Storico Lavoratore (Clinical History Off-Canvas Drawer)** (`WorkerClinicalDrawer.jsx`): Drawer laterale clinico consultabile in qualsiasi fase della visita senza mai abbandonare lo stepper; recupera in tempo reale profilo di rischio, mansione, prescrizioni/limitazioni pregresse e l'intera sequenza temporale delle visite precedenti con parametri vitali e reperti, offrendo il travaso 1-click ("Copia reperti nello stepper") per confrontare o importare i dati della visita antecedente.
- **Flusso Ambulatorio Continuo ("⚡ Salva & Chiama Prossimo Paziente")**: Azione rapida ad alto rendimento che aggancia la coda pazienti del giorno (agenda odierna del cockpit / schedule o successione anagrafica dell'azienda attiva). Con 1 singolo clic salva la visita in corso e apre istantaneamente la cartella del lavoratore successivo in lista d'attesa, eliminando il ritorno al registro lavoratori.
- **Dettatura Vocale Clinica (Speech-to-Text)** (`VoiceDictationButton.jsx`): Trascrizione vocale istantanea a microfono integrata nei campi di testo clinici (Anamnesi Lavorativa, Personale, Familiare, Esame Obiettivo e Note Riservate) basata su Web Speech API nativa in lingua italiana (`it-IT`), con animazione ad onde pulsanti e fallback di sicurezza.
- **Generatore & Stampa Lettere di Convocazione Ufficiali (D.Lgs. 81/08 Art. 41)** (`RecallCampaignsCenter.jsx`): Generazione massiva e singola della lettera formale di convocazione su layout A4 pronta per la stampa (`window.print()`), con istruzioni obbligatorie (digiuno, occhiali da vista/lenti per VDT, documenti, liberatoria e firma per ricevuta).
- **Allegato 3B INAIL con Ispezione XML & Pre-Flight Validator** (`Allegato3BCenter.jsx`): Generazione XML conforme al DM 9/7/2012, ispezione syntax-highlighted a tutto schermo con copia negli appunti e download 1-click del file `.xml` pronto all'upload sul portale INAIL.
- **Tunnel 1-Click "Avvia Visita" da Scadenziario**: Avvio immediato visita pre-selezionando lavoratore, azienda e protocollo attivo
- **Centro Unificato Agenda & Pianificazione** (`AgendaPlanningCenter.jsx`): Fonde in un unico hub interattivo il **Calendario Visite & Appuntamenti** (griglia mensile, viste slot, doppio clic per creare appuntamento, popover con link questionario anamnestico) e lo **Scadenzario Normativo & Batch Session Planner** (calcolo scadenze protocolli 15-180gg, selezione multipla lavoratori, pianificazione massiva sessioni a slot sequenziali con medico assegnato, intervallo e location, sincronizzazione automatica tra tab).
- `MedicalVisitsController` — CRUD completo
- `AppointmentsCalendar` — Calendario visite e appuntamenti con **Interazione Rapida a Doppio Click**: doppio click su qualsiasi giorno del mese per aprire la modale interattiva di pianificazione appuntamento precompilata con la data selezionata, orario, ricerca/selezione del lavoratore, scelta della tipologia di visita (Periodica, Preventiva, Richiesta, Cambio Mansione, Rientro Malattia >60gg, Straordinaria, Vaccinazione, Esami Clinici), note e pulsanti diretti "Salva in Agenda" o "Apri Stepper Clinico (5 fasi)".
- `MedicalRecordsController` — CRUD completo cartelle sanitarie (Cartella 3A ricollocata sotto Sorveglianza Sanitaria) con **Visualizzatore Completo Scheda Visita & Storico Clinico**: tab dedicato per navigare cronologicamente tra tutte le visite mediche effettuate con visualizzazione per intero di parametri vitali (PA, FC, SpO2, BMI, Temp), esame obiettivo clinico, organi bersaglio, riscontri anamnestici, giudizio di idoneità a norma Art. 41 D.Lgs. 81/08 e download 1-click del certificato PDF (DPR 445/2000).
- `VisitJudgmentController` — Giudizi strutturati (OutcomeCode, Prescrizioni, Limitazioni, NextReviewDate)
- Calcolo automatico prossima scadenza da protocollo
- JobRole protocol fallback (se nessun PersonalProtocol, usa protocollo di mansione)
- Age-based cadence reduction (>50 anni: -20%, floor 30gg)
- `MedicalVisitAIController` — endpoint AI per supporto visita (implementato)
- `VisitExamsController` — esami specifici per visita

---

## 📋 Protocolli Sanitari

- CRUD protocolli con **DB persistence** (risolto da localStorage)
- Assegnazione a JobRole con cadenza e scadenza automatica
- Toggle active/inactive
- Steps JSON con N esami e N cadenze diverse
- `QuestionnairesController` + `QuestionnaireScoringService` per compliance
- `ComplianceController` + `ComplianceCenter.jsx` (5+ regole D.Lgs. 81/08)

---

## 📅 Scadenziario

- **Dashboard Scadenze con Avvio Diretto Visita**: Azione `Avvia Visita` per avviare la procedura clinica senza passaggi intermedi
- `DeadlineCalculationService` — calcolo automatico con JobRole fallback
- `ScadenziarioPeriodicityService` — service puro, integrato nel flusso visite
- `ActivityDeadlinesCenter.jsx`, `NominationsDeadlinesCenter.jsx`, `VaccinationDeadlinesCenter.jsx`, `SiteVisitDeadlinesCenter.jsx`
- `AppointmentsCenter.jsx` + `AppointmentsCalendar.jsx` + `AgendaCenter.jsx`
- `DashboardScadenze.jsx`

---

## 📝 Documenti e PDF (QuestPDF, server-side)

- `FitnessJudgmentPdfDocument.cs` — PDF giudizio idoneità legale (DPR 445/2000)
- `Allegato3APdfDocument.cs` — Cartella Sanitaria 3A conforme DM 9/7/2012
- `AnnualHealthReportPdfDocument.cs` — Relazione annuale art. 40
- `DocumentsController` — endpoint `allegato-3b/{id}/validate` e `allegato-3b/{id}/submit`
- `Allegato3BCenter.jsx` + `Allegato3BPreview.jsx`
- `SignatureController` + `ISignatureService` (RSA SHA-256)
- **Centro Giudizi & Firma Massiva Unificato**: Tab unificato sotto Sorveglianza Sanitaria che accorpa consultazione giudizi, selezione multipla (bulk checkbox), apposizione Firma Digitale PAdES con PIN e pipeline `Firma e Invia PEC Selezionati` con auto-dispatch
- `HealthPlanPreview.jsx` — antepiano piano sanitario

---

## 🔔 Notifiche e Comunicazioni

- `AlertsController` + `AlertMultiChannelService` — service multi-canale
- `INotificationTransport` interface (PEC, SMS, Push, WhatsApp, Email)
- `NotificationChannel` enum esteso (Pec/Push/WhatsApp)
- Log notifiche con TenantId server-side corretto
- `MockNotificationService` per retrocompatibilità
- **Sistema Notifiche UI Globale**: `showNotification()` grafico via Material-UI `Snackbar` + `Alert` con interceptor automatico a livello `window.alert` (zero popup modali nativi del browser in tutte le entità e moduli)
- ⚠️ Trasporti reali (PEC/Email) definiti come interface, non implementati

---

## ⚖️ Compliance e Audit

- `ComplianceController` con `ComplianceRuleEngine` (5+ regole D.Lgs. 81/08)
- `AuditController` — audit trail server-side immutabile
- `AuditCenter.jsx` — UI visualizzazione log
- GDPR-compliant: nessun dato cross-tenant, audit immutabile

---

## 📊 Reports e Analisi

- `ReportsCenter.jsx` — generazione report
- `AnalyticsCenter.jsx` — KPI generali
- `EnterpriseAnalyticsDashboard.jsx` — dashboard enterprise
- `BillingCenter.jsx` — gestione fatturazione

---

## 🏗️ Moduli Aggiuntivi

- `CompanyGroupsController` + `CompanyGroupsCenter.jsx`
- `MasterDataController`
- `CompanyNominationsController`
- `MedicalVisitAIController`
- `PhraseTemplatesController` + `PhraseTemplatesCenter.jsx`
- `QuestionnairesController` + `QuestionnairesCenter.jsx`
- `RecallCampaignsCenter.jsx`
- `ActivityDeadlinesController` + center
- `AppointmentsController` + Calendar
- `GlobalSearchModal.jsx`
- `BatchSignatureCenter.jsx`
- `HealthPlanPreview.jsx`
- `VisitPlanningCenter.jsx`
- `CrudEntityView.jsx`

---

## 🔒 Sicurezza

- Admin123! backdoor rimosso da produzione (solo in test fixtures)
- TenantId fallback → 401 (non più = 1)
- AlertMultiChannelService: TenantId iniettato dal contesto reale
- Audit trail server-side immutabile
- JWT secret: placeholder ancora presente (richiede Key Vault)
- EPPlus 8.7.0 license issue (richiede aggiornamento a 5+ o ClosedXML)

---

Vedere `SECURITY_AND_MULTI_TENANCY.md` per dettagli sulla sicurezza.
