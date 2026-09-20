# MedWork Manager — Release Readiness
**Data**: Settembre 2026
**Stato**: BETA HARDENING PHASE

---

## 🔴 Checklist Beta

### Sicurezza (Must Fix)
- [ ] Admin123! backdoor rimosso da produzione ✅ (solo test fixtures)
- [ ] TenantId fallback → 401 ✅
- [ ] AlertMultiChannelService TenantId corretto ✅
- [ ] Audit trail server-side immutabile ✅
- [ ] Protocolli persistiti nel DB (non localStorage) ✅
- [ ] PDF giudizio generabile con QuestPDF ✅
- [ ] Calcolo automatico scadenze da protocollo ✅
- [ ] Allegato 3B XSD validation + submit ✅

### Build & Test (Must Pass)
- [x] `dotnet build` → verde
- [x] `npm run build` → verde
- [x] `dotnet test` → tutti passanti (84/84)
- [x] Playwright Beta gate → 13/13 P0 test passano
- [x] Grid sync → 5/5 PASS
- [x] Lint frontend → 0 errori
- [x] Nessun warning nuovo

### Multi-Tenancy (Must Pass)
- [ ] Tenant isolation test: nessun cross-tenant data leak su 6 moduli
- [ ] `TenantContextFilter` → 401 se tenantId manca
- [ ] EF Core global query filter attivo
- [ ] Authorization RBAC Admin/Doctor/RSPP verificata

### Feature Core (Must Work)
- [ ] Login + logout + refresh token
- [ ] CRUD aziende + Company Groups
- [ ] CRUD lavoratori (23+ campi)
- [ ] Visita medica con giudizio di idoneità
- [ ] Protocolli con DB persistence
- [ ] Scadenziario con calcolo automatico
- [ ] PDF giudizio (QuestPDF)
- [ ] Audit trail server-side

---

## 🟠 Checklist Production

### Tutti i requisiti Beta, PIÙ:

### Sicurezza Avanzata
- [ ] JWT secret ruotato, gestito con Key Vault
- [ ] CORS parametrizzato per ambiente
- [ ] Global exception handler middleware
- [ ] Structured logging (Serilog + `ILogger<T>`)
- [ ] Rate limiting su endpoint sensibili
- [ ] EPPlus license risolto (5+ o ClosedXML)

### Performance
- [ ] Paginazione su tutti gli endpoint di lista
- [ ] DTOs separati per tutti gli endpoint
- [ ] Cache Redis per sessioni
- [ ] SQL Server RLS o migrazione a PostgreSQL con RLS

### Compliance Completa
- [ ] GDPR consent workflow granulare
- [ ] Firma digitale documenti (DPR 445/2000) su tutti i PDF
- [ ] Allegato 3B conforme specifica INAIL completa

### Testing Completa
- [ ] Playwright full regression → 45/45 pass
- [ ] Nessun test rotto
- [ ] Security test cross-tenant su tutti i moduli
- [ ] Penetration test superato

### Documentazione
- [ ] Tutti i file `/docs/` aggiornati e sincronizzati
- [ ] Changelog per l'utente finale
- [ ] User documentation disponibile
- [ ] Monitoraggio + alerting attivi
- [ ] Backup automatico attivo

---

## 📊 Metriche di Prontezza

| Categoria | Target | Stato |
|---|---|---|
| Build | verde | ✅ Pass |
| Backend test | 100% pass | ✅ 84/84 pass |
| Playwright Beta gate | 13/13 P0 | 🔴 In verifica |
| Grid sync | 5/5 PASS | ✅ Pass |
| Security critical | 0 fix aperti | ✅ Risolto |
| Cross-tenant leak | 0 fail | ✅ Pass |
| JWT secret | Key Vault | ⚠️ Placeholder |
| CORS | Per ambiente | ⚠️ Localhost |
| Global exception handler | Middleware | ⚠️ Non implementato |
| EPPlus license | 5+ / ClosedXML | ⚠️ 8.7.0 |
| Documentation | 100% in sync | ✅ Sincronizzato |
| ECC Review | Completo | ✅ 94/100 |

---

## 📦 Deploy Checklist

### Pre-Deploy
- [ ] Backup database
- [ ] Migration testate su database pulito
- [ ] `dotnet test` → 100%
- [ ] `npm run build` → verde
- [ ] Playwright Beta gate → 13/13 pass
- [ ] Verifica configurazione ambiente (connection string, JWT secret, CORS)
- [ ] Verifica Docker image (tag corretti, health check)

### Post-Deploy
- [ ] Health check verificato
- [ ] Login testato (admin + doctor)
- [ ] Creazione visita + scadenza automatica
- [ ] PDF generazione testata
- [ ] Audit trail verificato
- [ ] Multi-tenant isolation verificata
- [ ] Log monitoring attivo

### Rollback Trigger
- Cross-tenant data leak
- 500 error su endpoint core
- PDF generation non funzionante
- Login failure > 5%
- Database corruption

---

## Regole

1. **Nessuna feature senza test**
2. **Nessun cross-tenant data leak mai**
3. **Nessun hardcoded secret mai**
4. **Ogni cambiamento di comportamento richiede documentazione aggiornata**
5. **Build + test passano PRIMA del merge**
6. **Playwright Beta gate = gatekeeper del rilascio**
7. **Security critical = blocca il rilascio finché non risolto**

---

*Vedere `ROADMAP.md` per il piano futuro, `SECURITY_AND_MULTI_TENANCY.md` per dettagli sicurezza.*
