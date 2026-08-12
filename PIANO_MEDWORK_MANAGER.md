# Piano Strategico MedWork Manager
**Software di nuova generazione per Medici Competenti / Sorveglianza Sanitaria**

> Basato su analisi competitiva completa del mercato italiano (Winasped, 81ML, Twind, SimpleMDL, Koamed, CANOPO, TaleteWeb, Moby, Blumatica, Mediscopio, Sangest, MedOFFICE R2)

---

## 🎯 Visione & Posizionamento

### Mission
> **Eliminare la burocrazia dalla medicina del lavoro** dando ai medici competenti uno strumento che *pensa con loro*, non che li costringe a compilare moduli.

### Differenziazione Core (Unique Value Proposition)
| Pilastro | Cosa facciamo diversamente |
|----------|---------------------------|
| **Protocol Designer Visivo + Compliance-as-Code** | Disegni il protocollo → il sistema valida in tempo reale vs D.Lgs. 81/08, genera rules eseguibili, esporta FHIR/OpenEHR |
| **AI-Assisted Charting** | Dettatura vocale → note strutturate; OCR referti → pre-compilazione; suggerimento giudizio idoneità basato su evidence |
| **Offline-First Mobile Nativo** | Visite in azienda senza segnale → sincronizza al ritorno; firma grafometrica su tablet; foto referti |
| **Ecosistema Aperto (API-First)** | Sync bidirezionale HR (Zucchetti, TeamSystem, Sage, Arca), PagoPA, SDI, PEC, SPID/CIE, FSE regionale |
| **Compliance Engine Vivo** | Regole normative codificate → alert automatici se protocollo non conforme; changelog normativo *applicato* |

### Target Primario
1. **Studi associati / Reti di medici** (multi-sede, multi-medico, fatturazione centralizzata)
2. **Medici competenti singoli** ad alto volume (>500 visite/anno) che vogliono efficienza
3. **Centri polispecialistici / Cliniche del lavoro** che gestiscono sorveglianza per conto terzi

### Principi Guida (Non Negozabili)
1. **Zero click inutili**: task core ≤ 3 click / ≤ 5 min a visita
2. **Dati sempre esportabili**: zero vendor lock-in (FHIR, OpenEHR, XML INAIL, CSV)
3. **Default intelligenti, configurazione opzionale**: funziona out-of-the-box, si adatta se serve
4. **Privacy by design**: GDPR art. 9 nativo, consent management granulare, DPIA integrata
5. **Made in Italy per l'Italia**: PEC, SDI, SPID/CIE, commercialisti italiani, normative locali

---

## 📊 Analisi Competitiva Sintetica (Gap Identificati)

| Area | Stato Mercato Attuale | Nostro Vantaggio |
|------|----------------------|------------------|
| **UX/UI** | Gestionali anni 2000, tabelle dense, workflow rigidi | Design moderno task-oriented, wizard, dashboard role-based |
| **AI/ML** | Assente | Charting assistito, predictive scheduling, insight automatici |
| **Mobile** | Responsive inutilizzabile in visita | App nativa offline-first, firma grafometrica, OCR |
| **Integrazioni** | Export CSV/Excel (silos) | API bidirezionali native, webhook HR, PagoPA, FSE |
| **Protocolli** | Liste Excel/tabelle rigide | Protocol Designer visivo + Rules Engine + Compliance-as-Code |
| **Normativa** | Changelog letti mesi dopo | Compliance engine: regole codificate, alert real-time |
| **Business Model** | Licenze/postazione costose | Freemium → per-visita/per-azienda/revenue-share |
| **Collaborazione** | Inesistente | Workspace multi-medico, handoff, portale aziende collaborativo |
| **Standard** | Proprietari | FHIR R4 IT, HL7 CDA R2, OpenEHR, XML INAIL 3B nativo |

---

## 🏗️ Architettura Tecnica

