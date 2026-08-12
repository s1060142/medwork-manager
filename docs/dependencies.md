# Dipendenze tra Fasi - MedWork Manager

## 📌 Risposta Diretta
**Sì, la Fase 2 (Design System & UX/UI) può essere lavorata in parallelo alle Fasi 0 e 1.**
Non ci sono dipendenze bloccanti tra queste fasi.

---

## 🔹 Fasi AUTONOME (Possono essere lavorate in parallelo)

### 1. **📚 Knowledge Base Normativa (Fase 0)**
- **Dipendenze**: Nessuna.
- **Output**: Regole normative codificate (es. `/normative/rules/dlgs_81_2008.json`).
- **Agente**: Legal Tech.

### 2. **🏗️ Architettura Tecnica (Fase 1)**
- **Dipendenze**: Nessuna.
- **Output**: OpenAPI specs, schema DB, autenticazione.
- **Agente**: Solution Architect + Backend Engineer.

### 3. **🎨 Design System & UX/UI (Fase 2)**
- **Dipendenze**: Nessuna.
- **Output**: Prototipi Figma, libreria componenti React/React Native.
- **Agente**: UX/UI Designer + Frontend Engineer.

---

## ⚠️ Attenzione: Dipendenze Future
- **Fase 2 (Design System)** dovrà essere **allineata con la Fase 1 (Architettura)** per:
  - Componenti React/React Native che rispettino lo stack tecnologico.
  - Flussi utente che siano compatibili con le API (quando pronte).
- **Soluzione**: Usare **mock API** per testare i prototipi in attesa delle API reali.

---

## 🎯 Consigli per la Fase 2
1. **Lavora con mock API**: Crea dati di test per simulare le API del backend.
2. **Allineamento con Fase 1**: Assicurati che i componenti siano compatibili con lo stack tecnologico (Next.js, React Native, TypeScript, TailwindCSS).
3. **Documenta i flussi utente**: Crea un file `/docs/ux/flussi_utente.md` per allineare i team.

---

## 📅 Timeline Suggerita
| **Settimana** | **Fase 0** | **Fase 1** | **Fase 2** |
|---------------|------------|------------|------------|
| **1**         | In corso   | In corso   | In corso   |
| **2**         | ✅ Completata | ✅ Completata | Prototipi Figma |
| **3**         | -          | -          | Libreria componenti |

---

## 🔥 Conclusione
**Puoi iniziare la Fase 2 subito**, in parallelo alle Fasi 0 e 1, **senza conflitti**. Assicurati solo di:
- Usare **mock API** per testare i prototipi.
- Allinearti con lo **stack tecnologico** definito nella Fase 1.
- Documentare i **flussi utente** per i team successivi.