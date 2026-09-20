# MedWork Manager — Product Vision
**Version**: BETA HARDENING (Settembre 2026)

---

## Why MedWork Exists

I software di medicina del lavoro italiani (Winasped, 81ML, Twind) sono datati, lenti, on-premise, e privi di intelligenza. MedWork nasce per colmare un gap reale: **faster di CartSan, faster di Winasped, faster di 81ML**.

Ogni decisione è misurata in minuti risparmiati al medico competente. Il successo non è codice scritto né report generati — è un medico che completa i task più velocemente con meno click e meno errori di compliance.

---

## Target Users

| Ruolo | Fabbisogno |
|---|---|
| **Medico Competente** | Gestire visite, giudizi, scadenze, documenti legali con il minimo sforzo |
| **Segreteria** | Gestione anagrafiche aziende/lavoratori, prenotazioni, comunicazioni |
| **Datore di Lavoro** | Visionare scadenze aziendali, stato compliance, ricevere notifiche |
| **RSPP** | Monitoraggio rischi, DVR, protocolli di sicurezza |

---

## Competitive Positioning

| Dimensione | MedWork | Winasped | 81ML | CartSan |
|---|---|---|---|---|
| Web SaaS | ✅ | ❌ (on-premise) | ✅ | ✅ |
| Multi-tenant | ✅ | ❌ | ⚠️ | ❌ |
| UI moderna | ✅ | ❌ | ⚠️ | ✅ |
| API aperte | ✅ | ❌ | ❌ | ❌ |
| Mobile offline | ❌ (piano) | ❌ | ❌ | ❌ |
| **AI charting** | ✅ (AIChartingService) | ❌ | ❌ | ❌ |
| Prezzo | Freemium | Costoso | Competitivo | Costoso |

**Differenziatori unici**: SaaS multi-tenant nativo, API aperte, pricing freemium, portale aziende self-service (nessun competitor lo ha).

**Svantaggio**: nessun competitor ha mobile offline-first, AI charting, o OCR referti — ma MedWork neanche queste ancora (AI charting è implementato come AIChartingService, mobile e OCR sono pianificati).

---

## Principi di Prodotto

1. **Compliance by design** — ogni feature conforme a D.Lgs. 81/08 e GDPR art. 9
2. **Zero clic superflui** — ogni click ha senso clinico o operativo
3. **Legal validity first** — i documenti generati devono essere legalmente validi
4. **Multi-tenant isolation** — ogni dato è isolato per tenant, sempre
5. **No stubs in produzione** — ciò che è annunciato deve funzionare
6. **Physician productivity** — ogni decisione è misurata in minuti risparmiati

---

## Stato Attuale

**Fase**: BETA HARDENING

- Backend: ASP.NET Core 10 + EF Core 10 + SQL Server
- Frontend: React + Vite + Material UI (47 componenti)
- PDF: QuestPDF server-side (FitnessJudgment, Allegato3A, AnnualHealthReport)
- Testing: xUnit (48+ integration tests) + Playwright (45+ test cases) + grid-sync (5/5 PASS)

---

*Vedere `CURRENT_CAPABILITIES.md` per i dettagli per modulo, `ROADMAP.md` per il futuro.*