### Stack Tecnologico
```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Multi-platform)                    │
│  Web App (Next.js 14+, React 18, TypeScript, TailwindCSS)      │
│  Mobile App (React Native 0.74+, Expo SDK 50, TypeScript)      │
│  - Dashboard medico (Web)                                       │
│  - Portale aziende (Web)                                        │
│  - Portale lavoratori (Web)                                     │
│  - Visite offline-first (Mobile)                                │
│  - Firma grafometrica su tablet (Mobile)                        │
│  - Foto/OCR referti (Mobile)                                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │ GraphQL (Apollo) / tRPC
┌─────────────────────────▼───────────────────────────────────────┐
│                      API GATEWAY (Kong / Traefik)               │
│  Auth (OIDC/Keycloak + SPID/CIE)  │  Rate limit  │  Audit log  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    CORE SERVICES (Microservizi Node.js/Go)      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Protocol    │ │ Visit &     │ │ Document    │               │
│  │ Engine      │ │ Scheduling  │ │ Generator   │               │
│  │ (CEL/JSONLogic)│ │ (OR-Tools)  │ │ (FHIR/CDA)  │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Compliance  │ │ AI/ML       │ │ Integration │               │
│  │ Monitor     │ │ Pipeline    │ │ Hub         │               │
│  │ (Rules DSL) │ │ (Python)    │ │ (Connectors)│               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Event Bus (NATS JetStream)
┌─────────────────────────▼───────────────────────────────────────┐
│                      DATA LAYER                                 │
│  PostgreSQL 16 (transactional, row-level security)             │
│  TimescaleDB (serie temporali visite, KPI, metriche)           │
│  MinIO/S3 (documenti, referti, firme, audio)                   │
│  Elasticsearch 8 (full-text search, audit log)                 │
│  pgvector (RAG su normative, protocolli, knowledge base)       │
│  Redis 7 (cache, sessioni, rate limiting, code)                │
└─────────────────────────────────────────────────────────────────┘
```

### Scelte Architetturali Chiave
| Scelta | Rationale |
|--------|-----------|
| **PostgreSQL + pgvector** | ACID + vector search per RAG normative (no vendor lock-in Pinecone) |
| **FHIR R4 + IT Profiles** | Interoperabilità nativa FSE, PagoPA, SDI, standard internazionale |
| **CEL (Common Expression Language)** | Rules engine: protocolli come codice, versionabili, testabili, sandboxed |
| **NATS JetStream** | Event sourcing, audit trail immutabile, replay per compliance |
| **Offline-first (RxDB/PouchDB)** | Mobile funziona in cantiera senza segnale, sync automatico |
| **Keycloak + SPID/CIE** | Auth enterprise-ready, delega a identity provider italiani |

---

## 🗓️ Roadmap Dettagliata (6 Mesi MVP + 6 Mesi Scale)

### FASE 0: Foundation (Settimane 1-2) ✅ *Pre-requisiti*

| Task | Owner | Output | Done Criteria |
|------|-------|--------|---------------|
| Setup repo monorepo (Nx/Turborepo) | Tech Lead | `apps/web`, `apps/mobile`, `packages/*` | Build passa, CI/CD GitHub Actions |
| Infrastructure as Code (Terraform) | DevOps | AWS/GCP: VPC, RDS, EKS/GKE, MinIO, Redis, ES | `terraform apply` verde, monitoring attivo |
| Keycloak + SPID/CIE config | Backend | Realm configurato, mappatura attributi | Login SPID test funzionante |
| Database schema v1 (Prisma/Drizzle) | Backend | Migration iniziali: tenant, user, company, worker, protocol, visit | `prisma migrate deploy` ok, seed data |
| Design System (Storybook + Tailwind) | Frontend | Componenti base: Button, Input, Table, Modal, Wizard, Calendar | Storybook pubblicato, a11y AA |
| CI/CD Pipeline | DevOps | Lint, typecheck, test, build, deploy staging/prod | Deploy automatico su merge main |

---

### FASE 1: Core Domain + UX (Settimane 3-8) 🎯 *MVP Core*

