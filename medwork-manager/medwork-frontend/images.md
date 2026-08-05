# Analisi Interfacce MEDWORK

Di seguito l'analisi dettagliata per ciascuna delle immagini fornite.

## 1. Scadenzario Lavoratori (6176b1a9631818c9bd761406_scad-home-1-1024x640.png)
*   **Contesto:** Sezione "Scadenze e agende" > "Sorveglianza sanitaria".
*   **Intestazione:** "Scadenzario / Solaris Srl". Pulsanti "Esporta in CSV" e "Nuova prenotazione".
*   **Contenuto Principale:** Tabella temporale (Maggio 2021) per monitorare le scadenze dei lavoratori.
*   **Dettagli visibili:**
    *   Filtri attivi: 1. Interruttore "Mostra lavoratori" attivato.
    *   Riga espansa: **Perini Giorgia** (Scaduto e in scadenza). Mostra il "Protocollo Unificato" con tre accertamenti in scadenza (icona rossa con "A") nella settimana 3-7 Maggio: Visio Test, Visita Medica, Giudizio d'idoneità.
    *   Altri lavoratori visibili (con icone di notifica a campana rossa nelle rispettive settimane): Starni Lodovico, Stella Maria, Maretti Gianluca, Mazzaferri Claudio, Calisteni Paolo, Lobetti Giorgia, Bertolucci Francesca, Cannia Roberto.

## 2. Agenda Appuntamenti (6176b1a9631818cf3276142f_agenda@2x-1024x640.png)
*   **Contesto:** Sezione "Scadenze e agende" > "Agenda".
*   **Intestazione:** "Agenda". Pulsante "Esporta appuntamenti".
*   **Contenuto Principale:** Calendario settimanale (21 - 25 Giugno 2021) con vista giornaliera a colonne.
*   **Dettagli visibili:**
    *   Gli appuntamenti sono blocchi colorati assegnati a diverse aziende (es. Solaris, La Perl..., La Rina...).
    *   **Legenda Medici/Operatori (in basso):** Verde per Bastiani Paola, Giallo per Manconi Sara, Rosso per Lucio Gianfranco. I blocchi nel calendario riflettono questi colori.
    *   **Stato appuntamenti:** La grafica tratteggiata indica "Non disponibile", il bordo tratteggiato "Agenda opzionata" e il bordo tratteggiato fine "Bozza".

## 3. Esame Audiometrico (6176b1a9631818f046761429_audiometria@2x-1024x640.png)
*   **Contesto:** Modale per l'inserimento o visualizzazione di un referto.
*   **Intestazione:** "Esame Audiometrico" per il lavoratore **Fabio Bertini** (Solaris Srl).
*   **Stato:** Menu a tendina impostato su "Concluso". Pulsanti "Salva accertamento", "Firma", Stampa e Opzioni.
*   **Contenuto Principale:** Sezione "Prova tonale" attiva.
    *   **Grafico Audiogramma:** Asse Y per "Livello uditivo (dB)" da -10 a 120. Asse X per "Frequenza (Hz)" da 125 a 11000. Sono tracciate due linee: una blu (con X) e una rossa (con cerchi) che indicano l'udito per i due orecchi.
    *   **Tabella Dati:** Sotto il grafico, una griglia per l'inserimento manuale dei valori "Non mascherato" e "Mascherato" (Aer. DX/SX, Os. DX/SX). Sulla frequenza 125 sono inseriti i valori 10 e 50.

## 4. Firma Digitale Giudizio d'idoneità (6176b1a9631818fef276144d_firma-digitale@2x-1024x640.png)
*   **Contesto:** Modale di refertazione.
*   **Intestazione:** "Giudizio d'idoneità" per **Francesca Bertolucci** (Solaris Srl).
*   **Badge:** Etichetta verde "FIRMATO GRAFOMETRICAMENTE E DIGITALMENTE".
*   **Popup Sovrapposto:** Messaggio di conferma "Firma digitale - Firma completata con successo!" con una grande spunta verde. Indica che il giudizio è stato firmato e allegato come referto.
*   **Dettagli Sfondo:** Medico competente selezionato: "Manconi Sara". Referto PDF visibile in verde (60abc...).

