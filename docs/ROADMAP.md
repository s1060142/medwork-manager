# MedWork Manager — Roadmap
**Data**: Settembre 2026
**Stato attuale**: BETA HARDENING PHASE

---

## FASE COMPLETATE (Non più in questo documento)

FASE 0-4 sono state completate e documentate in `IMPLEMENTED_FEATURES.md`. Vedi quel file per:
- FASE 0 (build, test, multi-tenant foundation)
- FASE 1 (MedicalRecord, VisitJudgment, Signature, Documents controllers)
- FASE 2 (Company Groups, UI verification, grid-sync 5/5 PASS)
- FASE 3 (P0 productivity: refresh token, TenantId fix, protocol DB persistence)
- FASE 4 (P1 productivity: Legal Documents Sprint con QuestPDF, Critical Improvements, ECC Remediation)

---

## BETA HARDENING (Corrente)

### Obiettivi Primari
1. **ECC Remediation** — tutte le critical findings
2. **Production Readiness** — deploy reale
3. **Workflow Optimization** — riduzione click
4. **Edge-Case Testing**
5. **Regression Prevention**

### 🔴 Sicurezza — Must Fix
- [ ] **JWT secret**: ruotare da placeholder, gestire con Key Vault
- [ ] **CORS**: parametrizzare per ambiente (attualmente localhost)
- [ ] **Global exception handler**: nessun middleware attivo
- [ ] **Structured logging**: implementare `ILogger<T>` + Serilog
- [ ] **Rate limiting**: su endpoint sensibili
- [ ] **EPPlus license**: aggiornare a 5+ o sostituire con ClosedXML

### 🔴 Core Features — Must Fix
- [ ] **Paginazione API**: su tutti gli endpoint di lista
- [ ] **DTOs separati**: non esporre EF entities direttamente
- [ ] **Scadenziario end-to-end**: cablaggio notification completo
- [ ] **Email digest giornaliero**: automatico alle 7:30
- [ ] **Notifiche reali**: trasporti PEC/Email operativi (non più stub)
- [ ] **Firma digitale DPR 445/2000**: completa su tutti i documenti

### 🔴 Compliance — Must Fix
- [ ] **GDPR consent workflow**: granulare, con log
- [ ] **Audit trail immutabile**: server-side, non cancellabile (parzialmente fatto)
- [ ] **Allegato 3B**: XSD completo conforme INAIL

### 🟡 Testing — Must Complete
- [ ] Playwright: copertura CompanyGroups, MasterData, Appointment, MedicalVisitAI
- [ ] Grid-sync: estensione a tutti i moduli oltre i 5 attuali
- [ ] Regression test: nessun test esistente rotto
- [ ] Beta gate: 13/13 P0 test passanti

### 🟡 Performance
- [ ] Cache Redis per sessioni e rate limiting
- [ ] CORS per ambiente
- [ ] SQL Server RLS o migrazione a PostgreSQL con RLS

---

## Post-Beta — Fase 5 (Mesi 1-3 post-Beta)

- Deploy produzione reale
- Monitoraggio completo (logging, alerting, health check)
- Beta customer feedback loop
- PRD + documentazione utente finale

---

## Post-Beta — Fase 6 (Mesi 4-8)

- Portale aziende self-service (login SPID, scadenze, idoneità, statistiche)
- Portale lavoratori (accesso in lettura ai propri dati)
- Email digest proattivo alle aziende
- Import migrazione da Winasped/81ML (CSV wizard)
- Compliance engine con job notturno su tutti i protocolli

---

## Post-Beta — Fase 7 (Mesi 9-18)

- App mobile offline-first (React Native + Expo)
- AI pre-compilazione vocale (Whisper + LLM)
- OCR referti (Azure Document Intelligence o Tesseract)
- SPID/CIE login reale
- Sync HR bidirezionale (Zucchetti/TeamSystem)
- Protocol marketplace community
- Benchmark anonimo KPI tra medici

---

## Regole di Roadmap

1. **Nessuna nuova feature durante ECC remediation** (a meno che non sia strettamente necessario)
2. **Ogni feature richiede**: build validation + UI validation + workflow validation
3. **Playwright test**: ogni nuova feature ha test E2E
4. **Tenant isolation**: ogni nuova query verificata per cross-tenant leakage
5. **Documentazione**: se il comportamento cambia, aggiornare questo documento

---

## Timeline

| Periodo | Attività | Stato |
|---|---|---|
| Ago 2026 | FASE 0-4 (build, test, legal docs, critical fixes) | ✅ Completato |
| Set 2026+ | BETA HARDENING | 🔴 In corso |
| TBD+1 | Production release | ⏳ Pianificato |
| TBD+3+ | Scale, AI, Mobile | ⏳ Futuro |

---

*Vedere `RELEASE_READINESS.md` per i criteri specifici di Beta e Production release.*
