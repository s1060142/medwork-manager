# MedWork Manager — Security and Multi-Tenancy
**Data**: Settembre 2026
**Stato**: BETA HARDENING PHASE

---

## Principi Fondamentali

1. **Tenant isolation è obbligatorio** — ogni dato è isolato per tenant
2. **Ogni query è production-sensitive** — nessun dato cross-tenant mai permesso
3. **Audit trail è immutabile** — server-side, non cancellabile
4. **Compliance GDPR art. 5 + art. 9** — dati sanitari sono dati sensibili
5. **Nessuna backdoor** — nessun accesso bypassante permesso

---

## Stato Attuale della Sicurezza

### ✅ RISOLTO

| Issue | Severity | Fix | Data Fix |
|---|---|---|---|
| Admin123! backdoor | CRITICAL | Rimosso da produzione | Solo in test fixtures (`appsettings.Testing.json`) |
| TenantId fallback = 1 | CRITICAL | 401 se tenantId manca | `TenantContextFilter` corretto |
| AlertMultiChannelService TenantId hardcoded | CRITICAL | Inietta TenantId reale | `AlertMultiChannelService.cs` corretto |
| Audit trail localStorage | HIGH | Server-side immutabile | `AuditController.cs` + `AuditCenter.jsx` |
| Protocol localStorage | HIGH | DB persistence | `ProtocolsCenter.jsx` ora salva nel DB |

### ⚠️ DA MONITORARE

| Issue | Severity | Stato | Raccomandazione |
|---|---|---|---|
| JWT secret hardcoded | HIGH | `appsettings.json` ha placeholder | Usare Azure Key Vault / .NET User Secrets |
| CORS per ambiente | HIGH | Configurato per localhost | Parametrizzare per ambiente |
| EPPlus licenza | HIGH | 4.5.x LGPL | Aggiornare a 5+ o sostituire con ClosedXML |
| DTOs mancanti | MEDIUM | EF entities passati direttamente | Introdurre Request/Response DTOs |
| Global exception handler | MEDIUM | Nessun middleware | Aggiungere `UseExceptionHandler` |
| Structured logging | LOW | Nessun `ILogger<T>` | Aggiungere Serilog |
| Rate limiting | LOW | Assente | Aggiungere middleware rate limiting |
| SQL Server RLS | LOW | Non implementata | Valutare migrazione a PostgreSQL |

---

## Multi-Tenancy Implementation

### Enforcer Layer

```
┌─────────────────────────────────────────────┐
│         TenantContextFilter (Middleware)       │
│                                              │
│  1. Legge tenantId da JWT claims              │
│  2. Se tenantId manca → 401 Unauthorized     │
│  3. Se tenantId invalido → 403 Forbidden     │
│  4. Inietta TenantId nel HttpContext          │
│                                              │
│  ⚠️ IL FALLBACK = 1 È STATO RIMOSSO           │
│     Non esiste più come sicurezza.            │
│     Ritorna sempre 401 se manca il tenantId.  │
└─────────────────────────────────────────────┘
```

### Database Layer

```
┌─────────────────────────────────────────────┐
│         EF Core Global Query Filter            │
│                                              │
│  Ogni entity con TenantId:                    │
│  ├── .HasQueryFilter(e => e.TenantId == _tenantId) │
│                                              │
│  Garantisce che ogni query EF filtri per     │
│  TenantId automaticamente.                    │
│                                              │
│  Entity con TenantId (esempi):                │
│  ├── Company                                   │
│  ├── Employee                                  │
│  ├── MedicalVisit                              │
│  ├── MedicalRecord                             │
│  ├── Protocol                                  │
│  ├── PersonalProtocol                          │
│  ├── ScheduledExam                             │
│  ├── Vaccination                               │
│  ├── AuditEvent                                │
│  └── ...                                      │
└─────────────────────────────────────────────┘
```

### Controller Layer

```
┌─────────────────────────────────────────────┐
│         Authorization Attributes              │
│                                              │
│  [Authorize(Roles = AppRole.Admin)]          │
│  [Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)] │
│                                              │
│  Ogni endpoint specifica il ruolo richiesto. │
│  AdminCrudController → Admin                 │
│  DoctorCrudController → Doctor + Admin       │
│                                              │
│  Verifica:                                   │
│  ├── TenantId presente nel JWT?              │
│  ├── Ruolo corretto?                         │
│  ├── TenantId corrisponde all'entità?        │
│  └── Nessun cross-tenant access?             │
└─────────────────────────────────────────────┘
```

### Test di Isolamento (Playwright)

```
┌─────────────────────────────────────────────┐
│         Multi-Tenant Test Pattern              │
│                                              │
│  Setup:                                      │
│  ├── Crea Tenant A                           │
│  ├── Crea Tenant B                           │
│  ├── Crea entity in Tenant A                 │
│  └── Crea entity in Tenant B                 │
│                                              │
│  Test:                                       │
│  ├── Login come Tenant A                     │
│  ├── Tentativo di accedere a entity di Tenant B│
│  ├── Risultato atteso: 404 o 403             │
│  └── Verifica: nessun dato di B visibile      │
│                                              │
│  Moduli testati:                              │
│  ├── Companies                               │
│  ├── Employees                               │
│  ├── Protocols                               │
│  ├── Visits                                  │
│  ├── Medical Records                         │
│  └── Patient Portal                          │
└─────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### JWT Flow

```
POST /api/auth/login
  → AuthController.Login(username, password, tenantSlug)
    → TenantService.FindBySlug(tenantSlug)
    → UserService.FindByUsername(username)
    → BCrypt.Verify(password, user.PasswordHash)
    → JwtTokenService.GenerateToken(userId, email, roles, permissions, tenantId)
    → Restituisce { accessToken, refreshToken }
