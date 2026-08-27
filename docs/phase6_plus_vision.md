# Flussi Utente - MedWork Manager

## 🎨 Design System & UX/UI (Fase 2)

### **📱 Mobile App (React Native)**
- **Flusso 1: Visita in Azienda**
  - **Step 1**: Login con SPID/CIE.
  - **Step 2**: Selezione azienda (se multi-azienda).
  - **Step 3**: Scansione QR codice paziente (o inserimento manuale).
  - **Step 4**: Compilazione protocollo (campi pre-compilati da OCR referti).
  - **Step 5**: Dettatura vocale note mediche.
  - **Step 6**: Firma grafometrica.
  - **Step 7**: Invio dati (offline-first, sincronizza al ritorno).

- **Flusso 2: Gestione Pazienti**
  - **Step 1**: Dashboard pazienti (filtri per stato, rischio, data visita).
  - **Step 2**: Scheda paziente (anamnesi, referti, cronologia visite).
  - **Step 3**: Generazione PDF cartella sanitaria (FHIR/OpenEHR).

### **🌐 Web App (Next.js)**
- **Flusso 1: Dashboard Medico**
  - **Step 1**: Login con SPID/CIE.
  - **Step 2**: Dashboard con metriche (visite completate, AI adoption, compliance scan).
  - **Step 3**: Gestione pazienti (come Mobile App).
  - **Step 4**: Protocol Designer (drag-and-drop, generazione regole).

- **Flusso 2: Workspace Multi-Medico**
  - **Step 1**: Creazione/selezione workspace.
  - **Step 2**: Collaborazione in tempo reale (commenti, versioning protocolli).
  - **Step 3**: Handoff tra medici (assegnazione pazienti, note condivise).

### **📊 Protocol Designer Visivo**
- **Flusso 1: Creazione Protocollo**
  - **Step 1**: Selezione template (es. visita ergonomica, esame audiometrico).
  - **Step 2**: Personalizzazione campi (drag-and-drop, condizioni logiche).
  - **Step 3**: Validazione compliance (alert in tempo reale).
  - **Step 4**: Esportazione FHIR/OpenEHR.

### **🤖 AI-Assisted Charting**
- **Flusso 1: Dettatura Vocale**
  - **Step 1**: Registrazione audio note mediche.
  - **Step 2**: Trascrizione → note strutturate.
  - **Step 3**: Suggerimento giudizio idoneità (basato su evidence).

- **Flusso 2: OCR Referti**
  - **Step 1**: Caricamento immagine referto.
  - **Step 2**: Estrazione dati → pre-compilazione campi.

## 🎯 Obiettivi UX
1. **≤ 3 click per task core** (es. firma, invio dati).
2. **Feedback immediato** (es. alert compliance, suggerimenti AI).
3. **Adattabilità** (default intelligenti, configurazione opzionale).

## 📅 Timeline
| **Settimana** | **Attività** |
|---------------|-------------|
| **1**         | Prototipi Figma |
| **2**         | Libreria componenti React/React Native |
| **3**         | Test utente (usabilità, compliance) |

## 🔥 Note
- **Allineamento con Fase 1 (Architettura)**: Usare mock API per testare i flussi.
- **Documentazione**: Aggiornare `/docs/ux/flussi_utente.md` con screenshot/animazioni Figma.

Se hai bisogno di ulteriori dettagli o di modifiche, fammelo sapere!