## 5. Episodi del Lavoratore (6176b1a96318184dae761428_protocollo-lav@2x-1024x640.png)
*   **Contesto:** Scheda lavoratore "Lavoratori / Cesarini Giorgia".
*   **Navigazione interna:** Scheda "Episodi" attiva (le altre sono Generali, Storia lavorativa, Protocolli, ecc.).
*   **Contenuto Principale:** Un box "Protocollo Unificato" datato 01/06/2021 (creato il 29/06/2021), stato generale "In attesa di giudizio" (pallino giallo).
*   **Tabella Accertamenti:**
    *   Visio Test: 01/06/2021, Stato "Concluso" (verde).
    *   Visita Medica: 01/06/2021, Stato "Concluso" (verde).
    *   Giudizio d'idoneità: 01/06/2021, Stato "Scaduto" (rosso).

## 6. Dati Fatturazione Azienda (6176b1a96318184e2776144b_dati-fatturazione@2x-1024x640.png)
*   **Contesto:** Sezione "Aziende / Solaris Srl", scheda "Generali".
*   **Contenuto Principale:** Modulo "Dati per fatturazione".
*   **Campi compilati:**
    *   Codice identificativo SDI: 0000000
    *   IBAN: IT60X0542811101000000123456
    *   Nome istituto finanziario: UniCredit S.p.A.
    *   Modalità di pagamento predefinita: CC - Carta di credito
    *   Tempistica di pagamento predefinita: 30gg fine mese
    *   Dichiarazione d'intento: Disattivata (interruttore grigio).

## 7. Sincronizzazione Dati Offline (6176b1a96318186ae6761437_sincronizza@2x-1-1024x640.png)
*   **Contesto:** Sezione "Strumenti" > "Sincronizza dati". Pulsante "Sincronizza tutti i dati senza conflitti".
*   **Contenuto Principale:** Pannello "Appuntamenti eseguiti offline in attesa di essere sincronizzati".
*   **Voci in elenco (tutte per Bertolucci Francesca, Solaris Srl in data 29/09/2021):**
    *   Visio Test (icona rossa di conflitto/errore).
    *   Visita Medica (icona gialla di avviso).
    *   Giudizio d'idoneità (icona verde di sincronizzazione pronta).

## 8. Creazione Fattura Multiazienda (6176b1a963181848ed761449_fattura-multi-azienda@2x-1024x640.png)
*   **Contesto:** Procedura guidata a step.
*   **Step Attuale:** "Riepilogo" (ultimo step).
*   **Contenuto Principale:** Riepilogo delle fatture pronte per la creazione.
    *   Data emissione: 29/09/2021.
    *   Numero di fatture: 7.
    *   Prestazioni da fatturare: 2491.
    *   Totale fatture (IE): 86523,48 €.
*   **Azione:** Pulsanti "Indietro", "Salva come bozza", "Crea fatture" (verde, in evidenza).

## 9. Creazione Nota di Credito (6176b1a9631818208c761448_note-di-credito@2x-1024x640.png)
*   **Contesto:** Procedura guidata a step.
*   **Step Attuale:** "Riepilogo" (ultimo step).
*   **Contenuto Principale:** Riepilogo della nota di credito.
    *   Cliente: SOLARIS SRL (Bologna, con PIVA/CF indicati).
    *   Data di emissione: 24/09/21.
    *   Dettaglio riga: STORNO AUDIOMETRIA, Quantità 3, Codice IVA 22, Prezzo unitario 46,29 €.
    *   Totale (IE): 138,87 €.
    *   Modalità: CARTA DI CREDITO. Tempistica: 30GG FINE MESE.
    *   Note: "NOTA DI CREDITO PER ERRORE NOSTRO."
*   **Azione:** Pulsanti "Indietro", "Crea nota di credito" (verde).