#### Sprint 1-2 (Settimane 3-4): Anagrafiche + Tenant + Auth
| Task | Dettaglio | Acceptance Criteria |
|------|-----------|---------------------|
| Multi-tenant architecture | Row-level security PostgreSQL, tenant isolation | Zero data leakage cross-tenant (test automatizzato) |
| Aziende (Clienti) | CRUD completo: P.IVA, CF, ATECO, sedi multiple, Datore Lavoro, RSPP, RLS | Import CSV/Excel da HR (Zucchetti, TeamSystem) |
| Lavoratori | Anagrafica completa: mansione, livello rischio, data assunzione, fattori rischio, consenso GDPR | Sync bidirezionale HR → MedWork (webhook + polling) |
| Medici Competenti | Albo, specializzazione, assegnazione aziende, firma digitale | Profilo completo con certificato firma |
| Ruoli/Permessi | RBAC granulare: Admin, Medico, Segreteria, Azienda (read-only), Lavoratore (read-only) | Matrix permessi documentata + testata |

#### Sprint 3-4 (Settimane 5-6): Cartella Sanitaria 3A + Giudizi + Firma
| Task | Dettaglio | Acceptance Criteria |
|------|-----------|---------------------|
| Cartella Sanitaria Digitale (Allegato 3A) | Sezioni: Anamnesi, Rischi, Accertamenti, Esame Obiettivo, Conclusioni | Compilazione guidata wizard ≤ 5 min; autosave ogni 30s |
| Frase-tipo / Checklist | Library frasi predefinite per anamnesi/esami (modificabili) | ≥ 100 frasi-tipo seed; ricerca fuzzy; preferiti per medico |
| Questionari Integrati | DMS, Audit C, NIOSH, custom per rischio | Scoring automatico; flag anomalie |
| Giudizio Idoneità | Idoneo / Parzialmente idoneo / Non idoneo / In attesa accertamenti | Prescrizioni/limitazioni strutturate; scadenza automatica |
| Firma Grafometrica | Tablet/tablet pen: cattura biometrica (pressione, velocità, tempo) | Conforme DPR 445/2000; verifica integrità PDF firmato |
| Export PDF/Word/Excel/HTML | Template personalizzabili per referto, giudizio, cartella | Output identico a modelli cartacei attuali |

#### Sprint 5-6 (Settimane 7-8): Scadenziario + Allegato 3B + Notifiche
| Task | Dettaglio | Acceptance Criteria |
|------|-----------|---------------------|
| Scadenziario Intelligente | Visite preventive, periodiche, su richiesta, rientro; DVR, sopralluoghi, riunioni art.35 | Calcolo automatico periodicità per mansione/rischio/età |
| Alert Multi-canale | Email, PEC, SMS, Push (mobile), In-app | Template personalizzabili; log consegna; retry automatico |
| Allegato 3B INAIL | Generazione automatica XML conforme standard INAIL 2024 | Validazione XSD pre-invio; invio telematico diretto portale INAIL |
| Relazione Annuale (Art. 40) | Elaborazione statistica automatica + editor Word per note medico | Generazione ≤ 2 min per azienda 500+ dipendenti |
| Dashboard Medico | "Prossime 7 giorni", "Scaduti", "Da firmare", "Anomalie protocolli" | Real-time; filtri per azienda/stabilimento/mese |

---

### FASE 2: AI Assistant + Mobile (Settimane 9-14) 🤖 *Differenziazione*

#### Sprint 7-8 (Settimane 9-10): AI Charting Pipeline
| Task | Dettaglio | Acceptance Criteria |
|------|-----------|---------------------|
| Speech-to-Text Medical | Whisper large-v3 fine-tuned su terminologia medicina lavoro (IT) | WER < 15% su vocabolario tecnico; latency < 2s |
| NLP Structuring | Estrazione entità: sintomi, esami, diagnosi, farmaci, giudizi → campi cartella | F1 > 0.85 su dataset annotato (100+ visite reali) |
| OCR Referti Esterni | Tesseract + layout analysis (PDF/Image → strutturato) | Estrazione corretta > 90% campi chiave (spirometria, audiometria, emocromo) |
| Suggerimento Giudizio | ML classifier (XGBoost/TabPFN) su features: rischi, esami, anamnesi, storico | Accuratezza > 85% vs giudizio medico; explainability SHAP |
| Human-in-the-loop UI | Medico vede suggerimenti come "bozze" → accetta/modifica/rifiuta | Zero imposizione; tracciabilità decisioni AI per audit |

