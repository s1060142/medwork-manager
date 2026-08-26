# MedWork Manager — PROGRESS

## Sessione 2026-08-27 — Test sistematico di tutti i pulsanti

### Cosa è stato fatto
Crawler Playwright automatico (`medwork-frontend/button-crawler.mjs`, v1 e v2) che fa login, naviga per ogni area/tab, clicca ogni pulsante visibile (inclusi i bottoni dentro dialog aperti), cattura errori JS / console / status 500, salva screenshot di evidenza e un report JSON.

### Numeri aggregati
| Run (v1) | Aree | Totale | OK | Rotti |
|---|---|---|---|---|
| L1 | Gestione aziende + Gestione lavoratori | 199 | 118 | 81* |
| L2 | Analisi e relazioni + Sorveglianza sanitaria | 32 | 26 | 6* |
| L3 | Scadenzario + Amministrazione | 118 | 85 | 33* |

| Run (v2) | Aree | Totale | OK | Rotti |
|---|---|---|---|---|
| v2-1 | Gestione aziende + Gestione lavoratori | 108 | 99 | 9 (4× paginazione MUI falsi positivi, 4× Convoca 500 BUG-1, 1× 📋 connection refused post-kill backend) |
| v2-2 | Analisi e relazioni + Sorveglianza sanitaria | 44 | 42 | **2 (reali, BUG-2)** |
| v2-3 | Scadenzario + Amministrazione | 111 | 83 | 28 (tutti Convoca 500 pre-fix) |

\* Gran parte dei "rotti" v1 sono falsi positivi del selettore `hasText` su bottoni con icone MUI (es. 📋) o bottoni `aria-label` di paginazione. Il v2 riduce i falsi positivi ricliccando il dialog dopo ogni bottone interno. La quasi totalità dei veri errori è il **Convoca 500 (BUG-1)**, confermato in tutti i crawler prima del riavvio backend.

### Bug reali trovati

#### BUG-1 — "Convoca" → 500 Internal Server Error su **tutti** gli scenari
- **Area**: Scadenzario (Agenda, Prenotazioni, Scadenzario Visite, Scadenzario Attività, Scadenzario Sopralluoghi, Scadenzario Nomine, Scadenzario Vaccinazioni) + Gestione aziende → Attività
- **Endpoint**: `POST /api/doctor-data/convocations` → `DoctorCrudController.ConvocateEmployee`
- **Causa**: `MockNotificationService.SendConvocationAsync` non valorizzava `TenantId` → violazione FK `FK_NotificationLogs_Tenants_TenantId`. Dopo il primo fix, compariva un `JsonException` per ciclo di serializzazione (`NotificationLog → Employee → NotificationLogs → ...`).
- **Fix applicato**:
  1. `INotificationService.SendConvocationAsync` ora riceve `tenantId` come primo parametro.
  2. `MockNotificationService` setta `entry.TenantId = tenantId`.
  3. `DoctorCrudController.ConvocateEmployee` carica l'`Employee`, ricava `tenantId` da `GetTenantId()`, controlla `employee.TenantId == tenantId` (altrimenti `403 Forbid`) e passa `tenantId` al servizio.
  4. `NotificationLog.Tenant` ed `Employee` decorati con `[JsonIgnore]` per evitare il ciclo di serializzazione.
- **Verifica**: dopo riavvio backend, click su "Convoca" → 200 OK + messaggio "Convocazione registrata". Zero errori console.

#### BUG-2 — "Copia da ultima visita" / "Indietro" nella tab "Nuova visita" (Sorveglianza sanitaria)
- Timeout del crawler. Verificare manualmente se è bug reale o falso positivo del selettore (probabile bottone coperto / disabled / fuori viewport nello stepper).

### Note operative
- Backend lockato durante il build: terminare `MedWork.Api.exe` (PID visibile in `netstat -ano | grep :5279`) prima di `dotnet build`, altrimenti MSB3027.
- `start-api.bat` indicato nel commento di `MedWork.Api/Properties/launchSettings.json` non esiste; backend avviato con `dotnet run --no-build -c Debug --urls http://127.0.0.1:5279`.
- File di log crawler: `medwork-frontend/crawler*.log` (3 run in parallelo) + screenshot in `medwork-frontend/dogfood-output/screenshots*/`.