## 10. Scadenzario Aziende (6176b1a9631818056276142d_scad-aziende@2x-1-1024x640.png)
*   **Contesto:** Sezione "Scadenze e agende" > "Sorveglianza sanitaria".
*   **Intestazione:** "Scadenzario". Pulsante "Crea piani di lavoro".
*   **Contenuto Principale:** Tabella riassuntiva mensile delle scadenze raggruppate per azienda.
*   **Dettagli visibili:**
    *   Filtro attivo su "Scaduto e in scadenza" (pallino rosso).
    *   Colonne: Tutti i risultati, Giu 2021, Lug 2021, Ago 2021, Set 2021.
    *   Righe (Aziende): Solaris Srl, La Perla S.p.A, La Rinascita srl, Alba Srl, Sublime Group Spa, Techno Spa.
    *   Celle: Contengono contatori con icone (campana rossa per allerte/scadenze, triangolo giallo per avvisi, icona utente nera per numero persone). Esempio per Solaris Srl in "Tutti i risultati": 31 allerte rosse, 9 avvisi gialli, 14 utenti.


## 11. Firma Grafometrica (6176b1a9631818462576144c_firma-grafometrica@2x-1024x640.png)
*   **Contesto:** Modale "Giudizio d'idoneità" per Francesca Bertolucci.
*   **Azione:** Popup "Firma grafometrica" in corso. Chiede di utilizzare il dispositivo di firma collegato per far firmare il lavoratore e di attendere. 
*   **Sfondo:** Medico competente selezionato "Manconi Sara" e pulsante grigio "Carica documento".

## 12. Relazione Sanitaria (6176b1a9631818703776143d_relazione-sanitaria@2x-1024x640.png)
*   **Contesto:** Sezione "Strumenti / Relazione sanitaria".
*   **Campi compilati:** Azienda "Solaris Srl", Data inizio "01/01/2020", Data fine "31/12/2020".
*   **Tabelle:** "Accertamenti esclusi" contiene due voci (Tampone COVID-19, Test sierologico COVID-19). La sezione "Mansioni" è vuota.

## 13. Esportazione Allegato 3B (MW-Allegato-3B-1024x874 (1).png / MW-Allegato-3B-1024x874.png)
*   **Contesto:** "Strumenti / Allegato 3B", scheda "Excel".
*   **Impostazioni:** Raggruppa per "Azienda". Ragione sociale "Dilaxia S.p.a.", Anno "2024". Luogo di lavoro selezionato: "Sede Bologna".
*   **Dettagli:** L'area mansioni è vuota, con l'indicazione che lasciandola vuota verranno incluse tutte le mansioni.

## 14. Anagrafica Lavoratori Dilaxia (MW-Anagrafiche-1024x664_2.png)
*   **Contesto:** Uguale alla schermata principale dei lavoratori. Sezione "Aziende > Dilaxia S.p.a." scheda "Lavoratori".
*   **Riepilogo:** 2 lavoratori idonei, 3 senza idoneità.
*   **Tabella:** Elenco di 5 dipendenti (Barbieri, Di Napoli, Ferrioli, Melloncelli, Parma) con relative mansioni e stato di idoneità.

## 15. Applicazione Protocollo (MW-Applica-protocollo-1024x689.png)
*   **Contesto:** Popup di conferma "Applica protocollo".
*   **Messaggio:** Indica che il "Protocollo per Videoterminalista" sarà applicato a 3 lavoratori di Dilaxia S.p.a.
*   **Impostazioni:** Scadenza episodio impostata su "Data automatica". Scadenza nuovi accertamenti su "Data di inizio mansione". Pulsanti "Annulla" e "Applica".

## 16. Esportazione Cartella Sanitaria (MW-Cartella-sanitaria-1024x726.png)
*   **Contesto:** Modale "Esporta cartella sanitaria" sopra la scheda del lavoratore Piccinini Giovanni (azienda Commit Software, Sede Firenze).
*   **Opzioni scelte:** Esporta "Tutti i referti".
*   **Spunte:** Includi allegati dei referti, Includi prestazioni erogate e refertate. Informativa privacy non spuntata.

