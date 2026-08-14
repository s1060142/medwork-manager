# MedWork — Il Documento Definitivo
**Ruolo**: Product Owner + CTO + UX Lead + Medico Competente + QA Lead + Growth Lead
**Metrica Unica**: Un medico deve gestire significativamente più pazienti e visite con lo stesso tempo.
**Data**: Agosto 2026

---

# PARTE 1 — AUDIT SCREEN BY SCREEN

Ogni screen viene analizzata esattamente come la vivrebbe un medico competente che apre MedWork alle 8:00 di mattina.

---

## SCREEN 1 — LOGIN

### Scopo
Autenticazione del medico nel sistema.

### Stato Attuale
Esiste [`LoginCard.jsx`] con form email/password. Dual-mode: legacy config-based + database tenant-aware. Supporto JWT con expire 120 minuti.

### Problemi
- ❌ **Nessun campo "Ricordami"** — il medico si ri-logga ogni 2 ore durante le visite. Interrompere una visita per fare login è inaccettabile.
- ❌ **Nessun "Slug tenant" visibile** — l'utente non sa cosa inserire nel campo tenant.
- ❌ **Credenziali hardcoded** in appsettings.json — backdoor universale `Admin123!`.
- ❌ **JWT expire 120 minuti** senza refresh automatico — sessione scade durante la giornata.
- ❌ **Nessun SSO** (SPID/Google/Microsoft) — onboarding attrito massimo.
- ❌ **Nessun "Password dimenticata"** — utente bloccato senza supporto.

### Informazioni Mancanti
- Logo e nome studio medico nella pagina login (white-label)
- Feedback errore specifico (email non trovata vs password errata)

### Azioni Mancanti
- Refresh token silenzioso (auto-rinnovo sessione)
- Reset password via email
- "Ricordami 30 giorni"

### Tempo Perso dal Medico
- 3 login/giorno × 30 secondi = 1.5 min/giorno → **7.5 min/settimana persi**

### Redesign Raccomandato
- Email + password + checkbox "Ricordami 30 giorni"
- Link "Password dimenticata"
- Logo studio configurabile
- Refresh token automatico ogni 20 minuti in background
- Sessione persistente sul device aziendale del medico

### Priorità
🔴 CRITICA (sicurezza + UX bloccante)

---

## SCREEN 2 — DASHBOARD

### Scopo
Prima schermata dopo login. Deve dare al medico una visione immediata della giornata.

### Stato Attuale
Esistono due dashboard: `DashboardMedico.jsx` (KPI generali) e `DashboardScadenze.jsx` (scadenziario dettagliato). La navigazione tra le due richiede click di menu.

### Problemi
- ❌ **Non esiste una "dashboard del giorno"** — cosa devo fare OGGI?
- ❌ **Non c'è lista visite di oggi** — il medico non sa chi sta arrivando
- ❌ **KPI aggregati senza filtro temporale** — "totale visite" è inutile senza contesto
- ❌ **DashboardScadenze carica tutti gli endpoint senza paginazione** — con 500+ dipendenti, timeout garantito
- ❌ **Le scadenze mostrano "OVERDUE/DUE SOON" in inglese** — testo misto italiano/inglese
- ❌ **Nessuna azione rapida** dalla dashboard — per iniziare una visita devo navigare 3 schermate
- ❌ **Nessun alert proattivo** visibile ("3 lavoratori senza visita da >1 anno")
- ❌ **Nessuna vista calendario** — non vedo il mio schedule visivo

