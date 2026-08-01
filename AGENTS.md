# medwork-manager - Istruzioni Agent

## Panoramica del Progetto

**MedWork Manager** è una piattaforma di Medicina del Lavoro svizzata in C#/.NET 10 e React. Obiettivo: parità con Cartsan Suite (leader italiano con 2.030 clienti, 8.120 utenti attivi).

## Stack Tecnologico

| Strato | Tecnologia | Versione |
|--------|------------|----------|
| Backend | .NET | 10 (target net8.0/10.0) |
| Frontend | React + Vite | React 18, Vite 5 |
| UI Library | MUI | v5 |
| Database | SQL Server | LocalDB (Windows) |
| PDF Generation | QuestPDF | 2024.10 |
| Validazione | FluentValidation | 11.3.0 |
| ORM | EF Core | 8 |
| Autenticazione | JWT Bearer | - |
| Autorizzazione | Policy-based | - |
| Test | xUnit + FluentAssertions | - |

## Struttura del Progetto

```
medwork-manager/
├── MedWork.Api/           # Backend .NET 10
│   ├── Controllers/       # API Controllers
│   ├── Models/            # Entity models
│   ├── Services/          # Business logic
│   ├── Data/              # DbContext, Migrations
│   ├── Security/          # Auth, JWT, Policies
│   ├── Validators/        # FluentValidation
│   └── Contracts/         # DTOs, Interfaces
├── medwork-frontend/      # React + Vite
│   ├── src/
│   │   ├── components/    # UI Components
│   │   ├── services/      # API clients
│   │   └── utils/         # Helpers
│   └── package.json       # React 18 + MUI
└── AGENTS.md              # Questo file
```

## Regole Backend (.NET 10)

### 1. Codice C# Moderno
- Usa **Minimal APIs** dove possibile
- Usa **async/await** per tutte le operazioni I/O
- Segui il pattern **CQRS** (Command/Query separation)
- Usa **records** per DTO e request/response
- **Single Responsibility Principle (SRP)**: ogni classe/handler ha una sola ragione di modifica. Separare logica di business, persistenza e presentazione.

### 2. Validazione
- Tutti i DTO devono avere validator FluentValidation
- Validazione server-side obbligatoria
- Restituisci 400 con dettagli validazione

### 3. Database
- Usa **LocalDB** per lo sviluppo
- Esegui `dotnet ef migrations add` e `dotnet ef database update` dopo modifiche
- AuditLog è su DbContext separato (`AuditDbContext`)

### 4. Sicurezza
- **GDPR Art.9**: Dati clinici separati, accesso solo Dottori
- **JWT**: Configurazione in `appsettings.json`
- **Rate Limiting**: Login protetto (5 tentativi/1min/IP)
- **CORS**: Solo localhost:5173-5176

### 5. Dependency Injection
- Registra tutti i servizi in `Program.cs`
- Usa `AddHttpClient` per client esterni (SDI, PEC)
- `ISdiClient` registrato tramite `SdiClientFactory`

## Regole Frontend (React)

### 1. Componenti
- Solo componenti **funzionali** con Hooks
- Usa `useReducer` per logica complessa
- Usa `useMemo`/`useCallback` per ottimizzazione

### 2. Stato
- Usa Context per autenticazione e multi-tenant
- `ContextSelector` gestisce company/branch switching
- Evita state duplication

### 3. API Client
- Usa `apiClient.js` (axios instance con interceptor JWT)
- Gestisci errori centralizzatamente
- Refresh token automatico

### 4. Form
- Usa MUI `react-hook-form` integration
- Validazione client-side + server-side

## Regole Test

### Backend
- Test in `MedWork.Api.Tests/`
- Usa xUnit + FluentAssertions
- Mock per servizi esterni
- Copertura obbligatoria > 80% per nuovi endpoint

### Frontend
- Test in `App.test.jsx`
- Usa Testing Library
- Mock per API calls

## Comandi Utili

```bash
# Backend
dotnet build                        # Build
dotnet test                         # Test
dotnet ef migrations add <name>     # Migration
dotnet ef database update           # Update DB
dotnet run                          # Start API (porta 5000)

# Frontend
npm run dev                         # Dev server (porta 5173)
npm run build                       # Build prod
npm run preview                     # Preview prod build
npm test                            # Test

# Database
sqlcmd -S (localdb)\MSSQLLocalDB   # SQL Server LocalDB
```

## Endpoint Critici

- `POST /api/auth/login` - Login con JWT
- `GET /api/company-portal/workers` - Lista lavoratori
- `GET /api/portal/3b` - Allegato 3B
- `POST /api/invoices` - Fatturazione elettronica

## Note di Implementazione

1. **Fatturazione Elettronica** (CRITICAL):
   - XML SDI generato da `ElectronicInvoiceXmlService`
   - Invio tramite `SdiCoopClient` (HttpClient)
   - Stato fattura in `ElectronicInvoiceStatus`

2. **Multi-tenant**:
   - Company/Branch context in header `X-Active-Context`
   - Filtraggio automatico nei query

3. **Documenti**:
   - PDF generati con QuestPDF
   - Firma grafometrica (FEA) supportata

## Checklist Prima del Commit

- [ ] `dotnet build` passes
- [ ] `dotnet test` passes
- [ ] `npm run build` passes
- [ ] Codice formattato (`dotnet format`, `prettier --write`)
- [ ] Commenti XML per metodi pubblici
- [ ] Validazione input
- [ ] Gestione errori appropriata

## Contatti e Riferimenti

- Documentazione Cartsan: Analisi in `GAP_ANALYSIS_CARTSAN.md`
- PROGRESS.md per tracciamento task
- PRJCT.md per pianificazione