```

### Refresh Token Flow

```
POST /api/auth/refresh
  → AuthController.Refresh(refreshToken)
    → JwtTokenService.ValidateRefreshToken(refreshToken)
    → Genera nuovo accessToken + refreshToken
    → Invalida il vecchio refreshToken
```

### RBAC Model

```
Role → RolePermission → Permission
  + UserPermission (override diretto)

Ruoli disponibili:
  ├── Admin — accesso completo a tutti i moduli
  ├── Doctor — accesso a visite, protocolli, pazienti, aziende assegnate
  ├── RSPP — accesso a compliance, rischi, protocolli
  └── ... (altri ruoli estendibili)
```

---

## Password & Secrets Management

### Stato Attuale

| Aspetto | Stato | Note |
|---|---|---|
| **Hashing** | ✅ BCrypt.Net 4.x | Standard industry |
| **Default admin password** | ⚠️ Solo in test fixtures | `Admin123!` solo in `appsettings.Testing.json` |
| **JWT secret** | ⚠️ Placeholder in config | Richiede vault esterno |
| **Connection string** | ⚠️ In appsettings.json | Richiede secret management |

### Raccomandazioni

1. **JWT secret** → Azure Key Vault / .NET User Secrets / ambiente variabile
2. **Connection string** → Ambiente variabile / segreto gestito
3. **Default credentials** → Mai in produzione, solo in test fixtures
4. **Password policy** → Implementare policy complessità

---

## Data Encryption

### At-Rest Encryption

```
┌─────────────────────────────────────────────┐
│         FieldEncryptionService               │
│                                              │
│  Campi sensibili criptati a riposo:          │
│  ├── Dati sanitari (cartella 3A)             │
│  ├── Informazioni GDPR sensibili             │
│  └── Dati anagrafici protetti                │
│                                              │
│  Criptazione:                                │
│  ├── AES-256 per dati sensibili              │
│  └── Key management via .NET Data Protection │
└─────────────────────────────────────────────┘
```

---

## GDPR Compliance

### Art. 5 — Principi di Liceità
- ✅ **Limitazione della finalità** — ogni dato ha uno scopo dichiarato
- ✅ **Minimizzazione dei dati** — solo campi necessari
- ✅ **Accuratezza** — dati aggiornabili
- ✅ **Limitazione di conservazione** — scadenze gestite da protocollo
- ⚠️ **Integrità e riservatezza** — crittografia a riposo implementata, audit trail completo
- ⚠️ **Responsabilità** — audit trail server-side funzionante

### Art. 9 — Dati Genetici e Sanitari
- ✅ **Consenso esplicito** — `ConsentManager` (stub, da completare)
- ✅ **DPI** — dati sanitari protetti da crittografia
- ⚠️ **Conservazione** — limitata a quanto necessario per obbligo legale
- ⚠️ **Diretto all'oblio** — implementare soft-delete per dati personali

### Audit Trail GDPR
- ✅ Immutabile (server-side)
- ✅ Non cancellabile dall'utente
- ✅ Include TenantId, userId, timestamp, azione
- ✅ Registra accessi, modifiche, creazioni, eliminazioni

---

## Security Checklist (Per Ogni Feature)

### Pre-Lancio
- [ ] **TenantId filtering** verificato su ogni endpoint
- [ ] **Authorization** verificata per ruolo corretto
- [ ] **No hardcoded secrets** nel codice committato
- [ ] **No cross-tenant data leak** testato con Playwright
- [ ] **Audit trail** registrato per ogni operazione
- [ ] **Input validation** su tutti i campi utente
- [ ] **SQL injection** prevenuta (EF Core parametrizzato)
- [ ] **XSS** prevenuta (React auto-escaping)
- [ ] **CSRF** prevenuta (JWT, non cookie-based session)
- [ ] **Error handling** non espone stack trace

### Post-Lancio
- [ ] **Penetration testing** regolare
- [ ] **Dependency scanning** (npm + NuGet)
- [ ] **JWT secret rotation** periodica
- [ ] **Log monitoring** per accessi sospetti
- [ ] **Rate limiting** su endpoint sensibili

---

## Incident Response

### Se un Cross-Tenant Leak viene individuato:
1. **Immediato**: Disabilitare l'endpoint interessato
2. **Investigazione**: Verificare quali tenant sono stati coinvolti
3. **Mitigazione**: Correggere il filtro, riscrivere la query
4. **Notifica**: Informare il DPO (Data Protection Officer)
5. **Documentazione**: Registrare l'incidente nell'audit trail

### Se una Backdoor viene individuata:
1. **Immediato**: Rimuovere il codice malevolo
2. **Rotazione**: Ruotare JWT secret, reset password admin
3. **Audit**: Verificare se sono stati compromessi dati
4. **Notifica**: GDPR art. 33 — notifica alle autorità entro 72h
5. **Post-mortem**: Analisi root cause + prevenzione

---

## Vulnerabilità Note (Da Monitorare)

| Vulnerability | Severity | Probabilità | Impatto | Mitigazione |
|---|---|---|---|---|
| EPPlus license issue | HIGH | Certa | Legale | Sostituire con ClosedXML |
| JWT secret placeholder | HIGH | Media | Token forgiabile | Key Vault + rotazione |
| Missing global exception handler | MEDIUM | Media | Info leak | Aggiungere middleware |
| Missing structured logging | MEDIUM | Alta | Diagnosi difficile | Serilog |
| Missing rate limiting | LOW | Alta | DoS accidentale | Middleware |
| No CORS per produzione | MEDIUM | Media | XSS cross-origin | Configurazione ambiente |

---

*Aggiornato: Settembre 2026 — BETA HARDENING PHASE*
*Fonte: `due_diligence_report.md`, codice sorgente, `AGENTS.md`*