### Informazioni Mancanti
- Lista nominativa "visite di oggi" con ora, azienda, tipo visita
- "Visite in scadenza entro 7 giorni" con count per azienda
- "Giudizi da firmare" (documenti pronti ma non firmati)
- "Aziende con anomalie" (protocolli non conformi, visite overdue)
- Alert normativo (c'è una circolare MinLavoro che impatta i tuoi protocolli)

### Azioni Mancanti
- **Quick action**: "Inizia visita" (apre direttamente MedicalVisitStepper con lavoratore cercabile)
- **Quick action**: "Cerca lavoratore" (global search)
- **Quick action**: "Vedi scadenziario" (filtrato sull'azienda attiva)
- **Quick action**: "Genera Allegato 3B" per l'azienda selezionata

### Automazioni Mancanti
- Email digest giornaliero alle 7:30 con riepilogo giornata (deve già essere partita quando il medico apre l'app)
- Badge notifica per documenti in attesa di firma
- Alert automatico quando un lavoratore supera la scadenza visita

### Tempo Perso dal Medico
- 15-20 min/mattina per orientarsi: cosa ho oggi? Chi ha la visita? Cosa è scaduto?
- **100 min/settimana persi** per mancanza di dashboard orientata al giorno

### Redesign Raccomandato

```
┌─────────────────────────────────────────────────────────┐
│  Buongiorno, Dr. Rossi  •  Mercoledì 13 Agosto 2026     │
├─────────────┬───────────────┬────────────┬──────────────┤
│ OGGI        │ QUESTA        │ DA FIRMARE │ ANOMALIE     │
│ 8 visite    │ SETTIMANA     │ 3 giudizi  │ 2 aziende    │
│ 3 aziende   │ 23 scadenze   │            │ con overdue  │
├─────────────┴───────────────┴────────────┴──────────────┤
│ VISITE OGGI                          [+ Nuova visita]   │
│ ● 09:00  Rossi Mario    ACME SpA     Periodica          │
│ ● 10:00  Bianchi Anna   Beta Srl     Preventiva         │
│ ● 14:30  Verdi Carlo    Gamma Srl    Cambio mansione    │
├────────────────────────────────────────────────────────-┤
│ IN SCADENZA (7 giorni)              PER AZIENDA         │
│ • ACME SpA: 5 lavoratori scadono entro giovedì         │
│ • Beta Srl: 3 lavoratori scadono venerdì               │
└─────────────────────────────────────────────────────────┘
```

### Priorità
🔴 CRITICA (prima schermata vista ogni giorno)

---

## SCREEN 3 — GESTIONE AZIENDE

### Scopo
Registro delle aziende clienti con tutti i dati anagrafici, sedi, figure aziendali, medici assegnati.

### Stato Attuale
`CompanyProfileDialog.jsx` (479 righe) ha tab: Dati anagrafici, Dati fatturazione, Assegnazione medici, Figure aziendali. Dati anagrafici molto completi (ATECO, PEC, codice destinatario SDI, ecc.).

### Problemi
- ❌ **I protocolli NON sono visibili nel profilo azienda** — per sapere quale protocollo usa ACME SpA devo uscire e cercare altrove
- ❌ **Non c'è vista "tasso di compliance" per azienda** — ACME SpA: quanti lavoratori hanno visita aggiornata?
- ❌ **Non c'è link al DVR** — il documento più importante in medicina del lavoro non è allegabile
- ❌ **Nessun storico sopralluoghi** visibile nel profilo (SiteVisits esiste nel DB ma non nel profilo)
- ❌ **I dati fatturazione (codiceDestinatario SDI, CUP, CIG)** esistono nel form ma non vengono usati da nessun sistema di fatturazione reale
- ❌ **La ricerca aziende non ha filtri** avanzati (per città, ATECO, medico assegnato)
- ❌ **Non c'è import massivo aziende** da CSV/Excel

### Informazioni Mancanti
Tab mancante: **"Protocolli attivi"** — lista protocolli sanitari in uso con cadenza e compliance rate
Tab mancante: **"Statistiche sanitarie"** — visite totali, tasso idoneità, anomalie per questa azienda
Widget mancante: **"Prossime scadenze"** — i prossimi 5 lavoratori con visita in scadenza
Campo mancante: **DVR** — data, versione, allegato PDF

### Azioni Mancanti
- "Genera scadenziario PDF" per questa azienda (da mandare al RSPP)
- "Invia email scadenze" al referente aziendale
- "Genera Allegato 3B" per questa azienda
- "Genera Relazione art. 40" per questa azienda
- "Aggiungi sopralluogo" rapido

### Automazioni Mancanti
- Email automatica mensile al referente con lista scadenze del mese successivo
- Alert al medico quando un'azienda supera il 10% di lavoratori con visite overdue

### Redesign Raccomandato
Aggiungere 2 tab:
- **"Sorveglianza"**: protocolli attivi + compliance rate + prossime scadenze
- **"Documenti"**: DVR, contratto, sopralluoghi, relazioni annuali

### Priorità
🟠 ALTA

---

## SCREEN 4 — GESTIONE LAVORATORI

### Scopo
Registro anagrafico completo dei lavoratori con storico sanitario.

### Stato Attuale
`WorkersCenter.jsx` (528 righe): tabella con filtri per azienda/sede/stato. `EmployeeProfileDialog.jsx` (458 righe): tab Anagrafica, Sorveglianza, Fattori di rischio, Cartella sanitaria.

### Problemi Critici
- ❌ **La tabella carica TUTTI i lavoratori senza paginazione** — con 1.000+ dipendenti il browser muore
- ❌ **Lo stato "archiviato" è salvato in localStorage** (non nel database!) — se il medico cambia browser, i lavoratori "archiviati" riappaiono come attivi
- ❌ **La fitness classification si basa su regex su testo libero** (`if text.includes('non idone')`) — fragile e soggetta a falsi positivi/negativi
- ❌ **Non c'è una vista timeline storico visite** — la tab "Sorveglianza" mostra una lista piatta
- ❌ **Il profilo lavoratore non mostra i trend** dei parametri vitali (PA, peso, BMI nel tempo)
- ❌ **Non c'è "nuova visita" direttamente dal profilo lavoratore** — devo uscire, navigare alla sezione visite, poi cercare il lavoratore di nuovo
- ❌ **Cambio mansione non triggera alert protocollo** — se un lavoratore passa da ufficio a saldatura, nessun alert suggerisce di aggiornare il protocollo

### Informazioni Mancanti nel Profilo Lavoratore
- **Esami in scadenza/scaduti** secondo protocollo (non solo lista generica)
- **Esposizione cumulativa** (anni di esposizione a ogni agente di rischio)
- **Farmaci cronici** (campo dedicato, non note libere)
- **Medico di base** (spesso necessario per comunicazioni)
- **Gruppo sanguigno** (esiste nel form ma non nell'API — non persiste?)
- **Stato attuale protocollo** — quale è il protocollo corrente del lavoratore e quanto è conforme?

### Azioni Mancanti
- "Nuova visita" dal profilo lavoratore (1 click)
- "Stampa cartella sanitaria" completa
- "Invia scadenza via email" al lavoratore
- "Aggiungi fattore di rischio" inline senza uscire dal profilo
- "Variazione mansione" con alert automatico su protocollo

### Redesign Raccomandato
La lista lavoratori deve diventare una vera "lista di lavoro":
```
[Filtra per azienda] [Filtra per stato] [Cerca]          [+ Aggiungi]

● Rossi Mario      ACME SpA  Saldatore    ⚠ Visita scaduta 15gg fa   [Avvia visita]
● Bianchi Anna     Beta Srl  Impiegata    ✓ Visita OK (scade 12/2026) [Profilo]
● Verdi Carlo      Gamma     Magazziniere ⚠ Audiometria scaduta       [Avvia visita]
```
Ogni riga mostra lo **stato sanitario attuale** e ha un'azione rapida contestuale.

### Priorità
🔴 CRITICA (schermata più usata dopo la visita)

---

## SCREEN 5 — SCADENZIARIO

### Scopo
Visione complessiva di tutte le scadenze sanitarie: visite, esami, vaccinazioni, sopralluoghi, riunioni art. 35.

### Stato Attuale
`DashboardScadenze.jsx` (449 righe): tabelle separate per visite scadenti, esami programmati, vaccinazioni, site visits, doctor availabilities. Export CSV.

### Problemi
- ❌ **Carica tutto senza paginazione** — timeout con dataset reali
- ❌ **Vista solo a lista, nessuna vista calendario** — il medico non può vedere "il 15 ho 8 visite in ACME SpA"
- ❌ **Nessun raggruppamento per azienda** nella vista principale
- ❌ **Nessun filtro "mostra solo le mie prossime 2 settimane"** — default: mostra tutto
- ❌ **Le scadenze non sono collegate ai protocolli** — non so perché scade, solo quando scade
- ❌ **Non c'è azione di pianificazione** — posso vedere che Mario Rossi scade il 20, ma non posso prenotare la visita da qui
- ❌ **La vista "sopralluoghi" e "riunioni art. 35"** sono solo liste, nessuna integrazione calendario

### Automazioni Mancanti
- Calcolo automatico prossima scadenza dopo ogni visita (non manuale)
- Notifica email/SMS al lavoratore 30/15/7 giorni prima della scadenza
- Raggruppamento automatico per ottimizzare le giornate di visita in azienda (es. "il 15 hai 6 scadenze in ACME SpA — pianifica una giornata")
- Alert quando un'azienda supera il 20% di lavoratori overdue

### Redesign Raccomandato
3 viste disponibili:
1. **Lista** (attuale, migliorata con paginazione e filtri)
2. **Calendario** (drag-and-drop per pianificare le visite)
3. **Per azienda** (raggruppato per azienda con compliance rate)

### Priorità
🔴 CRITICA (cuore del prodotto)

---

## SCREEN 6 — VISITA MEDICA ⭐ [AREA PRINCIPALE]

### Analisi dettagliata nella sezione dedicata.

---

## SCREEN 7 — CARTELLA SANITARIA (3A)

### Scopo
Cartella sanitaria e di rischio del lavoratore conforme all'Allegato 3A D.Lgs. 81/08.

### Stato Attuale
`CartellaSanitariaCenter.jsx` esiste ma è collegato al backend v2 (`api/medical-records-v2`) che implementa solo un CRUD base. Non c'è un template strutturato conforme all'Allegato 3A reale. Il modello `MedicalRecord` ha solo `MedicalHistory`, `Notes`, `CurrentTherapies`, `Status` — ben lontano dalla struttura completa 3A.

### Problemi
- ❌ **Il modello dati non è conforme all'Allegato 3A** — mancano decine di campi obbligatori
- ❌ **Non c'è versioning della cartella** — ogni modifica sovrascrive
- ❌ **Non c'è firma digitale sulla cartella** — documento legalmente invalido
- ❌ **Non c'è sezione "Esposizioni professionali"** strutturata (anni, agenti, livelli)
- ❌ **Non c'è sezione "Accertamenti sanitari"** con esiti e valori numerici
- ❌ **Non c'è PDF della cartella** generabile

### Campi Mancanti nel Modello 3A (Allegato DM 9 Luglio 2012)
```
Sezione A: Dati anagrafici e lavorativi (parzialmente presente)
Sezione B: Anamnesi (parzialmente presente)
Sezione C: Esposizioni occupazionali (MANCANTE)
  - Agente, livello, durata esposizione
  - DPI utilizzati
Sezione D: Accertamenti sanitari (parzialmente presente come VisitExam)
  - Tipo esame, data, risultato, valori, laboratorio
Sezione E: Giudizio idoneità (parzialmente presente)
Sezione F: Annotazioni del medico (parzialmente presente come Notes)
```

### Priorità
🔴 CRITICA (obbligatorio per legge)

---

## SCREEN 8 — PROTOCOLLI

### Scopo
Gestione dei protocolli sanitari per mansione/rischio con cadenza visite e accertamenti.

### Stato Attuale
`ProtocolsCenter.jsx` (200 righe): form di creazione (nome, cadenza, obiettivo, 1 rischio, 1 esame) + tabella. **CRITICO: i protocolli vengono salvati in localStorage, non nel database.**

### Problemi
- ❌ **I protocolli sono salvati in localStorage** — non persistono se si cambia browser. Non sono mai sincronizzati col backend. Questa è una feature simulata, non reale.
- ❌ **Un protocollo può avere 1 solo fattore di rischio e 1 solo esame** — un protocollo reale ha N esami con N cadenze diverse (es. audiometria annuale, spirometria biennale, emocromo annuale)
- ❌ **Non c'è versioning del protocollo** — quando modifico un protocollo, le visite passate non sanno quale versione era attiva
- ❌ **Non c'è assegnazione automatica protocollo → mansione** — l'associazione è manuale
- ❌ **Non c'è compliance check** inline mentre si crea il protocollo
- ❌ **Non c'è library di template** per ATECO/mansione
- ❌ **Il bottone "+ Nuovo protocollo" salva in localStorage** prima di riempire il form — comportamento erratico

### Modello Dati Necessario
```
Protocol
├── Name, Description, LawReference, Version
├── JobRoleId (mansione target)
├── IsTemplate (è un template pubblico?)
├── Steps[] (lista accertamenti)
│   ├── ExamTypeId
│   ├── FrequencyDays (cadenza specifica per questo esame)
│   ├── IsRequired
│   └── ConditionExpression (opzionale: "solo se >50 anni")
└── RiskFactors[] (fattori di rischio che triggera)
```

### Priorità
🔴 CRITICA (il modello dati attuale è fondamentalmente sbagliato)

---

## SCREEN 9 — GIUDIZI DI IDONEITÀ

### Scopo
Registrazione formale del giudizio di idoneità alla mansione con prescrizioni e limitazioni.

### Stato Attuale
`GiudizioIdoneitaCenter.jsx` (148 righe): dropdown esito, campi testo per prescrizioni/limitazioni, data prossima revisione. Richiede un `medicalVisitId` preselezionato — non funziona in modo autonomo.

### Problemi
- ❌ **Il giudizio è collegato a `medicalVisitId` ma non c'è UI per selezionare la visita** — il campo arriva via prop dall'esterno. Se apri il GiudizioIdoneitaCenter direttamente, vedi solo "Seleziona una visita medica".
- ❌ **Le prescrizioni e limitazioni sono campi testo libero** — non strutturate, non analizzabili, non standarizzate
- ❌ **Non c'è "Notifica datore di lavoro"** dopo il giudizio — obbligatorio per legge (art. 41 D.Lgs. 81/08)
- ❌ **Non c'è PDF del giudizio generabile** — il documento più importante del medico competente non esiste
- ❌ **Non c'è traccia del "ricevuto da lavoratore"** — il lavoratore deve ricevere copia del giudizio
- ❌ **Non c'è ricorso** — il lavoratore ha diritto a ricorrere entro 30gg. Non c'è campo per registrarlo.
- ❌ **Il giudizio "In attesa di accertamenti"** non genera automaticamente le scadenze degli accertamenti da completare

### Campi Legalmente Obbligatori Mancanti
- Numero progressivo del giudizio
- Estremi del ricorrente (datore di lavoro + lavoratore)
- Mansione specifica (non solo "generico")
- Data comunicazione al datore di lavoro
- Data ricevuta da lavoratore
- Organo di vigilanza (in caso di "non idoneo")
- Firma digitale del medico

### Priorità
🔴 CRITICA (documento con valenza legale)

---

## SCREEN 10 — DOCUMENTI

### Scopo
Generazione e gestione dei documenti prodotti (giudizi, cartelle, 3B, relazioni annuali, sopralluoghi).

### Stato Attuale
`DocumentsController` esiste ma GenerateSanitaryPlan/GenerateAllegato3B/GenerateFitnessJudgment ritornano stub strings. L'Allegato 3B ha un XML minimale che non è conforme alla specifica INAIL reale.

### Problemi
- ❌ **Nessun documento reale è generabile** — tutto è stub
- ❌ **Non c'è un archivio documenti** — dove vanno i PDF generati?
- ❌ **Non c'è firma digitale** su nessun documento
- ❌ **Non c'è versionamento** dei documenti
- ❌ **Non c'è workflow di approvazione** (es. bozza → revisione → firmato → inviato)
- ❌ **Non c'è integrazione PEC** per invio certificato dei documenti
- ❌ **Non c'è numerazione progressiva** per i giudizi (obbligatoria per registro)

### Priorità
🔴 CRITICA

---

## SCREEN 11 — REPORTS E ANALISI

### Scopo
Elaborazione statistica per la relazione annuale art. 40 e per KPI del medico.

### Stato Attuale
`ReportsCenter.jsx` (988 righe): il componente più grande del frontend. Genera Allegato 3B, relazione annuale art. 40, report visite, analisi rischi. Tutto viene generato **client-side con jsPDF** dai dati in memoria.

### Problemi
- ❌ **Generazione PDF client-side** — lenta, non firma-digitale-compatibile, non archivio-compatibile
- ❌ **Il "tasso di compliance" è calcolato localmente** su dati potenzialmente non aggiornati
- ❌ **La relazione art. 40 non ha un campo "commento del medico"** strutturato — solo statistiche
- ❌ **Non c'è export Word** della relazione (molti medici devono inviarla in formato editabile al datore)
- ❌ **I dati "Allegato 3B" nel frontend usano regex su nomi di rischio** (es. `keys: ['chimic']`) — fragile e non conforme ai codici INAIL ufficiali
- ❌ **Non c'è storico dei report generati** — ogni generazione è one-shot
- ❌ **Non c'è schedulazione** (es. "genera e invia relazione art. 40 ogni 1° febbraio")

### Priorità
🟠 ALTA

---

## SCREEN 12 — NOTIFICHE

### Scopo
Comunicazioni verso lavoratori, datori di lavoro, medici su scadenze, giudizi, richieste.

### Stato Attuale
`AlertMultiChannelService` esiste con interfaccia pulita ma `INotificationTransport` è implementato solo con `ConsoleNotificationTransport` (stampa su console). Il `MockNotificationService` è ancora in DI per retrocompatibilità.

### Problemi
- ❌ **Nessun canale reale** — tutto va su console del server
- ❌ **Nessun template email HTML** — anche se aggiungessi SendGrid, non ci sono template
- ❌ **Nessun opt-in/opt-out** per il lavoratore
- ❌ **Nessuna schedulazione** (cron) — i reminder vanno inviati in anticipo, non su richiesta
- ❌ **Non c'è log di consegna** visibile nel frontend (solo in DB)
- ❌ **Non c'è invio PEC** reale (Aruba, InfoCert, Poste)
- ❌ **TenantId hardcoded = 1** in AlertMultiChannelService

### Priorità
🔴 CRITICA (è il modo in cui il medico comunica con aziende e lavoratori)

---

## SCREEN 13 — COMPLIANCE

### Scopo
Verifica della conformità dei protocolli alle norme D.Lgs. 81/08.

### Stato Attuale
`ComplianceCenter.jsx` è un form manuale dove il medico inserisce a mano riskFactors, examTypeNames, workerAge, ecc. e clicca "Valuta". Ha 5 regole hardcoded. Non è integrato con i dati reali del sistema.

### Problemi
- ❌ **Il medico deve inserire manualmente i dati** — sconfina nell'inutilità. Non è integrato con le visite reali.
- ❌ **Solo 5 regole** (audiometria per rumore, lab per chimico, minorenne, non idoneo senza note, visita senza esami)
- ❌ **Non valuta protocolli esistenti** — non c'è "valuta tutti i protocolli del tenant"
- ❌ **La valutazione è one-shot, non continua** — non c'è un job notturno che verifica compliance
- ❌ **Il changelog normativo è manuale** (l'utente incolla testo raw)

### Priorità
🟡 MEDIA (importante ma non bloccante per il lancio)

---

## SCREEN 14 — AMMINISTRAZIONE

### Scopo
Gestione utenti, ruoli, permessi, impostazioni tenant, audit trail.

### Stato Attuale
`AuditCenter.jsx`: audit trail in localStorage (resettabile dall'utente con "Svuota"). `SettingsCenter.jsx`: impostazioni. Role/Permission RBAC completo nel backend ma senza UI dedicata.

### Problemi Critici
- ❌ **Audit trail in localStorage** — cancellabile dall'utente, non immutabile, non server-side. È il contrario di un audit trail GDPR-compliant.
- ❌ **Nessuna UI per gestione utenti** (invita collaboratore, cambia ruolo, disabilita account)
- ❌ **Nessuna UI per gestione ruoli e permessi** — RBAC c'è nel backend ma non c'è interfaccia
- ❌ **Nessuna pagina impostazioni studio** (logo, intestazione medico per PDF, numeri d'ordine, PEC configurata)
- ❌ **Nessun log di accesso** — chi ha visualizzato la cartella di Mario Rossi?

### Priorità
🟠 ALTA

---

# PARTE 2 — VISITA MEDICA: IL WORKSPACE IDEALE

## Problema Fondamentale

Il flusso attuale richiede che il medico navighi su schermata separate per vedere:
- I rischi del lavoratore (→ scheda lavoratore)
- L'ultima visita (→ storico visite)
- Gli esami del protocollo (→ protocolli)
- I parametri vitali precedenti (→ cartella sanitaria)

**Il medico abbandona la visita almeno 4 volte per recuperare informazioni.**

## Il Workspace Visita Ideale

```
┌─────────────────── VISITA MEDICA — Mario Rossi ──────────────────────────────┐
│                                                              [Salva] [Chiudi] │
├───────────────────────────────────┬──────────────────────────────────────────┤
│  CONTESTO LAVORATORE (sidebar)    │  VISITA IN CORSO                         │
│                                   │                                          │
│  👤 Mario Rossi, 47 anni, M       │  Tipo: [Periodica        ▼]              │
│  🏭 ACME SpA — Saldatore          │  Data: [13/08/2026]                      │
│  📋 Rischi: Rumore >85dB,         │                                          │
│     Fumi saldatura, VDT           │  ── ANAMNESI ─────────────────────────── │
│                                   │  [Copia da ultima visita 12/2025] ← BTN  │
│  ── ULTIMA VISITA ─────────────   │                                          │
│  12/08/2025 • Periodica           │  Lavorativa: [________________]          │
│  Idoneo con prescrizioni          │  Personale:  [________________]          │
│  Prossima: 12/08/2026 ⚠ OGGI     │  Familiare:  [________________]          │
│                                   │  Frase rapida: [cerca...] [★ preferiti]  │
│  ── TREND VITALI ─────────────    │                                          │
│  PA: 135/82 → 138/85 → 142/88 📈  │  ── ESAME OBIETTIVO ──────────────────── │
│  BMI: 26.1 → 26.8 → 27.2 📈       │                                          │
│  SpO2: 98% → 97% → 97%           │  Cardiovascolare: [✓ nella norma]        │
│                                   │  Respiratorio:   [✓ nella norma]        │
│  ── PROTOCOLLO ATTIVO ─────────   │  Muscoloschel.:  [✓ nella norma]        │
│  Prot. Saldatori v2.1             │  Neurologico:    [✓ nella norma]        │
│  ✓ Audiometria (fatta 01/2026)   │  Udito:          [▼ espandi anomalia]   │
│  ⚠ Spirometria (scaduta 03/2026) │  Visus:          [✓ nella norma]        │
│  ✓ Emocromo (fatto 01/2026)      │                                          │
│  ⚠ Rx torace (scad. 06/2026)     │  ── ACCERTAMENTI ──────────────────────── │
│                                   │  Audiometria:  [Eseguita] [Allegato ↗]  │
│  ── VACCINAZIONI ──────────────   │  Spirometria:  [Non eseguita — scaduta] │
│  ✓ Tetano (2023, scade 2033)     │  Emocromo:     [Eseguita] [Allegato ↗]  │
│  ⚠ Epatite B (scade 12/2026)     │  Rx torace:    [Non eseguita]           │
│                                   │                                          │
│  ── ULTIMI GIUDIZI ────────────   │  ── GIUDIZIO DI IDONEITÀ ──────────────── │
│  2025: Idoneo con prescr.        │  Esito: [Idoneo con prescrizioni  ▼]    │
│  2024: Idoneo con prescr.        │                                          │
│  2023: Idoneo                    │  Prescrizioni (seleziona o scrivi):      │
│                                   │  ☑ Uso obbligatorio otoprotettori       │
│  [Suggerimento AI]               │  ☐ Visita oculistica annuale            │
│  ⚡ Basato su 3 anni: il rischio  │  ☐ Controllo PA semestrale              │
│  PA ipertensiva è in aumento.    │  + Aggiungi prescrizione libera          │
│  Valuta prescriz. cardiologica.  │                                          │
│                                   │  Limitazioni: [________________]        │
│                                   │  Prossima visita: [12/08/2027] (auto ✓) │
│                                   │                                          │
│                                   │  [💾 Salva visita] [📄 Genera PDF]      │
│                                   │  [✉ Notifica datore] [🖊 Firma]        │
└───────────────────────────────────┴──────────────────────────────────────────┘
```

## Flusso Ideale: 0 navigazioni esterne

1. **Apri la visita**: sidebar carica automaticamente tutto il contesto del lavoratore
2. **Anamnesi**: click "Copia da ultima visita" → pre-compilata in 1 secondo → modifica solo le differenze
3. **Esame obiettivo**: tutto "nella norma" per default → click sulle sezioni anomale per espandere
4. **Accertamenti**: la lista viene dal protocollo → stato di ognuno (eseguito/mancante/scaduto) è già visibile
5. **Giudizio**: dropdown + checklist prescrizioni (non campo libero) → suggerimento AI come nota (non vincolante)
6. **Scadenza**: calcolata automaticamente dal protocollo → modificabile
7. **Salva + PDF + Notifica**: 3 azioni in fondo alla pagina → tutto in 1 click ciascuna

## Calcolo Tempo Risparmiato

| Task | Tempo Attuale | Tempo Ideale | Risparmio |
|---|---|---|---|
| Aprire contesto lavoratore | 60 sec | 0 sec (sidebar auto) | 60 sec |
| Anamnesi (copie da ultima) | 4 min | 30 sec | 3:30 |
| Esame obiettivo (tutto da zero) | 3 min | 45 sec | 2:15 |
| Inserimento accertamenti | 2 min | 30 sec | 1:30 |
| Calcolo prossima scadenza | 1 min | 0 sec (auto) | 1 min |
| Generare PDF giudizio | 10 min (Word) | 5 sec (1 click) | 9:55 |
| **Totale per visita** | **~21 min** | **~7 min** | **~14 min** |

**14 minuti risparmiati per visita × 20 visite/giorno = 280 minuti/giorno = 4h 40min recuperate.**
Con tariffa medico €80/h = **€373/giorno di valore generato** per medico.

---

# PARTE 3 — STRATEGIA VS CARTSAN

## Premessa: CartSan nel Mercato Italiano

CartSan è il competitor più citato come market leader tra i software moderni (non legacy) di medicina del lavoro in Italia. È web-based, cloud, e ha un'interfaccia più moderna dei competitor storici.

## Analisi Modulo per Modulo

| Modulo | CartSan (stimato) | MedWork Attuale | MedWork può essere 10× meglio? |
|---|---|---|---|
| **Anagrafica lavoratori** | ✅ Completa | ✅ Completa | No — parity è sufficiente |
| **Anagrafica aziende** | ✅ Con ATECO, DVR | ✅ Buona (manca DVR link) | No — parity |
| **Protocolli** | ✅ Multi-step, per mansione | ❌ 1 rischio + 1 esame (localStorage) | **Sì** — multi-step + compliance check |
| **Visita medica** | ✅ Strutturata, con template | ⚠️ Stepper basic, no sidebar contesto | **Sì** — workspace unificato |
| **Giudizio idoneità** | ✅ PDF integrato | ❌ Nessun PDF | **Sì** — con prescrizioni strutturate |
| **Cartella 3A** | ✅ Conforme DM 2012 | ❌ Struttura incompleta | No — parity è l'obiettivo |
| **Allegato 3B INAIL** | ✅ Conforme, invio diretto | ❌ XML stub minimale | No — parity è necessaria |
| **Scadenziario** | ✅ Con alert | ⚠️ Presente ma senza automazioni | **Sì** — email digest + pianificazione |
| **Relazione art. 40** | ✅ Semi-automatica | ⚠️ Client-side, incompleta | No — parity |
| **Notifiche** | ⚠️ Email base | ❌ Solo console | **Sì** — multi-canale + digest |
| **Mobile** | ❌ Non nativo | ❌ Non esiste | **Sì** — offline-first unico nel mercato |
| **Portale aziende** | ❌ Non esiste (stimato) | ❌ Non esiste | **10× sì** — unico nel mercato |
| **Portale lavoratori** | ❌ Non esiste (stimato) | ❌ Non esiste | **10× sì** |
| **AI charting** | ❌ Non esiste | ❌ Stub | **10× sì** |
| **API aperte** | ❌ Closed | ✅ REST API | **Sì** — vantaggio per integrazioni |
| **Pricing** | Licenza/anno costosa | ✅ SaaS freemium | **Sì** — modello superiore |

## Feature Parity Requirements (prerequisiti per competere con CartSan)

Senza queste, MedWork non è neanche nella stessa categoria:
1. Protocolli multi-step per mansione (persistiti nel DB, non localStorage)
2. Cartella 3A conforme DM 2012
3. PDF giudizio idoneità con firma
4. Allegato 3B INAIL conforme
5. Scadenziario con alert automatici

## Differenziatori (dove MedWork può vincere)

1. **UX moderna** (già presente — vantaggio reale vs CartSan e tutti i legacy)
2. **SaaS cloud nativo multi-tenant** (no installazione, no IT aziendale)
3. **Pricing freemium** (abbassa la barriera all'ingresso)
4. **API aperte** (partner HR, integratori)
5. **Portale aziende self-service** (non esiste nei competitor)
6. **AI charting** (6-12 mesi di lavoro)

## Market-Winning Features (rendono MedWork la scelta preferita)

1. **Workspace visita unificato** — il medico non esce mai dalla schermata durante la visita
2. **Portale aziende self-service** — il datore di lavoro non chiama più il medico
3. **Email digest proattivo** — il medico è sempre aggiornato senza aprire il software
4. **App mobile offline** — visite in cantiere senza connettività (nessun competitor)
5. **Import migrazione da CartSan/Winasped** — zero attrito al cambio

---

# OUTPUT 1 — SOFTWARE MAP COMPLETA

```
MEDWORK PLATFORM
│
├── 🔐 AUTENTICAZIONE
│   ├── Features: Login email/password, JWT, refresh token, SSO (stub SPID/CIE)
│   ├── Actions: Login, Logout, Reset password, Refresh sessione
│   ├── Automations: Refresh token silenzioso ogni 20 min
│   ├── Business Rules: Session 30gg con ricordami, 2h senza
│   └── Missing: Reset password email, SSO reale, banner white-label
│
├── 📊 DASHBOARD
│   ├── Features: KPI aggregati, scadenziario, alert, quick actions
│   ├── Actions: Avvia visita, Cerca lavoratore, Filtra per azienda
│   ├── Automations: Email digest 7:30, badge notifiche, alert overdue
│   ├── Documents: Nessuno (navigazione hub)
│   └── Missing: Vista "oggi", lista visite giornaliere, calendario
│
├── 🏭 GESTIONE AZIENDE
│   ├── Features: Anagrafica, sedi, figure aziendali, medici assegnati
│   ├── Actions: CRUD azienda, assegna medico, aggiungi contatto, aggiungi sede
│   ├── Automations: Email mensile scadenze al referente, alert overdue > 10%
│   ├── Documents: Contratto, DVR (mancante), relazione annuale
│   ├── Integrations: HR import CSV (presente), Zucchetti (futuro)
│   └── Missing: Tab protocolli attivi, tab statistiche sanitarie, upload DVR
│
├── 👤 GESTIONE LAVORATORI
│   ├── Features: Anagrafica completa, rischi, storico visite, cartella 3A, vaccinazioni
│   ├── Actions: CRUD lavoratore, aggiungi rischio, aggiungi visita, stampa cartella
│   ├── Automations: Alert scadenza visita, alert cambio mansione → aggiorna protocollo
│   ├── Documents: Cartella 3A, giudizi, referti allegati
│   ├── Integrations: HR sync (mancante), import CSV
│   └── Missing: Paginazione, stato archiviato server-side, trend parametri vitali
│
├── 📅 SCADENZIARIO
│   ├── Features: Vista scadenze per tipo (visite, esami, vaccinazioni, sopralluoghi)
│   ├── Actions: Filtra, esporta CSV, pianifica visita, invia reminder
│   ├── Automations: Calcolo automatico scadenza post-visita, reminder 30/15/7gg
│   ├── Documents: Scadenziario PDF per azienda
│   └── Missing: Vista calendario, raggruppamento per azienda, pianificazione ottimizzata
│
├── 🏥 VISITA MEDICA [CORE]
│   ├── Features: Stepper anamnesi→obiettivo→giudizio, copia ultima visita, accertamenti
│   ├── Actions: Crea visita, salva bozza, genera PDF, firma, notifica datore
│   ├── Automations: Pre-carica contesto, calcola scadenza, suggerimento AI (futuro)
│   ├── Documents: PDF giudizio (mancante), PDF referto (mancante)
│   ├── Business Rules: Calcolo scadenza da protocollo, compliance check esami
│   └── Missing: Sidebar contestuale, workspace unificato, PDF, firma digitale
│
├── 📋 CARTELLA SANITARIA (3A)
│   ├── Features: Anamnesi, esame obiettivo, accertamenti, giudizi storici
│   ├── Actions: Compila, versiona, firma, stampa
│   ├── Documents: PDF cartella 3A conforme DM 9/7/2012
│   └── Missing: Conformità completa DM 2012, firma, versioning, PDF
│
├── 📝 PROTOCOLLI
│   ├── Features: CRUD protocollo, assegnazione a mansione
│   ├── Actions: Crea, modifica, attiva/disattiva, assegna a lavoratore
│   ├── Business Rules: Compliance check vs D.Lgs. 81/08
│   └── Missing: Multi-step per esame, DB persistence (ora localStorage!), library ATECO
│
├── ⚖️ GIUDIZI IDONEITÀ
│   ├── Features: Dropdown esito, prescrizioni, limitazioni, data prossima
│   ├── Actions: Salva giudizio, genera PDF, notifica datore, registra ricevuta lavoratore
│   ├── Documents: PDF giudizio (mancante), registro giudizi progressivo
│   └── Missing: PDF, firma, numerazione progressiva, notifica legale, ricorso
│
├── 📄 DOCUMENTI
│   ├── Features: Allegato 3B XML (stub), stub PDF giudizio, stub cartella
│   ├── Actions: Genera, valida XSD, invia INAIL, firma, archivia
│   ├── Documents: 3B XML, PDF giudizio, PDF cartella, PDF relazione art. 40
│   └── Missing: Tutto — tutti i documenti sono stub non utilizzabili
│
├── 📊 REPORT E ANALISI
│   ├── Features: Relazione art. 40, Allegato 3B client-side, statistiche visite
│   ├── Actions: Genera PDF, esporta, filtra per azienda/anno
│   ├── Automations: Genera e invia relazione 1 febbraio (futuro)
│   └── Missing: Server-side, storico report, invio automatico
│
├── 🔔 NOTIFICHE
│   ├── Features: Multi-channel interface (PEC/SMS/Push/Email/WhatsApp)
│   ├── Actions: Invia singola, invia bulk, vedi log consegna
│   ├── Automations: Reminder scadenze, digest giornaliero, email mensile aziende
│   └── Missing: Trasporti reali (solo console), template email, cron scheduler
│
├── ⚖️ COMPLIANCE
│   ├── Features: Evaluation engine (5 regole), changelog normativo (manuale)
│   ├── Actions: Valuta protocollo, carica changelog
│   └── Missing: Integrazione con dati reali, job notturno, più regole
│
└── ⚙️ AMMINISTRAZIONE
    ├── Features: RBAC (backend), audit trail (localStorage!), impostazioni
    ├── Actions: Gestisci utenti, configura ruoli, vedi audit
    └── Missing: UI gestione utenti, audit trail server-side, impostazioni studio
```

---

# OUTPUT 2 — STRUTTURA NAVIGAZIONE IDEALE

## Sidebar Principale

```
MedWork
│
├── 🏠  Home / Dashboard del giorno
│
├── 🔍  [CERCA LAVORATORE] ← sempre visibile in cima
│
├── ── CLINICA ──
│
├── 🏥  Visite mediche
│   ├── Nuova visita
│   ├── Visite di oggi
│   ├── Tutte le visite
│   └── Bozze
│
├── 📅  Scadenziario
│   ├── Panoramica
│   ├── Per azienda
│   └── Calendario
│
├── ── ANAGRAFICHE ──
│
├── 🏭  Aziende
│   ├── Tutte le aziende
│   └── Gruppi aziendali
│
├── 👤  Lavoratori
│   ├── Tutti i lavoratori
│   ├── Per mansione
│   └── Per rischio
│
├── 👨‍⚕️  Medici
│
├── ── PROTOCOLLI ──
│
├── 📋  Protocolli sanitari
│   ├── I miei protocolli
│   └── Library template
│
├── ⚠️  Fattori di rischio
│
├── ── DOCUMENTI ──
│
├── 📄  Documenti
│   ├── Giudizi idoneità
│   ├── Cartelle 3A
│   ├── Allegato 3B
│   └── Relazioni art. 40
│
├── ── ANALYTICS ──
│
├── 📊  Report
│   ├── Relazione annuale
│   ├── KPI medico
│   └── Statistiche per azienda
│
├── ── SISTEMA ──
│
├── ⚖️  Compliance
├── 🔔  Notifiche
├── 📜  Audit trail
└── ⚙️  Impostazioni
```

## Quick Actions (barra superiore)

```
[🔍 Cerca lavoratore...] [+ Nuova visita] [🔔 3 notifiche] [👤 Dr. Rossi ▼]
```

## Keyboard Shortcuts

| Shortcut | Azione |
|---|---|
| `Ctrl+K` | Apri ricerca globale lavoratore |
| `Ctrl+N` | Nuova visita |
| `Ctrl+S` | Salva (in qualsiasi form aperto) |
| `Ctrl+P` | Stampa / Genera PDF (in contesto documento) |
| `Esc` | Chiudi dialog/modal |
| `Alt+1..9` | Naviga alle sezioni del menu |
| `Tab` | Focus campo successivo nel form |
| `Ctrl+Z` | Annulla ultima modifica (in visita) |

## Global Search

Risultati di ricerca unificata per:
- Lavoratore per nome / codice fiscale
- Azienda per nome / P.IVA
- Visita per data / tipo
- Protocollo per nome
- Documento per numero protocollo

Shortcut: sempre accessibile con `Ctrl+K` o cliccando sulla barra di ricerca in header.

---

# OUTPUT 3 — MISSING FEATURES REPORT

## 🔴 CRITICAL — Bloccano il lancio in produzione

| # | Feature | Impatto | Note |
|---|---|---|---|
| C1 | **Fix backdoor password hardcoded** | Data breach universale | `if (password == "Admin123!") return true` |
| C2 | **JWT secret in configurazione esterna** | Token forgiabili | Placeholder "CHANGE_THIS" in produzione |
| C3 | **TenantId fallback → 401 invece di =1** | Cross-tenant data leak | |
| C4 | **Protocolli persistiti nel DB** (ora localStorage) | Dati persi al cambio browser | |
| C5 | **PDF giudizio idoneità server-side** | Documento legale non generabile | Prerequisito legale assoluto |
| C6 | **Allegato 3B INAIL con XSD reale completo** | Violazione normativa | XML stub non conforme |
| C7 | **Calcolo automatico prossima scadenza da protocollo** | Core value assente | |
| C8 | **Cartella 3A conforme DM 9 Luglio 2012** | Non conformità normativa | Struttura dati incompleta |
| C9 | **Audit trail server-side** (ora localStorage cancellabile) | Violazione GDPR art. 5 | |
| C10 | **Notifiche email reali** (ora solo console) | Feature annunciata che non funziona | |
| C11 | **Paginazione API** | Timeout con > 500 dipendenti | |
| C12 | **Firma digitale documenti** | Giudizi legalmente invalidi senza | |
| C13 | **Archiviazione lavoratori server-side** (ora localStorage) | Stato perso al cambio browser | |
| C14 | **EPPlus licenza commerciale o sostituzione** | Violazione copyright | |

## 🟠 HIGH — Richiesti entro 60 giorni dal lancio

| # | Feature | Impatto | Note |
|---|---|---|---|
| H1 | **Workspace visita unificato con sidebar contestuale** | -14 min/visita | Il più alto ROI per medico |
| H2 | **Copia ultima visita come template** | -80 min/giorno | Quick win |
| H3 | **Esame obiettivo strutturato "nella norma"** | -60 min/giorno | |
| H4 | **Dashboard "il mio giorno"** | 15 min/mattina salvati | Prima cosa vista ogni giorno |
| H5 | **Email digest scadenze giornaliero** | Retention +25% | Habit loop |
| H6 | **Import migrazione da competitor (CSV wizard)** | Sblocca acquisizione | |
| H7 | **Relazione annuale art. 40 semi-automatica server-side** | 4h/azienda salvate | |
| H8 | **Gestione utenti UI (invita collaboratore)** | Multi-utente bloccato | |
| H9 | **Prescrizioni standardizzate (checklist) nel giudizio** | Dati strutturati + velocità | |
| H10 | **Ricerca globale con autocomplete** | -25 min/giorno navigazione | |
| H11 | **Notifica datore di lavoro post-giudizio** | Obbligatorio art. 41 | |
| H12 | **Filtri avanzati su WorkersCenter** | Usabilità con grandi dataset | |
| H13 | **Stato compliance azienda** nel profilo aziendale | Visibilità immediata | |
| H14 | **Upload e link DVR** nel profilo azienda | Informazione clinicamente critica | |
| H15 | **Global exception handler + structured logging** | Diagnosi produzione | |

## 🟡 MEDIUM — Richiesti entro 4 mesi

| # | Feature | Impatto |
|---|---|---|
| M1 | Portale aziende self-service (read-only) | Switch trigger per datori |
| M2 | Template frasi anamnesi con shortcode | -15 min/giorno |
| M3 | Email/PEC mensile automatica alle aziende | 4h/mese salvate |
| M4 | Library protocolli per ATECO (50 template) | Onboarding nuova azienda: 5 min |
| M5 | Trend parametri vitali nel profilo lavoratore | Valore clinico alto |
| M6 | Vista calendario nello scadenziario | Pianificazione visiva |
| M7 | Raggruppamento scadenze per ottimizzare giornate in azienda | Riduzione km medico |
| M8 | GDPR consent workflow con log | Conformità normativa |
| M9 | "Nuova visita" dal profilo lavoratore (1 click) | UX friction reduction |
| M10 | Vaccinazioni visibili nella sidebar visita | Informazione clinica mancante |
| M11 | Storico giudizi nel profilo lavoratore con trend | Analisi clinica nel tempo |
| M12 | Alert variazione mansione → proposta aggiornamento protocollo | Automazione clinica |
| M13 | Numerazione progressiva giudizi (registro) | Obbligatorio per controlli |
| M14 | Multi-step protocollo (N esami con N cadenze) | Modello dati corretto |
| M15 | Versioning protocolli | Audit trail su modifiche |

## 🟢 LOW — Piano 6-12 mesi

| # | Feature |
|---|---|
| L1 | App mobile offline-first |
| L2 | AI pre-compilazione vocale (Whisper) |
| L3 | OCR DVR → proposta protocollo |
| L4 | SPID/CIE login reale |
| L5 | Sync HR bidirezionale (Zucchetti/TeamSystem) |
| L6 | Compliance engine con job notturno su tutti i protocolli |
| L7 | Benchmark anonimo KPI tra medici |
| L8 | Protocol marketplace community |
| L9 | Fatturazione integrata (non SDI — troppo complesso) |
| L10 | White-label per studi associati |
| L11 | Suggerimento AI giudizio idoneità |
| L12 | Analytics avanzati (trend per rischio, cohort analysis) |

---

# OUTPUT 4 — ULTIMATE ROADMAP

## PHASE 1 — Must Exist Before Launch (Mesi 1-2)

**Obiettivo**: Un medico può usare MedWork per una giornata di visite reali senza MAI dover aprire Word, Excel, o il software del competitor.

### Criteri di completamento
- Tutte le vulnerabilità sicurezza sono risolte
- PDF giudizio idoneità generabile in 1 click
- Allegato 3B conforme XSD INAIL (validazione passa)
- Scadenziario calcola automaticamente le date
- Notifiche email funzionanti (non console)
- Zero crash con 500+ lavoratori

### Backlog Phase 1 (ordinato)
1. Fix security critici (C1-C3) — 3gg
2. Fix bug AdminCrudController (LegalName duplicato) — 1gg
3. Fix tipo visita in italiano — 1gg
4. Fix archiviazione lavoratori → server-side — 2gg
5. Protocolli → DB persistence (non localStorage) — 3gg
6. Paginazione API su tutte le liste — 5gg
7. PDF giudizio idoneità con QuestPDF — 10gg
8. Calcolo automatico prossima scadenza — 3gg
9. Allegato 3B XSD reale + validazione — 15gg
10. Notifiche email reali (SendGrid) — 5gg
11. Audit trail server-side (DB) — 5gg
12. Global exception handler + logging — 3gg
13. Firma digitale documenti base (RSA + PDF embedding) — 7gg
14. EPPlus sostituzione o licenza — 2gg

**Totale stimato**: ~65 gg sviluppatore → 13 settimane con 1 dev → compressi in 8 settimane con focus totale.

---

## PHASE 2 — Makes Physicians Switch (Mesi 3-4)

**Obiettivo**: Un medico che usa CartSan o Winasped vede MedWork e dice "questo mi fa risparmiare 2 ore al giorno". Inizia la migrazione attiva.

### Criteri di completamento
- Il workspace visita unificato con sidebar è funzionante
- "Copia ultima visita" funziona
- Email digest giornaliero parte alle 7:30
- Import da competitor funziona per lavoratori + visite base
- 50 template protocolli per ATECO disponibili
- I primi 50 medici paganti stanno usando il prodotto in produzione

### Backlog Phase 2 (ordinato)
1. Workspace visita unificato — sidebar contestuale — 15gg
2. Copia ultima visita come template — 5gg
3. Esame obiettivo strutturato "nella norma" — 7gg
4. Dashboard "il mio giorno" (visite oggi + scadenze 7gg + da firmare) — 7gg
5. Email digest giornaliero (cron job + template HTML) — 5gg
6. Ricerca globale lavoratore con autocomplete — 3gg
7. Prescrizioni standardizzate (checklist) nel giudizio — 3gg
8. Import migrazione da competitor (CSV wizard) — 15gg
9. Library 50 protocolli per ATECO (content, non codice) — 10gg
10. Notifica datore di lavoro post-giudizio (email automatica) — 3gg
11. Gestione utenti UI (invita medico, cambia ruolo) — 5gg
12. Upload DVR nel profilo azienda — 2gg
13. Trend parametri vitali nel profilo lavoratore — 5gg
14. "Nuova visita" dal profilo lavoratore — 1gg
15. Onboarding wizard per nuovo account (3 step) — 5gg

---

## PHASE 3 — Makes MedWork the Preferred Product (Mesi 5-6)

**Obiettivo**: MedWork diventa il software raccomandato tra medici competenti. Il passaparola genera crescita organica. L'NPS supera 50.

### Criteri di completamento
- Portale aziende self-service live
- Email mensile automatica alle aziende
- Relazione art. 40 server-side completa
- Multi-medico per studio (Team tier)
- 120 medici paganti, MRR > €25k
- Churn < 3%

### Backlog Phase 3 (ordinato)
1. Portale aziende self-service (login separato, scadenze + idoneità + statistiche) — 20gg
2. Email/PEC mensile automatica alle aziende con lista scadenze — 5gg
3. Relazione annuale art. 40 server-side (dati statistici reali + editor commento medico) — 15gg
4. Vista calendario nello scadenziario — 10gg
5. Multi-medico per studio (Team tier) — 10gg
6. Raggruppamento scadenze per ottimizzare giornate in azienda — 7gg
7. Alert variazione mansione → aggiornamento protocollo — 5gg
8. GDPR consent workflow (consent, revoca, DSAR export) — 7gg
9. Template frasi anamnesi shortcode + library arricchita — 5gg
10. Multi-step protocollo (N esami con N cadenze diverse) — 10gg
11. Compliance check automatico nello scadenziario — 7gg
12. KPI dashboard medico (visite/mese, tasso idoneità, top aziende scadute) — 7gg

---

## PHASE 4 — Makes MedWork the Category Leader (Mesi 7-18)

**Obiettivo**: MedWork è la scelta ovvia per qualsiasi medico competente italiano. Nessun competitor riesce a competere su UX, funzionalità e valore.

### Backlog Phase 4 (ordinato per impatto)
1. App mobile React Native offline-first
2. AI pre-compilazione vocale (Whisper + LLM)
3. OCR referti esterni → pre-compilazione accertamenti
4. Compliance engine con job notturno su tutti i protocolli
5. SPID/CIE login reale per portale lavoratori
6. Sync HR bidirezionale (Zucchetti in primis)
7. Protocol marketplace community
8. Suggerimento AI giudizio idoneità
9. Benchmark anonimo KPI tra medici
10. Fatturazione integrata (preventivi/fatture, non SDI inizialmente)
11. White-label per studi associati e associazioni di categoria

---

# OUTPUT 5 — IMPLEMENTATION BACKLOG

*I 30 item più ad alto impatto con criteri di accettazione.*

---

### ITEM #1 — Fix Security: Backdoor Password
**Descrizione**: Rimuovere la riga `if (password == "Admin123!") return true` da TenantService.cs  
**Business Value**: Senza questo il prodotto non può andare in produzione — data breach universale  
**Physician Value**: Indiretto — la loro privacy dipende da questo  
**Acceptance Criteria**:
- La riga è rimossa dal codice
- Il test `AdminCrudIntegrationTests` verifica che `Admin123!` non bypassa password di altri utenti
- Review del codice da un secondo sviluppatore
**Dependencies**: Nessuna  
**Complexity**: XS (30 min)

---

### ITEM #2 — JWT Secret Rotation
**Descrizione**: Il JWT SecretKey deve provenire da environment variable o Azure Key Vault, mai da appsettings  
**Business Value**: Token non forgiabili = prodotto sicuro  
**Acceptance Criteria**:
- `appsettings.json` non contiene SecretKey
- In development: `dotnet user-secrets` o env var
- In produzione: Azure Key Vault o variabile d'ambiente injettata
- App crasha al boot se SecretKey non è configurata (fail fast)
**Complexity**: S (2h)

---

### ITEM #3 — TenantId Fallback Sicuro
**Descrizione**: TenantContextFilter deve restituire 401 quando TenantId non è presente nel token, mai fallback a 1  
**Acceptance Criteria**:
- Request senza token valido → 401
- Request con token valido senza claim TenantId → 401
- Test automatizzato verifica che TenantId=1 non sia accessibile senza claim esplicita
- Test cross-tenant: utente di tenant 2 non accede a dati di tenant 1
**Complexity**: S (2h)

---

### ITEM #4 — Protocolli: Migrazione localStorage → Database
**Descrizione**: ProtocolsCenter.jsx salva i protocolli in localStorage. Devono essere persistiti nel DB via API  
**Business Value**: Dati persi = abbandono immediato  
**Acceptance Criteria**:
- Tutti i CRUD protocollo usano `api/admin-data/protocols`
- localStorage rimosso completamente da ProtocolsCenter
- I protocolli sopravvivono al cambio browser/device
- Migration script che importa eventuali protocolli in localStorage esistenti
**Dependencies**: API protocolli già esistente (AdminCrudController)  
**Complexity**: M (1 giorno)

---

### ITEM #5 — PDF Giudizio Idoneità (QuestPDF)
**Descrizione**: Endpoint `GET /api/documents/visits/{id}/fitness-judgment-pdf` che genera un PDF conforme  
**Business Value**: Il documento più prodotto ogni giorno — senza questo non sei un software medico  
**Physician Value**: -10 min/visita (eliminazione workflow Word manuale)  
**Acceptance Criteria**:
- PDF contiene: intestazione medico (nome, albo, specializzazione), dati lavoratore completi, azienda, mansione, tipo visita, data, esito codificato + testo, prescrizioni, limitazioni, data prossima visita, numero progressivo, firma placeholder
- PDF apribile e stampabile
- Formato A4, font leggibile, layout professionale
- Numero progressivo incrementale per studio medico
- File PDF salvato nell'archivio (non solo download one-shot)
**Dependencies**: QuestPDF NuGet package, SettingsCenter per intestazione medico  
**Complexity**: L (10 giorni)

---

### ITEM #6 — Calcolo Automatico Prossima Scadenza
**Descrizione**: Dopo salvataggio di una visita, calcolare automaticamente `next_deadline` dal protocollo assegnato  
**Physician Value**: -30 sec/visita × 20 = 10 min/giorno  
**Acceptance Criteria**:
- `MedicalVisitsController.POST` calcola `NextDeadlineDate = VisitDate + Protocol.CadenceDays` se protocollo assegnato
- Aggiustamento automatico: +(-30%) se lavoratore età > 50 e rischio alto
- Il medico vede il valore calcolato nel form (modificabile)
- Se nessun protocollo assegnato, campo rimane manuale
- Test verifica calcolo per vari scenari (protocollo 365gg, lavoratore 51 anni, rischio alto)
**Complexity**: S (3 giorni)

---

### ITEM #7 — Copia Ultima Visita Come Template
**Descrizione**: Bottone "Copia da ultima visita" nel MedicalVisitStepper che pre-carica i dati dell'ultima visita  
**Physician Value**: -4 min/visita × 20 = 80 min/giorno — **il più alto ROI per effort**  
**Acceptance Criteria**:
- Bottone visibile in Step 1 solo se esiste una visita precedente per quel lavoratore
- Click pre-compila: workHistory, personalHistory, familyHistory, remotePathology, recentPathology, objectiveExam, targetOrgans
- I campi pre-compilati sono modificabili
- Data visita, tipo visita, giudizio NON vengono copiati (sono specifici della visita odierna)
- Il medico vede banner "Dati copiati dalla visita del DD/MM/YYYY — modifica se necessario"
**Complexity**: S (5 giorni)

---

### ITEM #8 — Workspace Visita: Sidebar Contestuale
**Descrizione**: Pannello laterale nel MedicalVisitStepper con contesto completo del lavoratore  
**Physician Value**: Elimina 4 navigazioni esterne durante ogni visita = -3 min/visita  
**Acceptance Criteria**:
- Sidebar carica automaticamente quando si seleziona un lavoratore
- Mostra: profilo rischio (lista agenti), ultima visita (data + esito), trend PA/BMI (ultimi 3), protocollo attivo con stato esami (✓/⚠), vaccinazioni con scadenze, ultimi 3 giudizi
- Sidebar scrollabile indipendentemente dal form
- Caricamento dati in < 500ms (dati già in cache o chiamata parallela)
- Su mobile: sidebar collassabile
**Complexity**: L (15 giorni)

---

### ITEM #9 — Email Digest Giornaliero
**Descrizione**: Ogni mattina alle 7:30, email al medico con riepilogo della giornata  
**Business Value**: +25% retention — il medico usa MedWork anche senza aprirlo  
**Acceptance Criteria**:
- Cron job alle 7:30 per ogni tenant attivo
- Email contiene: visite del giorno (se calendario configurato), visite scadute negli ultimi 7gg (per azienda), scadenze dei prossimi 7gg (per azienda), documenti da firmare
- Template HTML professionale con logo studio
- Link "Apri MedWork" con deep link alla sezione rilevante
- Opt-out in impostazioni
- SendGrid (free tier: 100 email/giorno sufficiente per beta)
**Complexity**: M (5 giorni)

---

### ITEM #10 — Import Migrazione da Competitor
**Descrizione**: Wizard guidato per importare lavoratori e visite da CSV/Excel esportato da competitor  
**Business Value**: Abbatte la barriera principale al cambio software = +50% conversion rate  
**Acceptance Criteria**:
- Step 1: Upload file CSV/Excel
- Step 2: Mappatura colonne guidata (drag-and-drop o dropdown)
- Step 3: Preview con validazione (errori evidenziati per riga, CF invalidi, date errate)
- Step 4: Import con progress bar
- Step 5: Report risultati (importati OK, saltati, errori)
- Rollback possibile entro 24h (soft-delete)
- Supporta mapping per: Winasped, 81ML (template scaricabili dal sito)
- Limite: 5.000 lavoratori per import
**Complexity**: L (15-20 giorni)

---

### ITEM #11 — Allegato 3B INAIL Conforme
**Descrizione**: Generazione XML Allegato 3B conforme alla specifica ufficiale INAIL con tutti i campi obbligatori  
**Business Value**: Prerequisito legale — senza questo i medici non possono usare MedWork per l'obbligo annuale  
**Acceptance Criteria**:
- XML conforme all'XSD ufficiale INAIL (scaricato dal portale INAIL, non inventato)
- Tutti i campi obbligatori popolati con dati reali del database
- Codici ATECO corretti (da tabella INAIL ufficiale)
- Codici rischio corretti (da codifiche INAIL)
- Validazione XSD automatica prima dell'invio con report errori comprensibili
- Test con dataset reale di 3 aziende pilota (beta medici)
- Invio simulato (receipt mock) per test; invio reale al portale come feature successiva
**Dependencies**: Specifica XSD ufficiale INAIL (da scaricare), dati azienda completi (ATECO obbligatorio)  
**Complexity**: XL (20-25 giorni)

---

### ITEM #12 — Dashboard "Il Mio Giorno"
**Descrizione**: Sostituire la homepage attuale con una dashboard orientata all'azione quotidiana  
**Physician Value**: 15 min/mattina salvati, orientamento immediato  
**Acceptance Criteria**:
- 4 widget in header: "Visite oggi" (count + lista), "Scadenze 7gg" (count), "Da firmare" (count), "Anomalie" (aziende con overdue > 10%)
- Lista visite del giorno espandibile con nome, azienda, tipo, ora (se calendario)
- Lista top 5 scadenze urgenti con nome lavoratore, azienda, tipo scadenza, giorni mancanti
- Quick action "Avvia visita" per ogni riga della lista
- Quick action "Cerca lavoratore" sempre visibile
- Carica in < 1 secondo (query ottimizzate)
**Complexity**: M (7 giorni)

---

### ITEM #13 — Esame Obiettivo Strutturato
**Descrizione**: Sostituire il textarea libero con sezioni strutturate con default "nella norma"  
**Physician Value**: -3 min/visita × 20 = 60 min/giorno  
**Acceptance Criteria**:
- 6 sezioni: Cardiovascolare, Respiratorio, Muscoloscheletrico, Neurologico, Udito, Visus
- Default: "nella norma" per tutte le sezioni
- Click su sezione → espande con campo testo per dettaglio anomalia
- Dati salvati come JSON strutturato (non testo libero)
- Compatibilità backward: visite precedenti mostrano il testo libero se presente
- Sezione custom "altro" sempre disponibile
**Complexity**: M (7 giorni)

---

### ITEM #14 — Paginazione API
**Descrizione**: Implementare cursor-based pagination su tutti gli endpoint che ritornano liste  
**Business Value**: Prerequisito per clienti con > 200 dipendenti  
**Acceptance Criteria**:
- Tutti gli endpoint GET list supportano `?page=1&size=50` o `?cursor=xxx&size=50`
- Response include `totalCount`, `hasNextPage`, `cursor`
- Frontend implementa lazy loading o infinite scroll
- Performance: < 200ms p95 per qualsiasi query paginata con 10.000 record
- Test di carico con dataset 10.000 dipendenti
**Endpoints da aggiornare**: `/employees`, `/companies`, `/medical-visits`, `/scheduled-exams`, `/notifications`, `/protocols`  
**Complexity**: M (5 giorni backend + 3 giorni frontend)

---

### ITEM #15 — Ricerca Globale Lavoratore
**Descrizione**: Barra di ricerca sempre visibile in header con autocomplete su nome, CF, azienda  
**Physician Value**: -25 min/giorno navigazione  
**Acceptance Criteria**:
- Sempre visibile nell'header (non solo in alcune schermate)
- Autocomplete con debounce 300ms
- Risultati: nome cognome, CF (parziale), nome azienda, mansione
- Click → apre direttamente profilo lavoratore
- Keyboard: `Ctrl+K` apre la search, `Esc` chiude, `↑↓` naviga risultati, `Enter` apre
- Max 10 risultati, ordered by relevance
- Cerca anche aziende e protocolli (tab separati nel dropdown)
**Complexity**: S (3 giorni)

---

*(Items #16-40 omessi per sintesi — il backlog completo include tutti gli item della fase Missing Features Report con stesse specifiche)*

---

# CONCLUSIONE FINALE

## "Se fossi il CEO di MedWork, la prossima cosa che costruirei domani mattina è:"

> **Il PDF del giudizio di idoneità — server-side, con intestazione del medico, legalmente presentabile, generabile in 1 click.**

**Perché esattamente questo, domani mattina?**

Non perché è la feature più innovativa. Non perché fa differenza rispetto a CartSan sul lungo periodo. Ma perché è **l'unica cosa che separa MedWork dall'essere un software di medicina del lavoro** dall'essere un bel mockup con un database dietro.

Il giudizio di idoneità è il documento che ogni medico competente italiano emette ogni giorno, per ogni lavoratore che visita. È l'atto formale che giustifica il suo operato legalmente. È il documento che il datore di lavoro attende, che il lavoratore deve ricevere, che deve essere conservato in archivio per 10 anni.

Senza questo, nessun medico può usare MedWork per le visite reali. Può usarlo come agenda, come rubrica, come strumento di analisi — ma non come software di medicina del lavoro. Questa linea divide i software seri da quelli che rimangono nella categoria "interessante ma non usabile".

**Costruirlo richiede 10 giorni lavorativi.**

Dopo quei 10 giorni, hai un prodotto che puoi mostrare a un medico e dire: "Apri MedWork. Fai la visita di Mario Rossi. Clicca qui. Ecco il tuo giudizio di idoneità, pronto da stampare o inviare via email al datore di lavoro." E il medico, per la prima volta, dirà: "Ok. Funziona."

**Tutto il resto viene dopo.**

---

*Documento scritto nell'agosto 2026. Revisione ogni 30 giorni con aggiornamento basato su feedback utenti reali.*
*Metrica di successo: il medico gestisce il 30% di più di pazienti con lo stesso tempo entro 90 giorni dall'adozione.*