#### Sprint 9-10 (Settimane 11-12): Mobile App Offline-First
| Task | Dettaglio | Acceptance Criteria |
|------|-----------|---------------------|
| Architettura Offline-First | RxDB (PouchDB/CouchDB protocol) + sync automatico al ripristino connessione | Funziona 100% offline; conflitti risolti last-write-wins + manual review |
| Visita Mobile Wizard | Flusso guidato: anamnesi → esami → giudizio → firma → foto referti | Completabile in ≤ 5 min; auto-save locale ogni 10s |
| Firma Grafometrica Tablet | Cattura biometrica su iPad/Android tablet (Apple Pencil / S-Pen) | Conforme normativa; PDF firmato verificabile |
| Foto/OCR Referti | Camera → OCR locale (ML Kit / CoreML) → pre-compilazione campi | Funziona offline; sync referti originali su cloud |
| Calendar/Visite Offline | Calendario visite sincronizzato; navigazione GPS per sedi aziende | Mappe offline (MapLibre + MBTiles); route planning |

#### Sprint 11-12 (Settimane 13-14): Predictive Scheduling + Insight
| Task | Dettaglio | Acceptance Criteria |
|------|-----------|---------------------|
| No-Show Prediction | Modello ML su storici: meteo, distanza, storico lavoratore, giorno settimana | AUC > 0.8; suggerisce overbooking intelligente |
| Slot Optimization | OR-Tools per raggruppare visite per area geografica/azienda | Riduzione km/visita > 20% |
| Anomaly Detection Protocolli | "Azienda X: 40% idoneità parziale rischio chimico → rivedi protocollo" | Alert generati automaticamente; false positive < 15% |
| Benchmark Anonimo | Confronto KPI vs peer (anonimizzato): tempo visita, % idoneità, scadenzario | Opt-in; GDPR-compliant; insight azionabili |

---

### FASE 3: Integrazioni + Compliance Engine (Settimane 15-22) 🔗 *Ecosistema*

#### Sprint 13-14 (Settimane 15-16): Integration Hub
| Connettore | Specifica | Priorità |
|------------|-----------|----------|
| **HR: Zucchetti** | REST API + webhook dipendenti (assunzione/variazione/cessazione) | P0 |
| **HR: TeamSystem** | SOAP/REST + CSV export schedulato | P0 |
| **HR: Sage/Argos** | API REST + file SFTP | P1 |
| **HR: Arca Evolution** | API REST | P1 |
| **PEC** | Librerie AgID (Aruba/InfoCert/Poste) invio/ricezione certificata | P0 |
| **SDI Fatturazione** | Generazione XML FatturaPA/Privati + invio SDI + ricezione notifiche | P0 |
| **PagoPA** | Pagamenti fatture da portale aziende/lavoratori | P1 |
| **SPID/CIE** | Accesso portale lavoratori/aziende via identity provider | P0 |
| **FSE Regionale** | FHIR IT push/pull referti (dove attivo) | P2 |
| **Commercialisti** | Export XML/CSV standard (Datev, TeamSystem, Zucchetti) | P0 |

#### Sprint 15-16 (Settimane 17-18): Protocol Designer + Rules Engine
| Task | Dettaglio | Acceptance Criteria |
|------|-----------|---------------------|
| Visual Protocol Designer | Drag-drop nodi: Anamnesi → Questionari → Esami → Giudizio → Prescrizioni | UI tipo n8n/Node-RED; salvataggio versionato |
| Rules DSL (CEL) | Espressioni: `risk == "chimico" && mansione == "saldatore" -> requires(spirometria, 12m)` | Sintassi validata; sandboxed; testabile unitariamente |
| Real-time Compliance Check | Validazione protocollo vs regole normative codificate (D.Lgs. 81/08, Allegati, Circolari) | Errori/warning inline durante design; zero falsi negativi su casi noti |
| Normative Knowledge Base | Vettorizzazione (pgvector) norme, circolari, FAQ, best practice | RAG: query medico → risposta citata + link fonte ufficiale |
| Marketplace Protocolli | Template per ATECO/mansione creati da esperti, versionati, rated | Import 1-click + fork + personalizzazione; changelog versioni |

