# MedWork — Analisi UX dal Medico Competente
**Prospettiva**: Senior Occupational Health Physician, 15+ anni di pratica.
**Competitor usati**: Winasped (7 anni), 81ML (2 anni), Twind (1 anno), Softmed (consulenze).
**Brutalità**: massima.

---

## Premessa onesta

Tutti i software di medicina del lavoro italiani fanno schifo in modi leggermente diversi.
Winasped è lento ma ti fidi. 81ML è web ma ti perde i dati. Twind ha buoni protocolli ma l'interfaccia è un labirinto.
**MedWork ha una UI moderna che fa sembrare moderno anche ciò che non lo è ancora.**
Il problema non è l'estetica. Il problema è che il software non conosce ancora il flusso reale di una giornata di lavoro di un medico competente.

---

## 1. Task Quotidiani Ancora Troppo Lenti

### 🐢 Task 1: Aprire la cartella di un lavoratore specifico durante la visita

**Realtà attuale in MedWork**: Per arrivare alla cartella di Mario Rossi devo:
navigare → Gestione lavoratori → cercare Mario Rossi → cliccare il profilo → trovare la visita precedente → leggere l'anamnesi

**Tempo reale**: 40-60 secondi se il sistema è veloce. Con 25 pazienti al giorno, sono 25 minuti sprecati ad aprire cartelle.

**Nei competitor**: Winasped ha una barra di ricerca globale: digiti "Rossi" e in 2 secondi sei nella cartella. Ci ho messo 7 anni ad abituarmi ma funziona.

**Problema specifico in MedWork**: Non esiste una ricerca globale per lavoratore accessibile sempre, da qualunque schermata, con tasto di scelta rapida.

---

### 🐢 Task 2: Registrare una visita periodica standard

**Flusso attuale in MedWork** (MedicalVisitStepper):

```
Step 1: scegli lavoratore dal dropdown (lista piatta, non ricercabile)
        → inserisci data visita
        → tipo visita (in inglese! "Periodic", "Preventive"...)
        → anamnesi lavorativa (campo libero, nessun template)
        → anamnesi personale (campo libero)
        → anamnesi familiare (campo libero)
        → patologie (un campo solo per remote E recenti mashati insieme)
Step 2: organi bersaglio (campo testo libero)
        → esame obiettivo (campo libero)
        → note cliniche
Step 3: giudizio (dropdown)
        → prossima scadenza (data manuale)
→ Salva
```

**Quello che manca in ogni step**:
- Step 1: non vedo i rischi del lavoratore, non vedo la sua ultima visita, non vedo i suoi esami programmati. Sto compilando al buio.
- Step 2: non c'è checklist per l'esame obiettivo basata sul profilo di rischio. Devo ricordarmi tutto a mente.
- Step 3: la data prossima scadenza va inserita manualmente. Nessun calcolo automatico basato su protocollo + rischio + età.

**In Winasped**: l'esame obiettivo ha sezioni precompilate con "nella norma" di default. Modifichi solo quello che è anomalo. Con MedWork devo digitare tutto da zero ogni volta.

**Tempo perso vs Winasped**: +4-6 minuti per visita. Con 20 visite al giorno = 80-120 minuti sprecati al giorno.

---

### 🐢 Task 3: Stampare (o inviare) il giudizio di idoneità al datore di lavoro

**Flusso attuale in MedWork**: Il giudizio viene salvato ma non esiste un bottone "Genera PDF giudizio" funzionante (la generazione PDF è uno stub che torna una stringa). Non esiste un template. Non esiste l'invio via PEC al datore.

**In tutti i competitor**: è un click. Stampa o PDF in 5 secondi.

**Impatto**: ogni giudizio di idoneità richiede di aprire Word, copia-incollare, formattare, stampare. 10 minuti a giudizio. 25 giudizi/giorno = 4 ore perse.

---

### 🐢 Task 4: Aggiornare lo scadenziario dopo una visita

**Realtà attuale**: La data di prossima scadenza viene inserita manualmente nel campo `nextDeadlineDate`. Il sistema non calcola automaticamente la periodicità in base al protocollo assegnato al lavoratore.

