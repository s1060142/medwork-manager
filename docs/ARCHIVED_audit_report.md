# REQUIRES CORRECTIONS

L'audit tecnico ha identificato **4 criticità bloccanti** nel piano di implementazione proposto. Se il piano viene eseguito così com'è, causerà errori 404 sul frontend, eccezioni EF Core a runtime, errori di permessi 403 per i medici, e fallimenti logici nel calcolo delle scadenze.

Di seguito le correzioni esatte richieste. Non procedere senza applicarle.

---

### 1. Feature 1 (PDF) — Frontend API Client e Token Mismatch
**Problema**: Nel file `GiudizioIdoneitaCenter.jsx`, il piano propone di chiamare l'API con un `fetch` diretto a `/api/documents/...` e cerca il token in `localStorage.getItem('medwork_token')`. MedWork usa Vite (porta 5173) e il backend è su porta diversa (5279). Un fetch relativo fallirà con 404 (non c'è proxy configurato). Inoltre, il token è salvato come `accessToken`, non `medwork_token`.
**Correzione Esatta**:
Usa le utility esistenti di `apiClient.ts` per l'URL e gli header. Sostituisci il blocco del fetch in `GiudizioIdoneitaCenter.jsx` con:
```javascript
import { getApiBaseUrl, getHeaders } from '../services/apiClient'

// Nel metodo downloadPdf():
const response = await fetch(
  `${getApiBaseUrl()}/api/documents/visits/${medicalVisitId}/fitness-judgment-pdf`,
  { headers: getHeaders() }
)
```

---

### 2. Feature 2 (Protocolli) — Security Regression / Role Mismatch
**Problema**: Il piano aggiunge gli endpoint CRUD dei protocolli (POST, PUT, PATCH) in `AdminCrudController.cs`. Questo controller ha l'attributo `[Authorize(Roles = AppRole.Admin)]`. Dato che sono i medici (ruolo `Doctor`) a creare e gestire i protocolli sanitari, ogni salvataggio dal frontend restituirà `403 Forbidden`.
**Correzione Esatta**:
Sposta i 4 nuovi endpoint (`GetProtocols`, `CreateProtocol`, `UpdateProtocol`, `ToggleProtocol`) dal file `AdminCrudController.cs` al file `DoctorCrudController.cs` (che è accessibile ai medici tramite `[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]`).
Aggiorna i path nel frontend (`ProtocolsCenter.jsx`) per puntare a `/api/doctor-data/protocols` anziché `/api/admin-data/protocols`.

---

### 3. Feature 2 (Protocolli) — Missing TenantId in Entity Instantiation
**Problema**: Nel metodo `CreateProtocol`, l'entità `Protocol` viene istanziata senza assegnare il `TenantId`. In `Protocol.cs`, il campo ha validazione `[Range(1, int.MaxValue)]`. Il salvataggio fallirà con una `DbUpdateException` perché il valore di default `0` viola il vincolo.
**Correzione Esatta**:
Nel blocco di creazione in `DoctorCrudController.cs` (post-migrazione), aggiungi esplicitamente l'assegnazione:
```csharp
var protocol = new Protocol
{
    TenantId = GetTenantId(), // AGGIUNGERE QUESTA RIGA
    Name = request.Name.Trim(),
    // ...resto invariato
};
```

---

### 4. Feature 3 (Scadenze) — Missing Business Logic (JobRole Protocols)
**Problema**: In `DeadlineCalculationService.cs`, il piano cerca il protocollo da applicare unicamente interrogando `_db.PersonalProtocols`. Nella realtà, il 95% dei lavoratori non ha un protocollo personale, ma eredita il protocollo standard assegnato alla loro Mansione (`JobRole`). Se non gestito, il servizio restituirà sempre `null` e chiederà l'inserimento manuale per quasi tutti i dipendenti.
**Correzione Esatta**:
In `CalculateAsync`, se non esiste un override in `PersonalProtocols`, il sistema deve fare fallback sul protocollo collegato al `JobRole` dell'Employee. Sostituisci la query con:
```csharp
// 1. Cerca prima un override personale
var protocol = await _db.PersonalProtocols
    .AsNoTracking()
    .Where(pp => pp.EmployeeId == employeeId && pp.IsActive && (pp.ExpiresAt == null || pp.ExpiresAt > visitDate))
    .OrderByDescending(pp => pp.AssignedAt)
    .Select(pp => pp.Protocol)
    .FirstOrDefaultAsync(cancellationToken);

// 2. Fallback al protocollo di mansione (JobRole)
if (protocol == null)
{
    protocol = await _db.Employees
        .AsNoTracking()
        .Where(e => e.Id == employeeId)
        .SelectMany(e => _db.Protocols.Where(p => p.JobRoleId == e.JobRoleId && p.IsActive))
        .FirstOrDefaultAsync(cancellationToken);
}

if (protocol == null)
    return null;

var cadenceDays = protocol.CadenceDays;
```