#### Sprint 17-18 (Settimane 19-20): Compliance Monitor + Audit
| Task | Dettaglio | Acceptance Criteria |
|------|-----------|---------------------|
| Automated Compliance Scan | Job notturno: verifica tutti i protocolli attivi vs regole aggiornate | Report giornaliero: protocolli non conformi, scadenze normative |
| Regulatory Changelog Engine | Parsing automatico GU, circolari MinLavoro, INAIL → aggiornamento regole | Lag < 48h da pubblicazione; changelog notificato a medici interessati |
| Audit Trail Immutabile | Event sourcing su NATS: ogni azione (CRUD, firma, invio, accesso) loggata | Queryable; esportabile per ispezioni; retention 10 anni |
| DPIA Assistant | Guida compilazione DPIA per nuovo trattamento; template precompilati | Output PDF pronto per DPO; mapping GDPR art. 35 |
| Consent Management | Granulare per lavoratore: quali dati, per quali finalità, revoca | Log consenso/rinuncia; export DSAR (GDPR art. 15) 1-click |

#### Sprint 19-20 (Settimane 21-22): Portale Aziende + Portale Lavoratori
| Task | Dettaglio | Acceptance Criteria |
|------|-----------|---------------------|
| Portale Aziende (Collaborativo) | DVR upload → estrazione rischi automatica → proposta protocollo → validazione medico → scadenze visibili | Azienda vede stato reale tempo reale; zero email per scadenze |
| Portale Lavoratori (SPID/CIE) | Accesso propria cartella (consenso), giudizi, scadenze visite, referti | GDPR art. 15/20; download referti; notifiche push app |
| Fatturazione Integrata | Fatture per visita/azienda/abbonamento → SDI → riconciliazione incassi → solleciti | Zero inserimento manuale; export commercialista automatico |
| KPI Dashboard Azienda | Tasso idoneità, visite scadute, costi sorveglianza, trend annui | White-label per medico; export PDF/PowerPoint |

---

### FASE 4: Scale & Enterprise (Mesi 7-12) 📈 *Post-MVP*

| Epic | Descrizione | Trigger |
|------|-------------|---------|
| **Multi-Studio Workspace** | Condivisione cartelle (consenso), handoff visite, fatturazione centralizzata, reportistica aggregata rete | ≥ 3 studi pilota |
| **Advanced AI** | Fine-tuning LLM su knowledge base medicina lavoro; chat assistant "Chiedi al protocollo" | Dataset > 10k visite annotate |
| **Business Intelligence** | Cube OLAP (Apache Druid/ClickHouse) per analisi multidimensionali | > 100k visite/mese |
| **White-label / OEM** | Rebranding completo per associazioni di categoria / software house partner | Request da partner |
| **Internationalizzazione** | Modello dati esteso per normative EU (Direttiva 89/391, GDPR), lingue EN/FR/ES/DE | Espansione mercato |
| **Marketplace Esteso** | Plugin di terze parti (es. telemedicina, Prenotazione CUP, Wearables) | Ecosistema maturo |

---

## 👥 Team & Ruoli (MVP 6 Mesi)

| Ruolo | FTE | Seniority | Focus Primario |
|-------|-----|-----------|----------------|
| **Tech Lead / Architect** | 1.0 | Senior+ | Architettura, code review, decisioni tecniche |
| **Backend Engineer** | 2.0 | Mid/Senior | Core services, API, DB, integrazioni, rules engine |
| **Frontend Engineer (Web)** | 1.5 | Mid/Senior | Dashboard, portali, protocol designer, design system |
| **Mobile Engineer (React Native)** | 1.0 | Mid | App offline-first, firma grafometrica, OCR, sync |
| **AI/ML Engineer** | 1.0 | Mid/Senior | Pipeline AI (STT, NLP, OCR, ML scheduling, RAG) |
| **DevOps / Platform** | 0.5 | Senior | IaC, CI/CD, monitoring, security, scaling |
| **Product Designer (UX/UI)** | 0.5 | Senior | User research, prototipazione, usability testing, design system |
| **Domain Expert (Medico Competente)** | 0.3 | Expert | Validazione flussi, protocolli, compliance, test accettazione |
| **QA / Test Automation** | 0.5 | Mid | E2E testing (Playwright), contract testing, performance |