Se cambio il protocollo di un lavoratore (es. passaggio a mansione con rischio chimico), devo manualmente ricalcolare tutte le scadenze future. Nessun competitor fa questo automaticamente. MedWork nemmeno.

**Opportunità**: questo è il task dove MedWork potrebbe battere tutti se implementasse un calcolo automatico periodicità + alert multi-canale. Oggi non lo fa.

---

### 🐢 Task 5: Preparare la Relazione Annuale (art. 40) a febbraio

**Realtà attuale**: La relazione annuale viene generata come PDF client-side con jsPDF. Il contenuto è una tabella dei rischi dell'azienda basata sui nomi dei risk factors. Non include le statistiche reali di visite (totale visite per tipo, tasso idoneità, anomalie, ecc.). Il campo "commento medico" non esiste.

**In 81ML**: click su "Genera art. 40", compila il commento, stampa. Ci vogliono 5 minuti per azienda.

**In MedWork oggi**: non è utilizzabile per la relazione reale. Devo ricostruire tutto su Excel.

---

## 2. Workflow con Troppi Click

### Click Audit: Flusso Visita Periodica Standard

| Step | MedWork oggi | Winasped | Delta |
|---|:---:|:---:|:---:|
| Aprire cartella lavoratore | 5-7 click | 2 click | **+4** |
| Pre-caricare ultima visita come template | ❌ non esiste | 1 click | **+∞** |
| Registrare esame obiettivo | Campo libero da zero | Click su "nella norma" poi modifica eccezioni | **+2 min** |
| Selezionare tipo visita | Dropdown inglese, 1 click | Abbreviazioni italiane, 1 click | pari |
| Inserire esiti esami esterni (audiometria) | Campo libero ClinicalNotes | Sezione dedicata per tipo esame | **+1 min** |
| Calcolare prossima scadenza | Manuale | Automatica da protocollo | **+30 sec** |
| Generare PDF giudizio | ❌ non funziona | 1 click | **+10 min** |
| Inviare al datore via PEC | ❌ non esiste | 2 click (temi Aruba) | **+5 min** |
| **Totale per visita** | **~20 min** | **~8 min** | **+12 min** |

**12 minuti in più per visita × 20 visite/giorno = 4 ore perse al giorno.**
Non è un prodotto alternativo. È un prodotto più lento.

---

### Workflow con più click inutili specifici di MedWork

**1. Il tipo visita è in inglese** (`Periodic`, `Preventive`, `RoleChange`). Un medico competente non pensa in inglese durante una visita. Ogni volta il cervello fa una micro-traduzione. Piccolo ma fastidioso.

**2. Il campo "patologie remote/recenti" è un hack** — il codice fa letteralmente `remotePathology = parts[0]`, `recentPathology = parts.slice(1)` da un campo unico separando per newline. Questo è un bug mascherato da feature. Se scrivo una patologia remote su più righe, il sistema la spezzi in remote + recent. Il medico non capisce perché i dati vengono salvati storpiati.

**3. La ricerca lavoratori nel dropdown visita è una lista piatta** — con 500 dipendenti, devo scorrere per trovare Mario Rossi. Nessun autocomplete.

**4. Non esiste un "tasto preferiti" per frasi anamnestiche frequenti** — ogni medico ha le sue frasi standard (es. "Non fuma, non beve, anamnesi negativa per patologie cardiovascolari"). In Winasped ci sono i template di testo con shortcode. In MedWork devo riscriverle ogni volta.

---

## 3. Informazioni Mancanti durante la Visita Medica

Quando apro la scheda di visita di un lavoratore in MedWork, non vedo:

### Criticamente assente:
- ❌ **Profilo di rischio del lavoratore** — devo andare in un'altra schermata per vedere a quali rischi è esposto
- ❌ **Ultima visita e suo esito** — non posso confrontare con oggi senza navigare altrove
- ❌ **Trend dei parametri vitali** — pressione, FC, SpO2 storici. Un lavoratore con PA 145/90 oggi: è peggiorato? Era così anche l'anno scorso?
- ❌ **Esami in scadenza o già scaduti** per quel lavoratore (audiometria, spirometria, emocromo)
- ❌ **Protocollo assegnato e suoi step** — quali esami devo fare per questo lavoratore secondo protocollo?
- ❌ **Giudizi precedenti** — è stato "idoneo con prescrizioni" per 3 anni di fila? Questa è un'informazione clinica rilevante

