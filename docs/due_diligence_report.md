# 🔬 MedWork Manager — Technical Due Diligence Report
**Principal Software Architect × Product Strategist × Occupational Health Expert**
*Versione 1.0 — Agosto 2026*

---

## Executive Summary

MedWork Manager è un software di **medicina del lavoro** (Sorveglianza Sanitaria) costruito con una visione ambiziosa e una roadmap dettagliata, ma si trova attualmente in una **fase alpha molto precoce**. La distanza tra il piano strategico documentato e il codice effettivamente implementato è enorme. Il prodotto ha basi tecniche solide su cui costruire, alcune scelte architetturali corrette, e un product plan eccellente — ma presenta vulnerabilità di sicurezza critiche, strati interi di funzionalità completamente stubbed, e nessuna differenziazione AI o mobile ancora implementata.

**Verdetto da investor**: Non è ancora investibile as-is. Il codice vale come proof-of-concept avanzato, non come MVP production-ready. Il piano però è tra i più sofisticati visti nel mercato italiano della medicina del lavoro.

---

## 1. Repository Analysis

### Technology Stack

| Layer | Tecnologia Scelta | Versione |
|---|---|---|
| **Backend** | ASP.NET Core (C#) | .NET 10 |
| **ORM** | Entity Framework Core | 10.x |
| **Database** | SQL Server (dichiarato; in-memory per i test) | — |
| **Auth** | JWT Bearer (custom) + OAuth stub (SPID/CIE/Keycloak) | — |
| **Frontend** | React + Vite + Material UI (MUI) | React 19, MUI 7 |
| **PDF Generation** | jsPDF + jsPDF-autotable (client-side!) | 4.x |
| **Testing (BE)** | xUnit + WebApplicationFactory | — |
| **Testing (FE)** | Vitest + Testing Library + Playwright | — |
| **Containerization** | Docker (Dockerfile presente per entrambi i layer) | — |
| **Password Hashing** | BCrypt.Net | 4.x |
| **Excel** | EPPlus | 4.5.x (licenza non-commerciale!) |

> [!WARNING]
> Il piano strategico descrive uno stack completamente diverso: **Next.js 14, React Native, PostgreSQL, TimescaleDB, MinIO, Elasticsearch, pgvector, Redis, NATS JetStream, Keycloak, Kong/Traefik**. Il codice esistente è built su **ASP.NET Core + SQL Server + React Vite + MUI**. Questo è un disallineamento fondamentale tra visione e implementazione.

### Architecture Overview

```mermaid
graph TB
    subgraph Frontend ["Frontend (Vite + React + MUI)"]
        A[App.tsx - Monolith SPA]
        B[28 componenti JSX/TSX]
    end

    subgraph Backend ["Backend (ASP.NET Core .NET 10)"]
        subgraph Controllers
            C[AdminCrudController]
            D[AuthController]
            E[MedicalVisitsController]
            F[DoctorCrudController]
            G[MasterDataController]
            H[... +12 altri]
        end
        subgraph Services
            I[TenantService / UserService / RoleService]
            J[JwtTokenService]
            K[DocumentGenerationService ⚠️ STUB]
            L[AIChartingService ⚠️ STUB]
            M[AlertMultiChannelService]
        end
        subgraph Compliance
            N[ComplianceRuleEngine]
            O[DpiaAssistant ⚠️ STUB]
            P[ConsentManager ⚠️ STUB]
        end
        subgraph Analytics
            Q[NoShowPredictionService ⚠️ rule-based]
            R[SlotOptimizationService ⚠️ STUB]
        end
        subgraph Data
            S[AppDbContext + EF Core]
            T[AppDbSeeder]
        end
    end

    subgraph Database ["SQL Server"]
        U[(MedWorkDb)]
    end

    Frontend -->|HTTP REST JSON / JWT| Backend
    Backend --> Database
```

**Architettura reale**: Monolite REST (non microservizi). Singolo progetto ASP.NET Core con tutti i layer. Non ci sono microservizi, event bus, API gateway, o cache layer nonostante il piano li preveda.

### Modules and Responsibilities

| Modulo | Responsabilità | Stato |
|---|---|---|
| `Controllers/AdminCrudController` | CRUD per Companies, Branches, Employees, Protocols, etc. | ✅ Implementato |
| `Controllers/AuthController` | Login JWT + stub SPID/CIE/Keycloak | ⚠️ Parziale |
| `Controllers/DoctorCrudController` | CRUD Medici, visite, disponibilità | ✅ Implementato |
| `Controllers/MedicalVisitsController` | Visite mediche base | ⚠️ Parziale |
| `Controllers/MedicalRecordController` | Cartella Sanitaria 3A | ⚠️ Route v2, parziale |
| `Controllers/VisitJudgmentController` | Giudizi di idoneità | ⚠️ Parziale |
| `Controllers/SignatureController` | Firma grafometrica | ⚠️ RSA SHA-256 stub |
| `Controllers/DocumentsController` | Allegato 3B INAIL | ⚠️ XML stub non conforme INAIL |
| `Controllers/AlertsController` | Notifiche multi-canale | ⚠️ Solo console output |
| `Controllers/ComplianceController` | Compliance engine | ✅ 5 regole hardcoded |
| `Controllers/AnalyticsController` | KPI, predizioni | ⚠️ Rule-based, no ML reale |
| `Controllers/IntegrationController` | HR import/export | ⚠️ CSV/Excel solo |
| `Compliance/ComplianceRuleEngine` | Regole D.Lgs. 81/08 | ⚠️ Solo 5 regole base |
| `Services/AIChartingService` | AI charting, OCR, STT | ❌ Solo TODO placeholders |
| `Services/DocumentGenerationService` | PDF/CDA/FHIR | ❌ Solo STUB strings |

### Database Structure

Il database è ben strutturato con **32 entità** in EF Core. Schema logico:

```mermaid
erDiagram
    Tenant ||--o{ User : "has"
    Tenant ||--o{ Company : "owns"
    Tenant ||--o{ Role : "has"
    Company ||--o{ Branch : "has"
    Company ||--o{ Employee : "employs"
    Company ||--o{ CompanyDoctor : "assigns"
    Company ||--o{ Department : "has"
    Employee ||--|| MedicalRecord : "has one"
    Employee ||--o{ MedicalVisit : "undergoes"
    Employee ||--o{ EmployeeRisk : "exposed to"
    Employee ||--o{ PersonalProtocol : "follows"
    Employee ||--o{ ScheduledExam : "scheduled for"
    Employee ||--o{ Vaccination : "receives"
    MedicalVisit ||--|| Anamnesis : "includes"
    MedicalVisit ||--o{ VisitExam : "contains"
    Protocol ||--o{ ProtocolStep : "composed of"
    Protocol ||--o{ PersonalProtocol : "assigned via"
    JobRole ||--o{ JobRoleRiskFactor : "exposes to"
    RiskFactor ||--o{ JobRoleRiskFactor : "assigned via"
    Doctor ||--o{ DoctorAvailability : "available"
    Doctor ||--o{ MedicalVisit : "conducts"
```

**Punti di forza**: multi-tenant, encryption at rest per dati sensibili, indici corretti, FK ben configurate.
**Lacune**: no Row-Level Security (RLS) nativa DB, no audit trail tabelle, no versioning entità, no soft-delete coerente.

### API Design

- **Stile**: REST (non GraphQL come da piano)
- **Autenticazione**: JWT Bearer
- **Documentazione**: Swagger/OpenAPI (solo in Development)
- **Versioning**: nessuno (esiste `api/medical-records-v2` come hack, non come strategia)
- **Contratti**: DTOs mancanti in molti endpoint — i controller accettano e restituiscono direttamente le entità EF (anti-pattern grave)
- **Paginazione**: assente
- **Rate limiting**: assente
- **HATEOAS**: assente

### Authentication and Authorization

```mermaid
flowchart LR
    A[Client] -->|POST /api/auth/login| B[AuthController]
    B -->|1. TenantSlug lookup| C[TenantService]
    B -->|2. User lookup + BCrypt verify| D[UserService]
    B -->|3. Generate JWT| E[JwtTokenService]
    E -->|token: claims=userId,email,roles,permissions,tenantId| A
    A -->|Bearer token| F[TenantContextFilter]
    F -->|Injects TenantId to all request entities| G[Controllers]
```

**Auth stack**: custom JWT + BCrypt. SPID/CIE/Keycloak endpoint esistono ma sono simulati (chiamano servizi esterni che a loro volta ritornano stub data).

**RBAC**: Implementato con `Role → RolePermission → Permission` + override diretti `UserPermission`. Ben strutturato concettualmente.

### Deployment Architecture

- Dockerfiles presenti per entrambi i layer (backend + frontend Nginx)
- **Nessuna** infrastruttura cloud, IaC, o orchestrazione (no Kubernetes, no Terraform)
- Il frontend usa Nginx per servire la SPA con `nginx.conf` personalizzato
- `global.json` fissa SDK .NET 10

### Third-Party Integrations

| Integrazione | Piano | Realtà |
|---|---|---|
| SPID/CIE | Autenticazione completa | Stub HTTP client |
| Keycloak | OIDC enterprise | Stub HTTP client |
| PEC | Certificazione email | Interfaccia `INotificationTransport` → Console |
| SDI/Fatturazione PA | Fattura elettronica | Non implementato |
| HR (Zucchetti, TeamSystem) | Sync bidirezionale | CSV/Excel import/export via EPPlus |
| INAIL Allegato 3B | Invio telematico ufficiale | XML stub non conforme specifica INAIL reale |
| AI/ML | STT, NLP, OCR | Placeholder TODO |
| PagoPA | Pagamenti | Non implementato |
| FSE Regionale | FHIR push/pull | Non implementato |

---

## 2. Code Quality Assessment

### 🔴 CRITICAL Issues

#### C1 — Hardcoded Master Password Bypass
**File**: [`TenantService.cs`](file:///c:/github/medwork-manager/MedWork.Api/Services/TenantService.cs#L165-L166)
```csharp
if (password == "Admin123!")
    return true;  // bypassa BCrypt per chiunque!
```
**Perché è un problema**: Qualsiasi utente può accedere con `Admin123!` indipendentemente dalla sua password reale. È una backdoor universale hardcoded in produzione.
**Severità**: **CRITICAL** — violazione GDPR art. 32, rischio di data breach completo.
**Fix**: Rimuovere immediatamente. Usare solo BCrypt.Verify. Aggiungere test che verifichi che questa logica non esista.

#### C2 — Credenziali in chiaro in appsettings.json
**File**: [`appsettings.json`](file:///c:/github/medwork-manager/MedWork.Api/appsettings.json)
```json
"Password": "Admin123!",
"SecretKey": "CHANGE_THIS_WITH_A_LONG_RANDOM_SECRET_KEY_64_CHARS_MINIMUM"
```
**Perché è un problema**: Credenziali hardcoded in file di configurazione checckato su git. JWT secret key non sostituita (il commento "CHANGE_THIS" è presente anche in production settings, non solo development).
**Severità**: **CRITICAL** — il JWT può essere forgiato da chiunque abbia accesso al repository.
**Fix**: Usare Azure Key Vault / AWS Secrets Manager / .NET User Secrets. Mai credentials in appsettings committed.

#### C3 — TenantId fallback sempre = 1
**File**: [`TenantContextFilter.cs`](file:///c:/github/medwork-manager/MedWork.Api/Security/TenantContextFilter.cs#L24-L25)
```csharp
tenantId = 1; // Safe fallback for test/seed principals lacking the claim.
```
**Perché è un problema**: Qualsiasi richiesta anonima o con token malformato accede ai dati del tenant 1 (il primo). In un sistema multi-tenant sanitario, questo significa cross-tenant data leakage per qualsiasi errore di autenticazione.
**Severità**: **CRITICAL** — violazione dell'isolamento multi-tenant, GDPR art. 5.
**Fix**: Restituire 401/403 se il tenantId non è presente o non è valido. Mai fallback a un tenant reale.

#### C4 — AlertMultiChannelService: TenantId hardcoded = 1
**File**: [`AlertMultiChannelService.cs`](file:///c:/github/medwork-manager/MedWork.Api/Services/AlertMultiChannelService.cs#L38)
```csharp
TenantId = 1, // hardcoded!
```
**Perché è un problema**: Tutte le notifiche vengono registrate con TenantId=1, non con il tenant reale del chiamante. Cross-tenant data pollution.
**Severità**: **CRITICAL** — corruzione dati multi-tenant.
**Fix**: Iniettare il TenantId dalla richiesta corrente (via IHttpContextAccessor o parametro esplicito).

---

### 🟠 HIGH Issues

#### H1 — DTOs assenti: le entità EF escono direttamente dalle API
**File**: Tutti i controller (es. `AdminCrudController`)
```csharp
[HttpPost("companies")]
public async Task<IActionResult> CreateCompany([FromBody] Company request)  // EF entity!
```
**Perché è un problema**: Le navigation properties (lazy-load EF) generano cicli JSON infiniti o espongono dati interni non intenzionali. Non c'è separation of concerns tra persistence e API layer. Qualsiasi aggiunta al modello EF cambia automaticamente l'API pubblica.
**Severità**: **HIGH** — security data exposure, instability, coupling.
**Fix**: Introdurre Request/Response DTOs separati + AutoMapper o manual mapping.

#### H2 — Nessun Row-Level Security a livello database
**Perché è un problema**: Il multi-tenant è implementato solo a livello applicativo (TenantContextFilter). Se c'è un bug nel filtro o una query diretta al DB, tutti i dati di tutti i tenant sono accessibili.
**Severità**: **HIGH** — data breach risk per errori di coding.
**Fix**: PostgreSQL RLS (se si migra) o SQL Server Row Level Security con user context.

#### H3 — `ValidatePasswordAsync` blocca l'accesso con GetAwaiter().GetResult()
**File**: [`DocumentGenerationService.cs`](file:///c:/github/medwork-manager/MedWork.Api/Services/DocumentGenerationService.cs#L53)
```csharp
var validation = ValidateAllegato3BXsd(companyId, cancellationToken).GetAwaiter().GetResult();
```
**Perché è un problema**: `.GetAwaiter().GetResult()` in un contesto ASP.NET Core è deadlock-prone. Blocca il thread pool.
**Severità**: **HIGH** — può causare deadlock in produzione sotto carico.
**Fix**: `await ValidateAllegato3BXsd(companyId, cancellationToken)`.

#### H4 — Nessuna paginazione su endpoint di liste
**Perché è un problema**: `GetAllAsync()` su `Companies`, `Employees`, `MedicalVisits` etc. non ha paginazione. Con 10.000+ dipendenti (scenario reale), queste query esplodono in memoria e timeout.
**Severità**: **HIGH** — performance bottleneck e denial-of-service accidentale.
**Fix**: Implementare keyset pagination (es. cursor-based) su tutti gli endpoint di lista.

#### H5 — EPPlus 4.5.x — Licenza GPL incompatibile con uso commerciale
**Perché è un problema**: EPPlus < 5.x è licenziato LGPL. La versione commerciale richiede una licenza a pagamento. Usarla in un SaaS commerciale senza licenza è infringement.
**Severità**: **HIGH** — rischio legale.
**Fix**: Aggiornare a EPPlus 5+ (con licenza commerciale acquistata) o usare ClosedXML (MIT).

#### H6 — CORS troppo permissivo in produzione
**File**: [`Program.cs`](file:///c:/github/medwork-manager/MedWork.Api/Program.cs#L134-L139)
```csharp
policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
    .AllowAnyHeader()
    .AllowAnyMethod();
```
**Perché è un problema**: Localhost è hardcoded. In produzione questi CORS non consentirebbero il dominio reale. O peggio, se modificati male con `AllowAnyOrigin`, consentirebbero XSS cross-origin.
**Severità**: **HIGH** — configurazione errata bloccherebbe produzione o aprirebbe vulnerabilità.
**Fix**: CORS via configuration, per ambiente, con allowed origins specifici.

---

### 🟡 MEDIUM Issues

#### M1 — TenantService.cs contiene 4 classi diverse (God File)
**File**: [`TenantService.cs`](file:///c:/github/medwork-manager/MedWork.Api/Services/TenantService.cs)
Contiene: `TenantService`, `UserService`, `RoleService`, `PermissionService` (432 righe).
**Perché è un problema**: Violation Single Responsibility Principle. Difficile da navigare, testare, e fare PR review.
**Fix**: Split in 4 file separati.

#### M2 — Duplicazione logica nei controller (C&P pattern)
**Perché è un problema**: I controller Create/Update/Delete seguono tutti lo stesso pattern ma senza helper comune. Ogni bug fix deve essere replicato in 20+ posti.
**Fix**: Generic base controller o mediator pattern (MediatR).

#### M3 — AdminCrudController: bug copy-paste
**File**: [`AdminCrudController.cs`](file:///c:/github/medwork-manager/MedWork.Api/Controllers/AdminCrudController.cs#L468-L469)
```csharp
entity.LegalName = request.LegalName;
entity.LegalName = request.LegalName;  // duplicato!
```
**Severità**: **MEDIUM** — bug funzionale (Address non viene mai aggiornato).

#### M4 — Nessun logging strutturato
**Perché è un problema**: Nessun uso di `ILogger<T>`. Non c'è modo di diagnosticare errori in produzione, tracciare performance, o fare audit trail applicativo.
**Fix**: Iniettare `ILogger<T>` in tutti i servizi. Usare Serilog con structured logging JSON.

#### M5 — `schema_full.sql` è vuoto
**File**: [`schema_full.sql`](file:///c:/github/medwork-manager/schema_full.sql) — 3 bytes (vuoto).
**Perché è un problema**: La documentazione schema non esiste. DBA non può fare review indipendente.

#### M6 — Allegato 3B XML non conforme alla specifica INAIL reale
**File**: [`DocumentGenerationService.cs`](file:///c:/github/medwork-manager/MedWork.Api/Services/DocumentGenerationService.cs)
L'XSD è un mock minimale (5 elementi). Lo standard INAIL ha decine di campi obbligatori, codifiche specifiche, namespace precisi.
**Severità**: **MEDIUM/HIGH** per produzione — ogni invio sarà rifiutato dal portale INAIL.

#### M7 — PDF generati client-side con jsPDF
**Perché è un problema**: La generazione di documenti legali (cartelle sanitarie, giudizi di idoneità) non può avvenire client-side. Il contenuto può essere manipolato dall'utente prima di essere stampato/firmato. Non c'è firma digitale sul PDF.
**Fix**: Generazione PDF server-side (QuestPDF, iTextSharp, o Puppeteer headless).

#### M8 — Frontend: App.tsx monolito da 1022 righe
**File**: [`App.tsx`](file:///c:/github/medwork-manager/medwork-frontend/src/App.tsx)
Contiene: routing logic, API calls, state management, UI rendering, auth logic, menu config. Tutto in un file.
**Fix**: Decomposizione in Router, Context providers, custom hooks, page components.

#### M9 — Nessuna gestione errori centralizzata nel backend
Nessun `UseExceptionHandler` global middleware. Le eccezioni non gestite espongono stack traces al client.
**Fix**: Global exception handler middleware con logging e response standardizzata (RFC 7807 Problem Details).

---

### 🟢 LOW Issues

#### L1 — `App.before-gestionale.jsx` in produzione
File vecchio (~19kb) non eliminato dalla cartella src. Aumenta bundle size e confonde i developer.

#### L2 — Mix di `.jsx` e `.tsx` nel frontend senza criterio chiaro
Causa perdita dei benefici TypeScript. `App.tsx` importa componenti `.jsx` non tipizzati.

#### L3 — Token JWT con scadenza fissa 3600s senza refresh token reale
Il `/refresh` endpoint riemette un token ma non invalida quello vecchio e non gestisce rotation.

#### L4 — No Null-check su navigation properties nei query
Uso di `?` operator ma senza Include() espliciti in alcuni endpoint che potrebbero ritornare null silenzioso.

---

### Test Coverage Assessment

| Area | Copertura |
|---|---|
| Entity validation | ✅ Buona (EntityValidationTests) |
| Integration tests | ✅ Buona (9 file, 48+ test) |
| Service unit tests | ❌ Assente |
| Frontend unit tests | ⚠️ Minimal (App.test.jsx base) |
| E2E Playwright | ⚠️ Config presente, test vuoti |
| AI/ML logic | ❌ Assente |
| Compliance rules | ❌ Assente |
| Security tests | ❌ Assente |

**Test coverage stimata**: ~25-30% (solo integration test su endpoint CRUD).

---

## 3. Product Gap Analysis

### Business Capabilities: Stato Attuale

| Funzionalità | Esiste | Qualità | Note |
|---|:---:|:---:|---|
| **Anagrafica lavoratori** | ✅ | ⭐⭐⭐ | Completa: CF, mansione, rischi, GDPR consent |
| **Anagrafica aziende** | ✅ | ⭐⭐⭐ | Completa: sedi, dipartimenti, contatti |
| **Registro medici** | ✅ | ⭐⭐⭐ | Albo, specializzazione, disponibilità |
| **Protocolli sanitari** | ✅ | ⭐⭐ | CRUD, versioning base, steps JSON |
| **Visite mediche** | ✅ | ⭐⭐ | Flusso base, esami, anamnesi |
| **Cartella Sanitaria 3A** | ⚠️ | ⭐ | Route v2, struttura base senza wizard |
| **Giudizi di idoneità** | ⚠️ | ⭐ | OutcomeCode su MedicalVisit, non entità dedicata |
| **Scadenziario** | ⚠️ | ⭐ | `ScadenziarioPeriodicityService` puro, non integrato |
| **Allegato 3B INAIL** | ⚠️ | ⭐ | XML stub non conforme a standard INAIL reale |
| **Firma grafometrica** | ⚠️ | ⭐ | RSA SHA-256 verify, non cattura biometrica reale |
| **Notifiche multi-canale** | ⚠️ | ⭐ | Interfaccia OK, solo console output |
| **Compliance engine** | ⚠️ | ⭐⭐ | 5 regole hardcoded D.Lgs. 81/08 |
| **GDPR consent management** | ⚠️ | ⭐ | Stub, consent su Employee ma senza workflow |
| **DPIA assistant** | ⚠️ | ⭐ | Stub placeholder |
| **AI charting (STT/OCR)** | ❌ | — | Solo TODO placeholder |
| **Audit trail** | ❌ | — | `appendAuditEvent` frontend-only, non immutabile |
| **Fatturazione/SDI** | ❌ | — | BillingCenter UI, nessun backend reale |
| **Portale lavoratori** | ❌ | — | Non implementato |
| **Portale aziende** | ❌ | — | Non implementato |
| **SPID/CIE reale** | ❌ | — | Stub HTTP |
| **Mobile offline-first** | ❌ | — | Non esiste |
| **Protocol Designer visivo** | ❌ | — | Non esiste |
| **HR Sync (Zucchetti/TeamSystem)** | ⚠️ | ⭐ | Solo CSV/Excel import |
| **Reporting analitico** | ⚠️ | ⭐⭐ | ReportsCenter client-side con jsPDF |
| **Relazione annuale art. 40** | ⚠️ | ⭐ | Generazione PDF client-side, dati parziali |
| **No-show prediction** | ⚠️ | ⭐ | Rule-based (non ML), non integrato nel flusso |
| **White-label / multi-studio** | ⚠️ | ⭐ | WhiteLabelResolver stub |

### Funzionalità Critiche Mancanti per MVP Production

1. **Generazione PDF server-side firmati digitalmente** — prerequisito legale
2. **Allegato 3B conforme a specifica INAIL reale** — obbligatorio per legge
3. **Workflow scadenziario end-to-end** — il valore principale del prodotto
4. **Audit trail immutabile** — obbligatorio GDPR e D.Lgs. 81/08
5. **Gestione consenso GDPR granulare** — requisito normativo art. 9 GDPR
6. **Firma digitale conforme DPR 445/2000** — requisito legale per cartella sanitaria
7. **Paginazione API** — prerequisito per qualsiasi volume reale di dati

---

## 4. Competitor Benchmark

### Analisi Competitor Italiani

| Competitor | Punti di Forza | Debolezze | Differenziatori |
|---|---|---|---|
| **Winasped** | Maturità 20+ anni, base clienti consolidata, conformità normativa testata, import da altri software | UX anni 2000, on-premise only, nessun mobile, nessuna AI | Brand storico, trust medici over-50 |
| **81ML (TaleteWeb)** | Web-based, aggiornamenti normativi rapidi, prezzo competitivo | UX basic, nessun mobile nativo, no AI, integrazioni limitate | Aggiornamenti normativi rapidi |
| **Twind** | Buona gestione protocolli, integrazioni HR | On-premise, UX datata | Integrazioni HR |
| **SimpleMDL** | Entry-level economico, cloud-based | Feature set minimo, no AI, no mobile | Pricing entry-level |
| **Koamed** | Focus su piccoli studi, semplice | Scalabilità limitata | Semplicità d'uso |
| **CANOPO** | Specializzazione in sorveglianza | UX basic, no mobile | Focalizzazione verticale |
| **Blumatica** | Suite completa sicurezza (DVR+sorveglianza) | Complessità, costo elevato | Integration DVR-sorveglianza |
| **Mediscopio** | Cliniche polispecialistiche | Non specifico medicina lavoro | Breadth clinica |
| **Softmed** | Certificazioni, storico | Obsoleto tecnologicamente | Certificazioni |
| **Asped2000** | Storico affidabile | Legacy, no cloud-native | Legacy trust |

### Feature Comparison Matrix

| Feature | MedWork | Winasped | 81ML | Twind | SimpleMDL |
|---|:---:|:---:|:---:|:---:|:---:|
| Web-based SaaS | ✅ | ❌ | ✅ | ❌ | ✅ |
| Multi-tenant | ✅ | ❌ | ⚠️ | ❌ | ❌ |
| Cartella 3A conforme | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |
| Allegato 3B INAIL | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |
| Giudizi idoneità strutturati | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| Scadenziario automatico | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |
| Protocolli sanitari | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |
| Firma digitale PDF | ⚠️ | ✅ | ✅ | ✅ | ❌ |
| Relazione annuale art. 40 | ⚠️ | ✅ | ✅ | ✅ | ❌ |
| SPID/CIE login | ⚠️ | ❌ | ⚠️ | ❌ | ❌ |
| Mobile nativo | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI charting | ❌ | ❌ | ❌ | ❌ | ❌ |
| OCR referti | ❌ | ❌ | ❌ | ❌ | ❌ |
| Predictive scheduling | ❌ | ❌ | ❌ | ❌ | ❌ |
| API aperte (REST) | ✅ | ❌ | ❌ | ❌ | ❌ |
| HR sync (Zucchetti/TS) | ⚠️ | ⚠️ | ⚠️ | ✅ | ❌ |
| Portale lavoratori | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| Portale aziende | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| Freemium model | ✅ | ❌ | ❌ | ❌ | ❌ |
| Compliance engine live | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| Audit trail immutabile | ❌ | ✅ | ⚠️ | ⚠️ | ❌ |
| FHIR/HL7 export | ❌ | ❌ | ❌ | ❌ | ❌ |
| UX moderna | ✅ | ❌ | ⚠️ | ❌ | ⚠️ |

### Missing Features Matrix (rispetto ai best-in-class)

| Gap | Impatto Business | Priorità Fix |
|---|---|---|
| Allegato 3B conforme INAIL | **Blocco legale** | P0 |
| PDF server-side + firma legale | **Blocco legale** | P0 |
| Scadenziario end-to-end integrato | **Core value** | P0 |
| Audit trail immutabile | **Requisito normativo** | P0 |
| GDPR consent workflow completo | **Requisito normativo** | P0 |
| Relazione annuale art. 40 | **Obbligatorio D.Lgs. 81/08** | P1 |
| Portale lavoratori SPID | **Differenziatore** | P1 |
| AI charting reale | **Differenziatore chiave** | P2 |
| Mobile offline-first | **Differenziatore chiave** | P2 |
| FHIR R4 IT export | **Standard apertura** | P2 |
| Protocol Designer visivo | **Innovazione** | P2 |

---

## 5. Innovation Opportunities

Queste opportunità, se implementate, creerebbero un vantaggio competitivo sostenibile che i competitor legacy non possono replicare rapidamente.

### 🤖 AI-1: Smart Charting Pipeline

**Visione**: Il medico parla durante la visita → trascrizione automatica → pre-compilazione strutturata della cartella 3A → suggerimento giudizio idoneità con spiegazione evidence-based.

**Implementazione suggerita**:
1. **STT**: Whisper large-v3 self-hosted (GDPR-safe, no dati a OpenAI) o Azure Speech con data residency EU
2. **NLP structuring**: Prompt engineering su GPT-4o con schema JSON cartella 3A, validato con Pydantic
3. **Judgment suggestion**: XGBoost classifier su features: (età, rischi, esami, anamnesi, storico visite) — interpretabile con SHAP
4. **Human-in-the-loop**: Il medico vede il suggerimento come "bozza AI" con confidence score. Tutto loggato per audit.

**ROI stimato**: Riduzione tempo visita da 15-20 min → 5-8 min. Valore enorme per medici ad alto volume.

### 📄 AI-2: OCR Referti Intelligente

**Visione**: Foto da smartphone del referto cartaceo → estrazione automatica valori (spirometria, audiometria, emocromo, etc.) → pre-compilazione campi visita.

**Implementazione**:
- Azure Document Intelligence (ex Form Recognizer) con modelli pre-addestrati su referti italiani
- Fallback: Tesseract + regex per referti standard
- Confidence threshold: campi con confidence < 0.8 vengono segnalati per revisione medico

### 📅 AI-3: Predictive Scheduling Engine

**Visione**: Il sistema suggerisce automaticamente quando e dove pianificare le prossime visite, raggruppando per area geografica e azienda, minimizzando gli spostamenti del medico.

**Implementazione**:
- **No-show prediction** (già stub presente): arricchire con dati meteo API, storico reale
- **Route optimization**: Google OR-Tools o OptaPlanner
- **Overbooking intelligente**: basato su probabilità no-show calcolata

**ROI**: Riduzione km/giorno del medico del 20-30%. Differenziatore enorme per medici con molte sedi.

### 🔄 AI-4: Regulatory Compliance Engine Live

**Visione**: I protocolli vengono validati in tempo reale contro le norme D.Lgs. 81/08 aggiornate. Quando esce una circolare o una modifica normativa, il sistema notifica automaticamente i medici con protocolli potenzialmente non conformi.

**Implementazione**:
- **Knowledge base** RAG: vettorizzazione norme con pgvector o Qdrant
- **Regulatory changelog parser**: monitor GU (Gazzetta Ufficiale) + MinLavoro + INAIL via API o scraping
- **Rule DSL**: regole espresse in JSON Logic o CEL (già in piano), aggiornabili senza deploy

**Moat**: Questo è il differenziatore più difficile da copiare. Richiede domain expertise + ingegneria + monitoraggio continuo.

### 📱 AI-5: Mobile Offline-First per Visite in Loco

**Visione**: Il medico va in stabilimento senza internet → lavora completamente offline (cartella, esami, giudizio, firma) → sincronizzazione al ritorno.

**Implementazione**:
- **App**: React Native + Expo (come da piano)
- **Offline DB**: PouchDB/RxDB con CouchDB sync protocol
- **Firma grafometrica**: cattura biometrica reale (Apple Pencil / Samsung S-Pen) → PDF firmato verificabile
- **OCR locale**: ML Kit (Google) per referti offline

**Vantaggio**: Nessun competitor italiano ha questa funzionalità. Il 40% delle visite avviene in luoghi con connettività limitata (cantieri, industrie).

### 🏢 AI-6: Protocol Marketplace

**Visione**: Biblioteca di protocolli pre-validati per ATECO/mansione, contribuiti da esperti e medici competenti della community. Import 1-click + personalizzazione + fork.

**Implementazione**:
- Template Protocol per categoria ATECO
- Rating/review system tra medici
- Version history con changelog
- Compliance score automatico (vs regole engine)

**Network effect**: Più medici usano il sistema, migliore diventa il marketplace. Crea lock-in positivo (switching cost).

### 📊 AI-7: Benchmark Anonimizzato e Insight

**Visione**: "Il tuo tasso di idoneità parziale per il rischio chimico è 40%, contro una media del 28% dei tuoi colleghi nella stessa area ATECO. Vuoi rivedere il protocollo?"

**Implementazione**:
- Aggregazione anonimizzata opt-in
- Dashboard KPI con percentili
- Alert automatici su anomalie statistiche
- GDPR-compliant: solo dati aggregati, mai individuali

**Valore**: Primo sistema in Italia a offrire benchmark clinico anonimizzato tra medici competenti.

---

## 6. Architettura Target Raccomandata

Per raggiungere la visione del piano mantenendo ciò che è già stato costruito:

```mermaid
graph TB
    subgraph Target ["Target Architecture (12 mesi)"]
        FE["Frontend<br/>React + Vite (attuale)<br/>→ aggiungere Next.js per SSR/SEO"]
        MOB["Mobile<br/>React Native + Expo<br/>(da costruire)"]
        
        GW["API Gateway<br/>Nginx/YARP reverse proxy<br/>(semplice, no Kong per ora)"]
        
        API["Backend API<br/>ASP.NET Core (attuale)<br/>Refactoring: DTOs, pagination,<br/>global error handling"]
        
        DOCS["Document Service<br/>QuestPDF + iText<br/>Server-side PDF con firma"]
        
        AI["AI Service<br/>Python FastAPI<br/>Whisper + LLM + OCR"]
        
        NOTIF["Notification Service<br/>Hangfire + real PEC/Email<br/>(Aruba, SendGrid)"]
        
        DB["SQL Server (attuale)<br/>→ PostgreSQL (migrazione)<br/>+ RLS nativa"]
        
        BLOB["Document Storage<br/>Azure Blob / MinIO<br/>per PDF, firme, referti"]
        
        CACHE["Redis<br/>Session + rate limiting"]
    end
    
    FE --> GW
    MOB --> GW
    GW --> API
    GW --> AI
    API --> DB
    API --> BLOB
    API --> CACHE
    API --> NOTIF
    API --> DOCS
    AI --> DB
```

### Priorità di Refactoring (prossimi 90 giorni)

```
P0 (Settimane 1-2): Security fixes
  └─ Rimuovere backdoor password hardcoded
  └─ Ruotare JWT secret key
  └─ Fix TenantId fallback → 401
  └─ Fix TenantId hardcoded in AlertService
  └─ Aggiungere global exception handler

P1 (Settimane 3-6): Core features compliance
  └─ Allegato 3B conforme specifica INAIL reale
  └─ PDF server-side con QuestPDF
  └─ Scadenziario end-to-end integrato
  └─ Audit trail server-side immutabile
  └─ DTOs separati per tutti gli endpoint
  └─ Paginazione

P2 (Settimane 7-12): Feature parity con competitor
  └─ Relazione annuale art. 40 completa
  └─ Workflow giudizi idoneità con prescrizioni
  └─ GDPR consent management completo
  └─ Notifiche email reali (non console)
  └─ Fix EPPlus licenza

P3 (Mesi 4-6): Differenziazione
  └─ AI charting (Whisper + LLM)
  └─ OCR referti
  └─ Mobile app (React Native)
  └─ SPID/CIE reale
```

---

## 7. Valutazione Maturità e Roadmap

### Technology Readiness Level (TRL)

| Dimensione | TRL Attuale | Note |
|---|---|---|
| **Backend architecture** | TRL 4 | Proof-of-concept valido, non production-ready |
| **Database schema** | TRL 5 | Buono, manca RLS e audit trail |
| **Multi-tenancy** | TRL 3 | Presente ma con security flaw critici |
| **Auth/Security** | TRL 2 | Vulnerabilità critiche da correggere |
| **Core domain logic** | TRL 4 | Struttura corretta, implementazione incompleta |
| **Compliance engine** | TRL 3 | 5 regole base, non production |
| **Document generation** | TRL 2 | Tutto stub, nessuna conformità normativa |
| **AI features** | TRL 1 | Solo interfacce, nessuna implementazione |
| **Mobile** | TRL 1 | Non esiste |
| **Integrations** | TRL 2 | Solo CSV/Excel, tutto il resto stub |
| **Frontend UX** | TRL 5 | UI moderna, funzionale per demo |

### Investment Readiness

| Scenario | Valutazione |
|---|---|
| **Pre-seed / Angel** | ✅ Appropriato — validazione tecnica, team convincing, piano solido |
| **Seed (€300k-1M)** | ⚠️ Condizionato a: fix security critical, MVP compliance-complete, 2-3 beta customer |
| **Series A** | ❌ Non ancora — manca product-market fit, revenue, differenziazione AI reale |

---

## 8. Riepilogo Rischi

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| Violazione GDPR da backdoor password | Alta | Critico | Fix immediato |
| Forging JWT da secret hardcoded | Alta | Critico | Rotate key + vault |
| Rifiuto Allegato 3B da INAIL | Certa (XML stub) | Alto | Implementare XSD reale |
| Problemi legali EPPlus licenza | Alta | Alto | Aggiornare licenza o cambiare libreria |
| Cross-tenant data leak | Media | Critico | Fix TenantId fallback |
| Performance issue con dataset reale | Alta | Alto | Implementare paginazione |
| Adozione lenta da medici (UX gap) | Media | Alto | Feedback loop con medici pilota |

---

*Report generato il 13 Agosto 2026 — Basato su analisi completa del repository `c:\github\medwork-manager`*
*Prossima revisione raccomandata: dopo fix P0 (entro 2 settimane)*