## 17. Dashboard Segreteria (MW-Dashboard-segreteria-1024x608.png)
*   **Contesto:** Home page del gestionale per il ruolo "Segreteria Hub". Utente connesso: Federico Ferrioli.
*   **Interfaccia:** Menu a tendina "Le tue attività" aperto, con la spunta su "Visite ed accertamenti" nella categoria Scadenze. Sotto c'è una tabella con i protocolli di alcuni dipendenti di Dilaxia S.p.a.

## 18. Disponibilità Operatori (MW-Disponibilita-operatori-1024x651.png)
*   **Contesto:** Scheda "Disponibilità" per l'operatore sanitario Vendrame Carlo.
*   **Programmazione:** Periodo visualizzato 01/11/2024 - 30/11/2024. Orari inseriti: Lunedì (08:00 - 13:00) e Mercoledì (13:00 - 18:00).
*   **Straordinari:** Nel pannello di destra c'è una "Presenza straordinaria" il 30/10/2024 dalle 10:00 alle 13:00.

## 19. Creazione Fatture - Dati (MW-Fatture-1.png)
*   **Contesto:** Procedura guidata fatturazione, step centrale "Dati da fatturare".
*   **Parametri inseriti:** Data inizio "01/09/2024", Data fine "30/09/2024", Data emissione "30/09/2024".
*   **Filtri:** Aziende da fatturare impostato su "Tutte le aziende", Prestazioni da fatturare su "Tutti gli accertamenti". Pulsante "Avanti" evidenziato.


## 20. Invio Accertamenti al Laboratorio (MW-Invia-al-laboratorio-1024x571.png)
*   **Contesto:** Modale di prenotazione. L'utente sta prenotando un appuntamento in data 12/09/2024 (09:00 - 09:25) presso il "Luogo di visita principale".
*   **Azione:** È aperto un popup secondario "Invia accertamenti al laboratorio".
*   **Campo:** Menu a tendina per selezionare il "Laboratorio*" a cui inviare l'accertamento selezionato.
*   **Sfondo:** Nella tabella "Appuntamenti", l'operatore sanitario selezionato è "Nuovo Medico".

## 21. Listini Aziendali (MW-Listino-1-1024x531.png)
*   **Contesto:** Sezione "Fatturazione" > "Listini aziendali".
*   **Intestazione:** "Fatturazione / Listini aziendali".
*   **Contenuto Principale:** Elenco dei listini configurati nel sistema.
*   **Tabella:** Mostra la "Descrizione" del listino e la colonna "Aziende e sedi".
    *   Esempi visibili: "Aibox centrale" (Layo), "Company esterne" (2 luoghi), "Listino dedicato" (Electron Service SAS), "Listino Dilaxia" (2 luoghi), "Listino esterno" (NSI Nier Soluzioni Informatiche > Sede API), ecc.
*   **Paginazione:** Sono visibili gli elementi "1 - 10 di 12".

## 22. Creazione Nota di Credito - Cliente (MW-Note-di-credito.png)
*   **Contesto:** Procedura guidata creazione nota di credito, step "Cliente".
*   **Titolo:** "Seleziona il cliente e la fattura di riferimento."
*   **Campi selezionati:**
    *   Ragione sociale del cliente: Dilaxia S.p.a.
    *   Fattura di riferimento: N° ML00001 del 18/06/2024.
    *   Linea di fatturazione: Linea di fatturazione privata.
*   **Riepilogo in basso:** Conferma i dati del cliente (DILAXIA S.P.A., Via Bonazzi 2, Bologna, con P.IVA) e della fattura di riferimento.