### Importante ma non bloccante:
- ⚠️ **Vaccinazioni** (esistono nel modello ma non compaiono nella schermata visita)
- ⚠️ **Esposizioni cumulative** (anni di esposizione a rumore, amianto, chimici)
- ⚠️ **Farmaci cronici** (nessun campo dedicato; finisce nelle note libere)
- ⚠️ **Dati DVR/rischio azienda** — il medico competente deve conoscere il DVR. Non c'è alcun collegamento con i documenti aziendali

### Un esempio concreto del problema:
Mario Rossi, saldatore, 52 anni. Visita periodica. In MedWork vedo: nome, azienda, mansione, una textarea per anamnesi. Non vedo che:
- È esposto a rumore > 85 dB e fumi di saldatura da 20 anni
- L'anno scorso aveva soglia uditiva a 4kHz già peggiorata
- Ha ipertensione documentata nella visita di 2 anni fa
- Il protocollo prevede audiometria ogni anno (scaduta da 3 mesi)

Devo ricordarmelo io, o aprire 4 schermate diverse. Questo è il punto dove un medico competente smette di usare MedWork e torna al foglio Excel.

---

## 4. Feature che Farebbero Abbandonare un Competitor

In ordine di impatto sulla decisione di switch:

### 🔥 Switch Trigger #1: PDF Giudizio Idoneità in 1 click

**Perché**: È il documento che produciamo più spesso. È legalmente obbligatorio. Ogni sistema di medicina del lavoro lo deve fare. Se MedWork non lo fa correttamente, il medico usa il software concorrente anche solo per questo.
**Soglia**: se MedWork genera un PDF giudizio legalmente valido (con firma, intestazione medico, numero protocollo, dati lavoratore) in ≤ 2 click, metà dei medici con Winasped valutano il cambio.

### 🔥 Switch Trigger #2: Scadenziario automatico con notifica proattiva

**Perché**: Oggi ricevo una telefonata dall'azienda che dice "il signor Bianchi deve fare la visita". Io guardo il software e scopro che era scaduto da 40 giorni. Il software non mi ha avvisato. Con qualsiasi concorrente questa cosa accade. Se MedWork mi manda una notifica automatica "Tra 30 giorni scadono 12 visite in Azienda X" con già la lista dei nomi, cambio software domani mattina.

### 🔥 Switch Trigger #3: App mobile per visite in sede aziendale

**Perché**: Il 40% delle mie visite le faccio andando in azienda con il mio laptop. La connessione 4G in capannone spesso non c'è. Se MedWork funziona offline e sincronizza al ritorno, e se l'interfaccia è usabile su un tablet, questo da solo vale il cambio. **Nessun competitor lo ha**. Sarebbe un monopolio di fatto per i medici itineranti.

### 🔥 Switch Trigger #4: Import dati da competitor (migrazione zero attrito)

**Perché**: Il vero lock-in dei competitor non è la qualità del software, è la paura di perdere 15 anni di storico cartelle. Se MedWork offre un tool di migrazione da Winasped/81ML (anche parziale: lavoratori + ultime visite + protocolli), abbatte la barriera principale al cambio.

### Switch Trigger #5: Multi-sede con un solo login

**Perché**: Seguo 8 aziende diverse. In Winasped ho 8 installazioni diverse (on-premise). In 81ML ho 8 tenant diversi con login diversi. Se MedWork mi fa vedere tutte le 8 aziende in un'unica dashboard con un solo login e i crossover di scadenze, pago volentieri.

---

## 5. Feature che Risparmiano ≥ 1 Ora al Giorno

### ⏱️ Ora/giorno #1: Template "Copia ultima visita" con modifiche

**Meccanismo**: Apri la visita di oggi per Mario Rossi → il sistema pre-carica automaticamente i dati dell'ultima visita (anamnesi, esame obiettivo, organi bersaglio) → il medico modifica solo ciò che è cambiato.
**Risparmio reale**: 3-4 minuti per visita × 20 visite = 60-80 minuti al giorno.
**Complessità**: Bassa. È un'operazione di lettura + pre-populate del form.

