# MedWork Manager — Test Strategy
**Data**: Settembre 2026
**Stato**: BETA HARDENING PHASE

---

## Panoramica della Strategia di Testing

MedWork utilizza una stratificia di test che copre unità, integrazione, E2E e validazione di sicurezza/multi-tenancy.

---

## 📊 Struttura dei Test

### Livello 1: Unit Tests (Backend)
**Framework**: xUnit
**Scope**: Validazione entità, logica di business, servizi isolati
**Coverage attuale**: ~25-30%
**Stato**: ✅ Attivo

- `EntityValidationTests` — validazione TenantId, date, vincoli
- `DoctorCrudController` — fix validazione date
- Test per service logic (DeadlineCalculationService)

### Livello 2: Integration Tests (Backend)
**Framework**: xUnit + WebApplicationFactory
**Scope**: Endpoint API, database, autenticazione
**Coverage attuale**: 48+ test passanti
**Stato**: ✅ Attivo

- `Fase1EndpointsTests.cs` — 6 test endpoint nuovi
- `AdminCrudIntegrationTests.cs` — CRUD aziende
- `AdminEmployeeIntegrationTests.cs` — CRUD dipendenti
- `AdminLifecycleAndNegativeIntegrationTests.cs` — casi negativi
- `AuditControllerTests.cs` — audit trail
- `AuthorizationIntegrationTests.cs` — autorizzazione RBAC
- `CompanyDoctorPropagationTests.cs` — propagazione medico
- `CompanyGroupsIntegrationTests.cs` — gruppi aziendali
- `DoctorCrudIntegrationTests.cs` — CRUD medici
- `TenantScopingIntegrationTests.cs` — isolamento multi-tenant
- `MedWorkWebAppFactory.cs` — factory per test
- `MedWorkWebAppAnonymousFactory.cs` — factory anonymous

### Livello 3: E2E Tests (Frontend)
**Framework**: Playwright
**Scope**: Flussi utente completi da UI a API a DB
**Coverage attuale**: 45+ test cases, 5 grid-sync spec files
**Stato**: ✅ Attivo, in estensione

#### Playwright Spec Files
| File | Modulo | Stato |
|---|---|---|
| `grid-sync-companies.spec.ts` | Companies | ✅ PASS |
| `grid-sync-employees.spec.ts` | Employees | ✅ PASS |
| `grid-sync-protocols.spec.ts` | Protocols | ✅ PASS |
| `grid-sync-visits.spec.ts` | Visits | ✅ PASS |
| `grid-sync-medical-records.spec.ts` | Medical Records | ✅ PASS |

#### Playwright Test Groups (da `PLAYWRIGHT_E2E_CAMPAIGN.md`)
| Gruppo | Test IDs | Count | Priorità |
|---|---|---|---|
| Authentication | AUTH-01 through AUTH-06 | 6 | P0-P2 |
| Companies | COMP-01 through COMP-05 | 5 | P0-P1 |
| Employees | EMP-01 through EMP-05 | 5 | P0-P1 |
| Medical Visits | VISIT-01 through VISIT-04 | 4 | P0-P1 |
| Medical Records | MR-01 through MR-03 | 3 | P0-P1 |
| Protocols | PROTO-01 through PROTO-04 | 4 | P0-P1 |
| Deadline Calculation | DEAD-01 through DEAD-04 | 4 | P0-P1 |
| Patient Portal | PAT-01 through PAT-03 | 3 | P0 |
| PDF Generation | PDF-01 through PDF-03 | 3 | P0-P1 |
| Imports/Exports | IMP-01 through IMP-03 | 3 | P0-P1 |
| Notifications | NOTIF-01 through NOTIF-02 | 2 | P1-P2 |
| Administration | ADMIN-01 through ADMIN-03 | 3 | P0-P1 |
| **TOTALE** | | **45** | |

---

## 🎯 Beta Gate (Requisiti per Rilascio Beta)

**13 P0 test devono passare**:

| # | Test ID | Description | Priority |
|---|---------|-------------|----------|
| 1 | `AUTH-01` | Admin login success | P0 |
| 2 | `AUTH-02` | Doctor login success | P0 |
| 3 | `AUTH-03` | Invalid credentials rejected | P0 |
| 4 | `AUTH-04` | Logout clears session | P0 |
| 5 | `AUTH-05` | Tenant slug required | P0 |
| 6 | `COMP-01` | List companies | P0 |
| 7 | `COMP-02` | Create company | P0 |
| 8 | `EMP-01` | List employees | P0 |
| 9 | `VISIT-01` | Create medical visit | P0 |
| 10 | `VISIT-02` | Auto deadline calculation | P0 |
| 11 | `MR-01` | Create medical record | P0 |
| 12 | `PROTO-02` | Create protocol with TenantId | P0 |
| 13 | `PDF-01` | Download fitness judgment PDF | P0 |

**Pass criteria**: 13/13 P0 test passano.

---

## 🔒 Security Testing

### Test di Isolamento Multi-Tenant
Ogni test di isolamento verifica che:
- Tenant A **non** può accedere ai dati di Tenant B
- Tentativo diretto di accesso a ID di altro tenant → 404/403
- Nessun cross-tenant data leak

**Moduli testati**: Companies, Employees, Protocols, Visits, Medical Records, Patient Portal

### Categorie di Test di Sicurezza
- Tenant isolation (P0, 6 moduli)
- User roles (Admin vs Doctor vs Patient)
- Authorization boundaries
- Data leakage prevention

---

## 🧪 Test di Build e Lint

### Backend
- `dotnet build` → build verde
- `dotnet test` → tutti i test passanti
- Nessun warning nuovo
- Migration pronta (MigrateAsync nel seeder)

### Frontend
- `npm run build` → build Vite verde
- `npm run lint` → 0 errori nuovi
- Nessun warning TypeScript
- Bundle size dentro limiti

### Test di Regressione
- Tutti i test Playwright esistenti devono passare
- Ogni nuovo feature aggiunge test Playwright
- Grid sync: 5/5 PASS (estensione pianificata a tutti i moduli)

---

## 📋 Convenzioni di Testing

| Convenzione | Dettaglio |
|---|---|
| **Base URL** | `http://127.0.0.1:5173` |
| **Browser** | Chromium (Desktop Chrome) |
| **Default admin** | `admin` / credential test fixture |
| **Default doctor** | `doctor` / credential test fixture |
| **Test tenant** | `default` (slug) |
| **Test data** | Creato via API in `beforeEach` |
| **Cleanup** | Ogni test pulisce i dati creati |
| **Wait strategy** | `waitForSelector` con timeout 10-30s |
| **Locators** | `getByRole`, `getByLabel`, `getByText` (non CSS) |
| **API helpers** | `test-utils.ts` con login helper + API client |

---

## ⏱️ Stime di Esecuzione

| Suite | Tempo Stimato |
|---|---|
| Smoke (5 test) | ~5 minuti |
| Core Path (25+ test) | ~20 minuti |
| Beta Gate (13 P0) | ~40 minuti |
| Full Regression (45+) | ~90 minuti |

---

## 🔄 Test di Nuove Funzionalità

Ogni nuova feature DEVE avere:

1. **Build validation** — `dotnet build` e `npm run build` passano
2. **UI validation** — Playwright test per l'endpoint UI
3. **Workflow validation** — scenario end-to-end testato
4. **Tenant isolation** — test di cross-tenant data leakage
5. **Regression test** — nessuna regressione su moduli esistenti

---

## 📈 Metriche di Qualità dei Test

| Metric | Obiettivo | Stato Attuale |
|---|---|---|
| Backend test pass rate | 100% | ✅ 48+ pass |
| Frontend build | verde | ✅ Pass |
| Playwright Beta gate | 13/13 P0 | 🔴 In verifica |
| Grid sync | 5/5 PASS | ✅ Pass |
| Code coverage (BE) | >30% | ⚠️ ~25-30% |
| Test di sicurezza | Tutti i moduli | ⚠️ 6/12 moduli |
| Nuovi test per feature | 1:1 | 📋 Standard |

---

## 🛠️ Strumenti di Testing

| Strumento | Utilizzo |
|---|---|
| **xUnit** | Unit + integration test backend |
| **WebApplicationFactory** | Test integratione backend |
| **Playwright** | E2E test frontend |
| **Vitest** | Unit test frontend |
| **Testing Library** | Test frontend |

---

*Aggiornato: Settembre 2026 — BETA HARDENING PHASE*
*Stack: ASP.NET Core 10, EF Core 10.0.12*