## 23. Modalità Offline - Homepage (MW-Offline-1-1024x574.png / MW-Offline-3-1024x804.png)
*   **Contesto:** Homepage del medico competente Carlo Verdi.
*   **Stato:** Il sistema è attualmente in modalità **Offline** (connessione: Offline in arancione e interruttore attivato). Gli appuntamenti sono stati scaricati il "17/10/2024 alle 13:58:16".
*   **Tabella Appuntamenti (Oggi):** Elenco visite previste in assenza di rete per NSI Nier Soluzioni Informatiche.
    *   Ore 09:00 - Amato Giulietta: Esami del sangue (B.Anti Hbcab, A.Anti Hbsab, A.Anti Hcv) e Giudizio d'idoneità (stato "in attesa", pallino giallo).
    *   Ore 09:35 - Carducci Matteo: Esame degli occhi e Visita Medica.

## 24. Messaggio di Disconnessione (MW-Offline-2-1024x809.png)
*   **Contesto:** Homepage (stessa vista dell'immagine precedente, Carlo Verdi).
*   **Evento:** Popup centrale di notifica con una spunta verde.
*   **Messaggio:** "La connessione ad internet non è disponibile in questo momento, passa alla modalità offline per continuare il tuo lavoro. Clicca qui per ricaricare la pagina e passare alla modalità offline."

## 25. Sincronizzazione Dati Vuota (MW-Offline-5.png)
*   **Contesto:** Sezione "Strumenti > Sincronizza dati".
*   **Stato:** Nessuna operazione in sospeso.
*   **Messaggio:** Sotto la spiegazione su come funziona la sincronizzazione dei dati compilati offline, appare la dicitura in grigio "Nessun dato da sincronizzare...".

## 26. Parcella del Medico (MW-Parcelle-1-1024x540.png / MW-Parcelle-1024x540.png)
*   **Contesto:** Sezione "Fatturazione" > "Parcella del medico".
*   **Stato:** Scheda "Da saldare" attiva.
*   **Tabella:** Mostra le parcelle da pagare agli operatori sanitari per il periodo "01/01/2024 - 31/12/2024".
    *   **Fogli Gianmario:** 30 prestazioni eseguite (con icona di avviso triangolare arancione), Totale parcella 130 €.
    *   **Verdi Carlo:** 10 prestazioni eseguite (con icona di avviso), Totale parcella 60 €.

## 27. Personalizza Protocollo Lavoratore (MW-Personalizza-protocollo-lavoratore-1024x660.png)
*   **Contesto:** Scheda "Protocolli" per la lavoratrice **Calamai Eleonora**.
*   **Azione:** Popup "Aggiungi visita o accertamento". L'utente sta personalizzando il protocollo per questa singola dipendente.
*   **Campi inseriti:**
    *   Periodicità: "1A" (1 anno).
    *   Accertamento aggiunto all'elenco: "Esame Audiometrico Tonale" (con icona a cestino per rimuoverlo).
*   **Sfondo:** È visibile che la lavoratrice ha già il "Protocollo per Videoterminalista Commit" associato (nella barra laterale destra).


## 28. Modifica Interfaccia Lavoratore (MW-Personalizzazione-cataloghi-1024x646.png)
*   **Contesto:** Personalizzazione dei campi nella scheda lavoratore ("Generali").
*   **Azione:** Popup "Aggiungi un campo alla scheda". 
*   **Campi:** Tipo, Etichetta del campo, Dimensione del campo (impostato su 100%), casella "Obbligatorio".

## 29. Personalizzazione Interfaccia Refertazione (MW-Personalizzazioni-interfacce...)
*   **Contesto:** Strumenti / Interfacce di refertazione, specifica per "esame occhi".
*   **Azione:** Popup "Aggiungi un campo alla tua interfaccia di refertazione".
*   **Campi:** Tipo, Etichetta del campo, casella "Obbligatorio". Sullo sfondo si notano le sezioni "Anamnesi familiare" e "Anamnesi patologica".

## 30. Reportistica Prestazioni Eseguite (MW-Prestazioni-aziendali-1-1024x473.png)
*   **Contesto:** Sezione relativa alle prestazioni eseguite, filtrabile per reportistica.
*   **Tabella:** Tre righe per la prestazione "Sopralluogo MC" (quantità 1).
    *   01/06/2024 - Dilaxia S.p.a. (Sede Bologna) - Bertasi Mauro.
    *   24/09/2023 - Commit Software (Sede Firenze) - Tonelli Viviana.
    *   01/02/2024 - Nova Group s.r.l. (Sede Cervia) - Mantovani Francesco.
*   **Stato Fatturazione:** Nessuna di queste prestazioni risulta attualmente fatturata ("No").

## 31. Dettaglio Preventivo (MW-Preventivi-...)
*   **Contesto:** Fatturazione / Preventivi > Preventivo numero 00001 per l'azienda "Dilaxia S.p.a." (data 17/10/2024).
*   **Prestazioni inserite:**
    *   Visita Medica: 4 quantità, 20,00 € cad., totale 80,00 €.
    *   Visio Test: 4 quantità, 12,00 € cad., totale 48,00 €.
    *   Es.Clinico Funz...: 1 quantità, 18,00 € cad., totale 18,00 €.
*   **Totali:** Subtotale 146,00 €, con uno sconto applicato di 6 €. Il Totale (IE) ammonta a 140,00 €.

## 32. Dettaglio Protocollo di Mansione (MW-Protocolli-...)
*   **Contesto:** Visualizzazione del "Protocollo per Videoterminalista".
*   **Luoghi di lavoro:** Assegnato a "Dilaxia S.p.a.".
*   **Visite e accertamenti previsti:**
    *   Visio Test (Periodicità: 5A 50 2A).
    *   Visita Medica (Periodicità: 5A 50 2A), segnata con una stella piena per indicarla come visita "Principale".


## 33. Protocolli su Richiesta (MW-Protocolli-richiesta-1024x469.png)
*   **Contesto:** Sezione "Protocolli su richiesta". È in corso l'applicazione del "Protocollo non esposto".
*   **Azione:** Modale "Scegli a chi applicare il protocollo".
*   **Filtri:** L'utente sta filtrando i lavoratori dell'azienda "Dilaxia SpA".
*   **Elenco:** Lista di lavoratori da selezionare tramite spunta: De Paoli Maria, Fazio Giorgio, Lorenzin Patrizia, Rendo Giusi, Rossi Gianluca, Torre Lorenzo.

## 34. Inserimento Referto Visita Medica (MW-Referti-1024x579.png)
*   **Contesto:** Scheda "Lavoratori > Ferrioli Federico" (Dilaxia S.p.a.), dettaglio dell'episodio "Visita Medica".
*   **Stato:** Il menu in alto a sinistra indica che la visita è in stato "Concluso". 
*   **Pulsanti:** "Carica referto", "Firma", Stampa.
*   **Dati compilati (scheda Dati visita):**
    *   Data prenotazione e valutazione: 18/06/2024.
    *   Medico competente: Bertasi Mauro.
    *   Tipo di visita: Preventiva.
    *   Esito: Normalità clinica.
*   **Rischi:** Segnalato il rischio di mansione "Videoterminali". Nessun rischio accessorio o specifico.

## 35. Configurazione Relazione Sanitaria (MW-Relazione-sanitaria-1024x809.png)
*   **Contesto:** Sezione "Strumenti / Relazione sanitaria".
*   **Filtri principali:** Azienda "Dilaxia S.p.a.", periodo dal 01/01/2024 al 31/12/2024.
*   **Impostazioni:** La casella "Raggruppa tutti i dati per sede aziendale" è spuntata. L'opzione sui dati biostatistici non è spuntata.
*   **Accertamenti esclusi:** La tabella è vuota, il che significa che verranno inclusi tutti gli accertamenti.

## 36. Reportistica Giudizi (MW-Reportistica-1024x833.png)
*   **Contesto:** Sezione "Reportistica / Giudizi".
*   **Grafico a barre (in alto):** Mostra l'andamento del numero di giudizi negli anni (dal 2015 al 2024). C'è un picco nel 2023 (oltre 50) e 32 giudizi nel 2024.
*   **Grafico a ciambella (in basso):** "Distribuzione esiti dei giudizi di idoneità". Evidenzia che la stragrande maggioranza (89,2%) risulta "Idoneo" (colore giallo). Il 6,5% (rosso) è "Idoneo con limitazioni e prescrizioni".

## 37. Scadenzario Aziende (MW-Scadenzario-aziende-1024x492.png / MW-Scadenzario-aziende-1024x492 (1).png)
*   **Contesto:** Dashboard "Scadenzario", vista per "Aziende" (selettore in alto a destra).
*   **Riepilogo in alto:** 
    *   Calendario di Ottobre 2024 con il giorno 2 evidenziato in rosso. 
    *   Grafico a torta "Totale accertamenti - 32": suddivisi in Scaduto (78.1%, verde), Programmato (18.8%, rosso), Erogato (3.1%, giallo).
*   **Elenco in basso:** Filtrato per "Scaduto e in scadenza". Mostra le aziende Dilaxia S.p.a. (9 accertamenti, 2 dipendenti) e Commit Software (17 accertamenti, 5 dipendenti).

## 38. Scadenzario Lavoratori (MW-Scadenzario-lavoratori-1024x586.png)
*   **Contesto:** Dashboard "Scadenzario", vista passata a "Lavoratori". Stessi grafici riassuntivi della vista Aziende in alto.
*   **Elenco in basso:** Elenco dei dipendenti con accertamenti "Scaduto e in scadenza".
    *   Parma Simone (3 accertamenti dal 06/06/2023).
    *   Seguono altri lavoratori (Calamai, Menga, Piccinini, Rogai, Secci) con accertamenti in scadenza al 24/09/2024.

## 39. Impostazioni Sedi (MW-Sedi-1024x608.png)
*   **Contesto:** "Impostazioni / Account", scheda "Sedi".
*   **Contenuto:** Elenco delle sedi fisiche configurate nel sistema.
    *   Centro medico Cavour (via Traversagno 22, Casalecchio di Reno).
    *   Villa Stuart (via Bellotti 14b, Bologna).

## 40. Gestione Utente / Medico (MW-Utenti-1-1024x614.png)
*   **Contesto:** "Impostazioni / Utenti", dettaglio del profilo di **Mauro Bertasi**.
*   **Stato:** Profilo "Attivo" (interruttore blu).
*   **Dati anagrafici:** Nome utente "mauro.bertasi". Ruolo di sistema assegnato: Operatore sanitario.
*   **Firme:** Abilitata la "firma con Yousign" tramite OTP via Email. L'indirizzo email impostato è mauro.bertasi@mailinator.com.
*   **Abilitazioni (Pannello destro):** L'utente ha i permessi attivi solo per la "Sorveglianza sanitaria" (spunta grigia).


## 41. Impostazioni Luoghi di lavoro per Utente (MW-Utenti-2-1024x622.png)
*   **Contesto:** "Impostazioni / Utenti", dettaglio del profilo di **Mauro Bertasi** (stesso utente precedente).
*   **Scheda attiva:** "Visibilità".
*   **Contenuto:** Tabella "Luoghi di lavoro" che definisce a quali sedi l'utente ha accesso.
*   **Dettagli visibili:** All'utente è assegnata l'azienda "Dilaxia S.p.a." con visibilità su "Tutte le sedi", "Tutti gli edifici", "Tutti i livelli", "Tutti i locali".

## 42. Gestione Permessi Utente (MW-Utenti-3-1024x808.png)
*   **Contesto:** "Impostazioni / Utenti", dettaglio del profilo di **Mauro Bertasi**.
*   **Scheda attiva:** "Permessi".
*   **Contenuto:** Griglia dettagliata che definisce i permessi di "Visualizzazione" e "Modifica" per le varie sezioni del gestionale.
*   **Dettagli visibili:**
    *   **Visualizzazione consentita:** Operatori sanitari, Aziende, Lavoratori, Protocolli, Strumenti > Audit, Impostazioni > Cataloghi, Impostazioni > Reportistica.
    *   **Modifica consentita (spunta blu):** Protocolli, Strumenti > Audit.
    *   **Permessi parziali/misti (trattino grigio/blu):** Operatori sanitari (modifica parziale), Lavoratori (modifica parziale), Strumenti (visualizzazione parziale), Impostazioni (visualizzazione parziale), Reportistica (modifica parziale).

## 43. Visualizzazione Agenda (youwork-agende.jpg)
*   **Contesto:** Dashboard generale, sezione "Agenda". Utente connesso: Andrea Azzolina (in basso a sinistra).
*   **Interfaccia:** Calendario con vista "Settimana" (Aprile 2024, dal 22 al 28).
*   **Contenuto:** 
    *   I blocchi nel calendario rappresentano appuntamenti per vari "Luogo di visita".
    *   È aperto un tooltip (popup al passaggio del mouse o clic) su un appuntamento di Giovedì 25 (10:00 - 10:30). 
    *   Il tooltip mostra le "Note" dell'appuntamento (che specificano un limite di visualizzazione di 4 righe per la descrizione) e presenta i pulsanti "Elimina" e "Modifica".

## 44. Nuova Prenotazione Accertamenti (youwork-prenotazioni.jpg)
*   **Contesto:** Modale "Nuova prenotazione".
*   **Campi in alto:** 
    *   Luogo di visita: "Nome azienda > Nome sede aziendale > Luogo esterno".
    *   Data: 12/04/2024. Orario: 11:20 - 12:20.
*   **Elenco Appuntamenti:** Tabella per assegnare gli accertamenti al lavoratore "Giulio Rossi".
    *   Accertamenti elencati: "3 accertamenti", "Ecg Holter", "Visita medica", "Giudizio d'idoneità".
    *   Tutti gli accertamenti sono pre-assegnati all'Operatore sanitario "Luca l'operatore". Il campo "Medico referto" è da selezionare. Sono presenti delle icone di avviso rosse accanto ad alcuni menu a tendina.

## 45. Opziona Agenda / Ripianificazione (youwork-ripianificazioni.jpg)
*   **Contesto:** Dalla visualizzazione "Agenda" (sfondo), è aperto un pannello laterale destro chiamato "Opziona agenda".
*   **Azione:** L'utente (Andrea Azzolina) sta creando un blocco opzionato nel calendario.
*   **Campi:**
    *   Data e ora: 12/04/2024, 11:20 - 12:20.
    *   Luogo di visita: "Nome azienda > Nome sede aziendale > Luogo esterno".
    *   Note: Campo di testo vuoto.
    *   Sezione "Visite ed accertamenti": Permette di cercare un accertamento e indicare il numero di lavoratori da opzionare ("Max 0" inserito per ora). Pulsanti in alto: "Nominalizza", "Salva" (blu).

## 46. Scadenzario Generale Lavoratori (youwork-scadenziari.jpg)
*   **Contesto:** Dashboard "Scadenzario", vista per "Lavoratori" (interruttore in alto a destra attivato). Utente connesso: Andrea Azzolina.
*   **Riepilogo in alto:**
    *   Calendario mensile (Febbraio) in cui **tutti** i giorni lavorativi sono evidenziati con un badge rosso contenente il numero "34" (probabilmente indicante 34 scadenze al giorno).
    *   Grafico a torta "Totale accertamenti - 645". I dati sono suddivisi in porzioni uguali (64% in legenda, probabile errore grafico o dato fittizio d'esempio per il mockup) tra: Prenotati, Scaduti, In scadenza, Programmati, In attesa di giudizio.
*   **Elenco in basso:** Lista generica di lavoratori (tutti chiamati "Nome Cognome"). Ciascuno ha "3 accertamenti dal 12/03/2024". La riga è espandibile.