### ⏱️ Ora/giorno #2: Esame obiettivo con struttura "nella norma" default

**Meccanismo**: Ogni sezione dell'esame obiettivo (cardiovascolare, respiratorio, muscoloscheletrico, neurologico) parte con "nella norma". Il medico clicca solo sulle sezioni anomale e le espande.
**Risparmio reale**: 2-3 minuti per visita × 20 visite = 40-60 minuti al giorno.

### ⏱️ Ora/giorno #3: Calcolo automatico prossima scadenza

**Meccanismo**: Il sistema conosce il protocollo del lavoratore (cadenza). Dopo una visita periodica, calcola automaticamente `prossima visita = oggi + cadence_days` tenendo conto di età > 50 (riduzione periodo) e rischio elevato (riduzione periodo). Il medico può sovrascrivere ma il default è corretto.
**Risparmio reale**: 1 minuto per visita × 20 visite = 20 minuti al giorno.

### ⏱️ Ora/giorno #4: Dashboard mattutina "cosa ho oggi"

**Meccanismo**: Appena apro l'app, vedo: lista visite di oggi (con nome, azienda, tipo visita, ultima data), alert scaduti, documenti da firmare, risposte PEC in arrivo.
**Risparmio reale**: 20-30 minuti di pianificazione manuale mattutina eliminati.

---

## 6. Feature che Risparmiano ≥ 1 Giorno al Mese

### 📅 Giorno/mese #1: Generazione automatica Allegato 3B INAIL

**Meccanismo**: Un click → XML 3B conforme INAIL generato da tutti i dati del sistema → validazione XSD integrata → invio diretto al portale INAIL.
**Risparmio reale**: Oggi ci vogliono 2-4 ore per azienda (export dati, Excel, portale INAIL). Con 5 aziende all'anno = 10-20 ore. Un giorno e mezzo.

### 📅 Giorno/mese #2: Relazione Annuale art. 40 semi-automatica

**Meccanismo**: Il sistema genera la bozza con tutti i dati statistici (totale lavoratori per rischio, tipo visita, esito, variazioni). Il medico aggiunge solo il commento clinico qualitativo (30 minuti).
**Risparmio reale**: Oggi 4-8 ore per azienda × 5 aziende = fino a 2 giorni di lavoro.

### 📅 Giorno/mese #3: Scadenziario mensile con email automatica ad aziende

**Meccanismo**: Il primo del mese, il sistema invia automaticamente a ogni datore di lavoro la lista delle visite in scadenza nel mese. Il medico non deve fare niente. Zero email manuali.
**Risparmio reale**: 30 minuti per azienda × 8 aziende = 4 ore di email manuali eliminate.

### 📅 Giorno/mese #4: Import automatico da HR aziendale

**Meccanismo**: Il sistema riceve automaticamente (webhook o SFTP giornaliero) i dati da Zucchetti/TeamSystem: nuovi assunti, cessazioni, variazioni mansione. Il medico vede solo un "pending review" con le variazioni da confermare.
**Risparmio reale**: Oggi ricevo un Excel ogni mese e passo 2-3 ore ad aggiornare manualmente l'anagrafica. × 8 aziende = 16-24 ore/mese.

---

## 7. Cosa i Competitor Fanno Male (Vere Opportunità)

### 🎯 Pain #1: Ricerca storico visite su lavoratori

**In Winasped**: trovi le visite ma non puoi filtrare per tipo, esito, o periodo. Devo scorrere una lista cronologica.
**In 81ML**: la ricerca esiste ma è lenta e spesso restituisce risultati vuoti per bug.
**Opportunità MedWork**: timeline visuale del lavoratore con filtri rapidi + trend grafici parametri vitali.

### 🎯 Pain #2: Notifiche che funzionano davvero

**In tutti i competitor**: le notifiche scadenze richiedono che il software sia aperto. Nessuno manda email automatiche al medico con un riepilogo. Devo "andare a controllare".
**Opportunità MedWork**: digest giornaliero via email alle 7:00 con le scadenze del giorno + settimana.