**Budget stimato team (6 mesi)**: ~€350-450k (costi fully loaded Italia)

---

## 💰 Business Model & Pricing

### Freemium → Usage-Based
| Tier | Target | Prezzo | Include |
|------|--------|--------|---------|
| **Free** | Medico singolo < 50 visite/mese | €0/mese | Cartella 3A, scadenziario, giudizi, firma, export 3B XML, 1 azienda |
| **Pro** | Medico singolo > 50 visite/mese | €199/mese | Free + AI charting (100/min mese), mobile offline, integrazioni HR base, 5 aziende |
| **Team** | Studio associato 2-10 medici | €149/medico/mese | Pro + workspace collaborativo, portale aziende, fatturazione, SSO, API |
| **Enterprise** | Reti, cliniche, >10 medici | Custom | Team + SLA, on-premise option, white-label, dedicated support, custom integrations |

### Revenue Projection (Conservativo)
| Mese | Utenti Free | Utenti Pro | Team (medici) | MRR |
|------|-------------|------------|---------------|-----|
| 6 | 50 | 10 | 1 studio (4 medici) | €2.5k |
| 12 | 200 | 50 | 5 studi (25 medici) | €15k |
| 24 | 500 | 150 | 15 studi (80 medici) | €55k |
| 36 | 1000 | 300 | 30 studi (180 medici) | €130k |

---

## 📋 Definition of Done (Per Ogni Sprint)

| Criterio | Standard |
|----------|----------|
| **Code Quality** | TypeScript strict, ESLint/Prettier, 0 warning; SonarCloud quality gate |
| **Testing** | Unit ≥ 80% coverage; Integration per API critiche; E2E per flussi core (Playwright) |
| **Security** | SAST/DAST in CI; dependency scanning; pen test trimestrale; OWASP Top 10 covered |
| **Performance** | API p95 < 200ms; Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms |
| **Accessibility** | WCAG 2.1 AA; test screen reader; navigazione tastiera completa |
| **Documentation** | OpenAPI/Swagger aggiornato; ADR per decisioni architetturali; runbook operativi |
| **Deploy** | Zero-downtime; rollback < 2 min; feature flags per rilasci rischiosi |
| **Observability** | Log strutturati (JSON); metriche Prometheus/Grafana; alert PagerDuty; distributed tracing |

---

## 🚨 Rischi & Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| **Adozione medici (resistenza cambiamento)** | Alta | Alto | UX testing continuo; medico nel team; onboarding guidato; import dati da competitor |
| **Compliance normativa incompleta** | Media | Critico | Domain expert 0.3 FTE; compliance engine testato su casi reali; legal review trimestrale |
| **Integrazioni HR instabili (API non documentate)** | Alta | Medio | Connettori modulari; fallback CSV/SFTP; partnership con vendor HR |
| **Performance mobile offline (db locale grande)** | Media | Medio | RxDB compaction; purge dati vecchi; sync incrementale; test su device low-end |
| **Costi AI/ML (inference, storage, training)** | Media | Medio | Modelli quantizzati (GGUF/ONNX); caching aggressivo; budget monitoring; fallback rule-based |
| **Concorrenza da player consolidati (Winasped/81ML)** | Alta | Medio | Focus su UX/AI/Integrazioni dove loro sono deboli; speed of iteration; community building |
| **Scalabilità multi-tenant (noisy neighbor)** | Bassa | Alto | RLS PostgreSQL; resource quotas per tenant; monitoring per-tenant; chaos engineering |

---

## ✅ Prossimi Passi Immediati (Settimana 1-2)

1. **Validazione Problema** (giorni 1-5)
   - [ ] 5 interviste medici competenti (script preparato)
   - [ ] 3 interviste segretarie/studi associati
   - [ ] Sintesi pain point + willingness to pay

2. **Prototipo Cliccabile** (giorni 3-10)
   - [ ] Figma: Protocol Designer + Visita Mobile Wizard + Dashboard
   - [ ] Test usabilità con 3 medici (task: "crea protocollo saldatore", "fai visita offline")
   - [ ] Iterazione basata su feedback

3. **Proof of Concept Tecnico** (giorni 8-14)
   - [ ] Rules Engine (CEL): protocollo saldatore → genera scadenze
   - [ ] Generazione XML Allegato 3B valido (test XSD INAIL)
   - [ ] Firma grafometrica su iPad → PDF verificabile
   - [ ] Sync offline RxDB → PostgreSQL

4. **Lettere d'Intenti** (giorni 10-14)
   - [ ] 2-3 studi associati per pilot gratuito 6 mesi
   - [ ] Impegno: feedback settimanale + case study finale

5. **Setup Team & Legal** (giorni 1-14)
   - [ ] Contratti collaboratori/assunzioni
   - [ ] Statuto/atto costitutivo SRL (se non esistente)
   - [ ] Privacy policy, DPA, Terms of Service (legal review)
   - [ ] Marchio "MedWork Manager" depositato

---

## 📁 Struttura Repository (Monorepo Nx)

```
medwork-manager/
├── apps/
│   ├── web/                    # Next.js 14 (App Router)
│   │   ├── src/
│   │   │   ├── app/            # Route groups: (auth), (dashboard), (portal-azienda), (portal-lavoratore)
│   │   │   ├── components/     # UI components (shared + feature-specific)
│   │   │   ├── features/       # Feature modules (protocol-designer, visit-wizard, etc.)
│   │   │   ├── lib/            # Utilities, hooks, Apollo client, auth
│   │   │   └── styles/         # Tailwind, globals
│   │   └── ...
│   ├── mobile/                 # React Native + Expo
│   │   ├── src/
│   │   │   ├── app/            # Expo Router
│   │   │   ├── components/
│   │   │   ├── features/       # visit-offline, signature, ocr, calendar
│   │   │   ├── lib/            # RxDB, sync, native modules
│   │   │   └── natives/        # Native modules (firma grafometrica, OCR, camera)
│   │   └── ...
│   └── docs/                   # Storybook, documentazione tecnica
├── packages/
│   ├── shared/                 # Types, constants, validation schemas (Zod), utilities
│   ├── ui/                     # Design system components (React + React Native via Tamagui/NativeWind)
│   ├── api-client/             # Generated GraphQL/tRPC client + hooks
│   ├── rules-engine/           # CEL parser, validator, executor (shared web/mobile)
│   ├── fhir/                   # FHIR R4 IT profiles, mappers, validators
│   ├── integrations/           # HR connectors, PEC, SDI, PagoPA, SPID clients
│   ├── ai/                     # Shared types, prompts, prompt templates for AI pipeline
│   └── compliance/             # Normative rules DSL, knowledge base, changelog parser
├── services/                   # Backend microservices (separati per deploy indipendente)
│   ├── api-gateway/            # Kong/Traefik config + plugins
│   ├── auth-service/           # Keycloak admin API wrapper, token management
│   ├── protocol-service/       # Protocol CRUD, versioning, validation, marketplace
│   ├── visit-service/          # Visit scheduling, execution, offline sync endpoint
│   ├── document-service/       # PDF generation, FHIR/CDA, XML 3B, firma
│   ├── compliance-service/     # Rules evaluation, regulatory changelog, audit
│   ├── integration-hub/        # Connectors, webhooks, sync jobs
│   ├── ai-service/             # STT, NLP, OCR, ML scheduling, RAG pipeline
│   └── notification-service/   # Email, PEC, SMS, Push, In-app
├── infrastructure/
│   ├── terraform/              # AWS/GCP modules
│   ├── kubernetes/             # Helm charts / Kustomize
│   ├── monitoring/             # Grafana dashboards, Prometheus rules, Loki
│   └── security/               # Policies, secrets management (Vault/SealedSecrets)
├── tools/
│   ├── cli/                    # CLI interno (migrazioni, seed, admin tasks)
│   ├── scripts/                # Utility scripts
│   └── e2e-tests/              # Playwright tests cross-app
└── docs/
    ├── adr/                    # Architecture Decision Records
    ├── api/                    # OpenAPI specs
    ├── runbooks/               # Operational procedures
    └── user-guides/            # Guide medico, azienda, lavoratore
```

---

## 🔑 Milestone Chiave (Go/No-Go)