### 🎯 Pain #3: Il giudizio idoneità è un campo testo libero

**In quasi tutti i competitor**: il giudizio è un campo di testo libero. Non c'è struttura. Non ci sono prescrizioni codificate. Non c'è possibilità di analisi aggregata ("quanti idonei con prescrizioni ho nel rischio chimico?").
**In MedWork**: la struttura c'è (GiudizioIdoneitaCenter con OutcomeCode) ma manca la lista standardizzata delle prescrizioni frequenti (es. "uso obbligatorio DPI", "visite oculistiche annuali"). Sono campi testo libero anche lì.

### 🎯 Pain #4: Nessun competitor fa la "vista azienda" per il datore di lavoro

Il datore di lavoro mi chiama ogni mese per sapere chi ha la visita in scadenza, chi è "non idoneo", se ci sono anomalie. Gli mando un Excel manuale. In nessun software c'è un portale self-service per l'azienda.
**Opportunità MedWork**: portale azienda read-only con SPID = nessuna telefonata, nessuna email, nessun Excel manuale.

### 🎯 Pain #5: Import da DVR aziendale non esiste

Ricevo dal RSPP il DVR in PDF. Devo leggere i rischi e inserirli manualmente nel software. Ci vuole 1 ora per azienda nuova.
**Opportunità MedWork**: OCR del DVR → estrazione automatica dei rischi → proposta protocollo. Questo da solo vale il cambio per ogni medico che inizia con un'azienda nuova.

---

## 8. Top 20 Feature Ranking

**Criteri di valutazione**:
- **Adoption Impact** (A): quanti medici scelgono/abbandonano il software per questa feature. Scala 1-10.
- **Revenue Impact** (R): aumenta MRR, riduce churn, aumenta tier. Scala 1-10.
- **Implementation Effort** (E): quanto costa costruirlo bene. Scala 1-10 (10=molto difficile).
- **Score** = (A × 0.4 + R × 0.35 + (10-E) × 0.25) — effort penalizza

| Rank | Feature | A | R | E | Score | Categoria |
|:---:|---|:---:|:---:|:---:|:---:|---|
| **#1** | **PDF giudizio idoneità server-side, legalmente valido, 1 click** | 10 | 10 | 4 | **9.1** | 🔴 PREREQUISITO |
| **#2** | **Copia ultima visita come template (pre-compilazione)** | 10 | 8 | 2 | **8.7** | ⚡ Quick Win |
| **#3** | **Scadenziario automatico con email digest giornaliero** | 9 | 9 | 3 | **8.5** | 🔴 PREREQUISITO |
| **#4** | **Esame obiettivo strutturato con "nella norma" default e sezioni anomalie** | 9 | 7 | 3 | **7.9** | ⚡ Quick Win |
| **#5** | **Calcolo automatico prossima scadenza da protocollo** | 9 | 8 | 3 | **8.0** | 🔴 PREREQUISITO |
| **#6** | **Vista contestuale lavoratore durante visita (rischi + ultima visita + esami + trend vitali)** | 9 | 8 | 4 | **7.9** | ⭐ Core UX |
| **#7** | **Ricerca globale lavoratore con autocomplete (sempre accessibile)** | 8 | 7 | 2 | **7.6** | ⚡ Quick Win |
| **#8** | **Allegato 3B INAIL conforme e invio diretto portale** | 8 | 9 | 5 | **7.5** | 🔴 PREREQUISITO |
| **#9** | **Relazione annuale art. 40 semi-automatica con dati statistici reali** | 8 | 8 | 4 | **7.4** | 📅 Mensile |
| **#10** | **Template frasi anamnesi personalizzabili per medico (shortcode)** | 8 | 6 | 2 | **7.1** | ⚡ Quick Win |
| **#11** | **Portale azienda self-service (scadenze, idoneità, statistiche) — SPID login** | 8 | 9 | 6 | **7.3** | 🚀 Differenziatore |
| **#12** | **Email/PEC automatica mensile ad aziende con lista scadenze** | 8 | 8 | 4 | **7.4** | ⭐ Core UX |
| **#13** | **Import dati da competitor (migrazione storico)** | 9 | 9 | 7 | **7.3** | 🔓 Unlock |
| **#14** | **Prescrizioni standardizzate nel giudizio (checklist, non campo libero)** | 7 | 7 | 2 | **6.8** | ⚡ Quick Win |
| **#15** | **Dashboard mattutina "il mio giorno" — visite + alert + da firmare** | 8 | 7 | 3 | **7.2** | ⭐ Core UX |
| **#16** | **OCR DVR aziendale → estrazione rischi → proposta protocollo** | 7 | 8 | 7 | **6.4** | 🤖 AI |
| **#17** | **App mobile offline-first per visite in sede** | 8 | 9 | 9 | **6.7** | 🚀 Differenziatore |
| **#18** | **AI pre-compilazione cartella da dettatura vocale** | 7 | 9 | 9 | **6.7** | 🤖 AI |
| **#19** | **Sync HR automatico (Zucchetti/TeamSystem) — nuovi assunti e cessazioni** | 7 | 8 | 7 | **6.4** | 🔗 Integration |
| **#20** | **Benchmark anonimo KPI tra medici competenti** | 5 | 7 | 5 | **5.6** | 📊 Analytics |

---

## Analisi per Tier Strategico

### TIER 0 — Senza questi, il prodotto non è usabile in produzione

Non è una questione di priorità. È sopravvivenza:

1. **PDF giudizio idoneità** — ogni medico lo emette ogni giorno. Senza questo MedWork non è un software di medicina del lavoro.
2. **Allegato 3B conforme INAIL** — obbligatorio per legge. Senza questo il medico è esposto a sanzioni.
3. **Calcolo automatico scadenze** — il valore core del prodotto. Senza questo è un foglio Excel con una bella UI.

### TIER 1 — Con questi, il medico considera il cambio

Questi sono i feature che fanno dire "ok, ci penso":

4. Pre-compilazione da ultima visita
5. Esame obiettivo strutturato
6. Vista contestuale durante visita
7. Scadenziario con notifiche automatiche
8. Relazione annuale art. 40

### TIER 2 — Con questi, il medico firma il contratto

Queste sono le feature che nessun competitor ha e che creano il momentum:

9. Portale aziende self-service
10. Import da competitor (migrazione zero attrito)
11. App mobile offline

### TIER 3 — Con questi, il medico diventa ambassador

Queste creano il "wow" e il passaparola:

12. AI pre-compilazione vocale
13. OCR DVR → protocollo
14. Benchmark anonimo tra colleghi

---

## Valutazione Finale: Cosa ha MedWork che gli altri non hanno (potenzialmente)

| Vantaggio Unico | Stato attuale | Distanza dalla realizzazione |
|---|---|---|
| UI moderna, non anni '90 | ✅ Già reale | Zero — è già fatto |
| Multi-tenant SaaS (multi-studio) | ✅ Architettura corretta | Medio — serve stabilizzazione |
| API aperte per integrazioni | ✅ REST API | Medio — serve documentazione + partner |
| Portale aziende self-service | ❌ Non esiste | Alto — da costruire |
| App mobile offline | ❌ Non esiste | Molto alto — 6+ mesi |
| AI charting | ❌ Solo stub | Molto alto — 6+ mesi |
| Scadenziario automatico completo | ⚠️ Incompleto | Medio — 2-3 mesi |
| PDF giudizio legale | ❌ Non funziona | Basso — 2-4 settimane |

---

## Una Cosa Sola da Fare Domani Mattina

Se potessi fare una sola cosa questa settimana per rendere MedWork un prodotto che un medico competente userebbe in produzione:

> **Genera un PDF di giudizio idoneità perfetto, legalmente valido, in 1 click.**

Con firma del medico, dati completi del lavoratore, mansione, azienda, tipo visita, data, prescrizioni, limitazioni, data prossima scadenza, numero protocollo progressivo, intestazione dello studio medico. Conforme DPR 445/2000.

Questo da solo trasforma MedWork da "demo interessante" a "software che uso domani".

Tutto il resto viene dopo.

---

*Analisi basata su revisione del codice MedWork (agosto 2026) e 15 anni di pratica clinica come Medico Competente con utilizzo quotidiano di Winasped, 81ML, Twind, Softmed, Asped2000.*