| Milestone | Data Target | Criteri Go | Azione No-Go |
|-----------|-------------|------------|--------------|
| **M0: Problem Validated** | Settimana 2 | ≥ 3 medici confermano pain point + LOI firmate | Pivot o stop |
| **M1: Core Usabile (Alpha)** | Settimana 8 | Medico completa visita in ≤ 8 min; 0 bug critici; 3 medici testano daily | Estendi Fase 1 |
| **M2: AI Value Demonstrato** | Settimana 14 | AI pre-compila ≥ 60% campi; suggerimento giudizio accettato ≥ 70%; mobile offline funziona | Riduci scope AI; focus core |
| **M3: Pilot Production Ready** | Settimana 22 | 2 studi in produzione reale; fatturazione automatica; zero data loss; NPS ≥ 40 | Fix blocking issues; delay launch |
| **M4: Product-Market Fit** | Mese 9 | MRR ≥ €15k; churn < 5%/mese; CAC < 3x LTV; ≥ 10 medici paying | Rivedi pricing/posizionamento |

---

## 📚 Riferimenti Normativi (Knowledge Base Iniziale)

| Fonte | Documento | Utilizzo nel Sistema |
|-------|-----------|----------------------|
| **D.Lgs. 81/2008** | Testo Unico Sicurezza | Regole base: art. 25 (cartella), 37 (formazione), 40 (relazione), 41 (visite) |
| **Allegato 3A** | Cartella Sanitaria e di Rischio | Struttura dati cartella; campi obbligatori/opzionali |
| **Allegato 3B** | Dati aggregati INAIL | Schema XML generazione; validazione XSD |
| **DM 9 Luglio 2012** | Definizione Allegati 3A/3B | Mapping campi preciso; codifiche INAIL |
| **DPR 306/56** | Sorveglianza sanitaria (storico) | Riferimento per casi pre-2008 |
| **D.Lgs. 101/2020** | Radioprotezione | Protocollo lavoratori esposti radiazioni ionizzanti |
| **GDPR (UE 2016/679) + D.Lgs. 196/2003** | Privacy dati sanitari | Consent management; DPIA; DSAR; Art. 9 categorie speciali |
| **DPR 445/2000** | Firma digitale/grafometrica | Requisiti firma biometrica; validazione |
| **Circolari MinLavoro/INAIL** | Interpretazioni applicative | Knowledge base RAG; aggiornamenti compliance engine |
| **Standard INAIL 3B XML** | Specifiche tecniche invio telematico | Validazione pre-invio; mapping campi |

---

## 🎯 Metriche di Successo (North Star + Guardrail)

| Metrica | Target M6 | Target M12 | Frequenza Misurazione |
|---------|-----------|------------|----------------------|
| **North Star: Visite Completate / Medico Attivo / Mese** | 80 | 120 | Settimanale |
| **Time-to-Value (primo valore per nuovo medico)** | < 2 ore | < 1 ora | Per coorte |
| **AI Adoption Rate** (% visite con ≥1 campo AI) | 40% | 70% | Settimanale |
| **Mobile Offline Usage** (% visite su mobile) | 30% | 60% | Settimanale |
| **Net Promoter Score (medici)** | 40 | 55 | Mensile |
| **Revenue Churn (MRR)** | < 5% | < 3% | Mensile |
| **API Uptime** | 99.9% | 99.95% | Continuo |
| **Compliance Scan Pass Rate** | 100% | 100% | Giornaliero |

---

## 📝 Note per Esecuzione

> **Principio guida per ogni decisione**: *"Rende il medico più veloce E più sicuro (compliance)?"* Se la risposta non è **sì a entrambi**, non si fa.

> **Ordine di priorità costante**: Compliance & Data Integrity > UX & Speed > AI & Automation > Integrations > Nice-to-have

> **Communication Rhythm**:
> - Daily standup (15 min) - team tecnico
> - Weekly demo (30 min) - tutto il team + domain expert
> - Bi-weekly retrospective (1h) - miglioramento processo
> - Monthly business review (1h) - metriche, risk, budget, strategy

---

*Documento vivo - Aggiornato ad ogni sprint review. Versione 1.0 - Gennaio 2026*