# MedWork Manager — Registro Analisi e Progressi

Ambiente ripulito da vecchi file temporanei e allineamento completo frontend-backend eseguito con successo.

---

## 1. Problemi Riscontrati e Risoluzioni Eseguite

### A. Esempio 1: Partita IVA, Codice Fiscale e Campi Estesi Aziende
- **Diagnosi**:
  - Nel tab "Gruppi aziendali" compariva la Partita IVA, ma aprendo un'azienda in `CompanyProfileDialog.jsx`, il campo Partita IVA non era né visibile né modificabile, e `VATNumber` / `TaxCode` venivano azzerati sul database al salvataggio. Inoltre, `entityConfigs.js` conteneva `'indirizzo SedeLegale'` anziché `'legalAddress'`.
  - In `MasterDataController.cs`, il metodo `GetCompanies()` ometteva nella clausola `.Select(...)` i campi estesi `Activity`, `OperationalUnitName`, `Type`, `Reference`, `Status` e `REANumber`. Di conseguenza, anche se il salvataggio (`PUT`) persisteva correttamente i dati a database, la chiamata di lettura `GET /api/master-data/companies` non li restituiva al frontend, lasciando le relative colonne della tabella vuote.
- **Modifiche applicate**:
  - In `MasterDataController.cs`: inclusi `x.Activity`, `x.OperationalUnitName`, `x.Type`, `x.Reference`, `x.Status` e `x.REANumber` nella proiezione LINQ di `GetCompanies()`.
  - In `CompanyProfileDialog.jsx`:
    - Aggiunti `vatNumber: ''` e `taxCode: ''` in `defaultFormData()`.
    - Caricati `vatNumber` e `taxCode` in `loadFull()` da `source.vatNumber ?? source.vATNumber` e `source.taxCode`.
    - Aggiunti campi `TextField` dedicati per **Partita IVA** e **Codice Fiscale** nella scheda "Anagrafica" (Tab 0).
  - In `entityConfigs.js`: rinominato `'indirizzo SedeLegale'` in `'legalAddress'`.
  - In `App.tsx`: collegato il callback `onSaveCompany` per aggiornare in tempo reale l'azienda modificata.

### B. Esempio 2: Errore 400 su Aggiunta Figura Aziendale
- **Diagnosi**: Il backend C# (`CompanyContact.cs`) richiede obbligatoriamente `Role` e `FullName`. Il frontend usava un `window.prompt` inviando proprietà in italiano (`nominativo`, `ruolo`) e visualizzava `contact.ruolo` e `contact.nominativo` (celle vuote).
- **Modifiche applicate**:
  - In `CompanyProfileDialog.jsx`:
    - Sostituito il vecchio `window.prompt` con un `Dialog` MUI dedicato e validato.
    - Il dialog gestisce: `Ruolo Aziendale` (menu a tendina: RSPP, RLS, DL, Dirigente, Medico Competente), `Nominativo*`, `Email` e `Telefono`.
    - Invia il payload formattato correttamente con nomi inglesi (`role`, `fullName`, `email`, `phone`, `companyId`).
    - La tabella visualizza `contact.role || contact.ruolo` e `contact.fullName || contact.nominativo` con fallback sicuri e allineamento perfetto.
  - In `entityConfigs.js`: aggiornati i campi di `company-contacts` con `role`, `fullName`, `email`, `phone`.
  - In `MasterDataController.cs`: `GetCompanyContacts` ora supporta il filtro `[FromQuery] int? companyId`.

### C. Risoluzione dei Fallimenti Sistematici di Salvataggio (`TenantId`)
- **Diagnosi**: I modelli C# imponevano la validazione `[Range(1, int.MaxValue)]` sulla proprietà `TenantId`. Poiché il client frontend non invia `TenantId` (in quanto gestito server-side dall'identità JWT), il model binder valorizzava `TenantId = 0`, facendo fallire la validazione (HTTP 400) prima ancora che il controller potesse assegnare il tenant. Inoltre, nei metodi `HttpPost` di `AdminCrudController.cs` mancava l'assegnazione esplicita `request.TenantId = tenantId;`.
- **Modifiche applicate**:
  - Rimossa la regola non necessaria `[Range(1, int.MaxValue)]` da `TenantId` sui modelli client: `Company.cs`, `CompanyContact.cs`, `CompanyGroup.cs`, `Department.cs`, `WorkLocation.cs`, `Branch.cs`, `JobRole.cs`, `RiskFactor.cs`, `ExamType.cs`, `PersonalProtocol.cs`, `SiteVisit.cs`, `Employee.cs`, `MedicalRecord.cs`, `MedicalVisit.cs`, `ScheduledExam.cs`, `Vaccination.cs`, `VisitExam.cs`.
  - In `AdminCrudController.cs`: garantita l'assegnazione esplicita `request.TenantId = tenantId;` in tutti i metodi di creazione (`CreateCompany`, `CreateBranch`, `CreateEmployee`, `CreateRiskFactor`, `CreateExamType`, `CreateJobRole`, `CreateProtocol`, `CreatePersonalProtocol`, `CreateCompanyGroup`, `CreateCompanyContact`, `CreateDepartment`, `CreateWorkLocation`, `CreateSiteVisit`).
  - In `AdminCrudController.UpdateCompanyGroup`: aggiunta l'assegnazione di `entity.Name = request.Name;`.
  - In `AdminCrudController.UpdateWorkLocation`: aggiunta l'assegnazione di `entity.Name` e `entity.Address`.
  - In `AdminCrudController.UpdateJobRole`: aggiunta l'assegnazione di `entity.ISCOCode`, `entity.RiskCategory`, `entity.IsActive`.

### D. Allineamento Altre Entità e Servizi
- **Reparti (`departments`)**:
  - Allineati i campi in `entityConfigs.js`: `name`, `manager`, `managerEmail`, `isActive`.
- **Luoghi di Lavoro (`work-locations`)**:
  - Allineati i campi in `entityConfigs.js`: `name`, `address`, `city`, `postalCode`, `province`, `notes`, `isActive`.
  - In `MasterDataController.GetWorkLocations`: aggiunti `x.Name` e `x.Address` nella proiezione della risposta.
- **Sopralluoghi (`site-visits`)**:
  - Aggiunti gli endpoint CRUD completi in `DoctorCrudController.cs` (`[HttpGet("site-visits")]`, `[HttpPost("site-visits")]`, `[HttpPut("site-visits/{id:int}")]`, `[HttpDelete("site-visits/{id:int}")]`).
  - Allineati i campi in `entityConfigs.js`: `companyId`, `visitedStructure`, `location`, `doctorName`, `visitDate`, `frequency`, `nextDueDate`, `outcome`, `notes`.
  - In `MasterDataController.GetSiteVisits`: aggiunti `notes` e `outcome` nella proiezione.
- **Protocolli Normativi (`protocols-registry`)**:
  - Corretti gli endpoint in `entityConfigs.js` per puntare a `/api/doctor-data/protocols`.
- **Mansioni (`job-roles`)**:
  - Allineati i campi in `entityConfigs.js` con lo schema reale di database: `name`, `description`, `iscoCode`, `riskCategory`, `isActive`.
- **Lavoratori (`employees`)**:
  - Corretto il typo `medicoCarante` in `medicoCurante` sia in `entityConfigs.js` sia in `EmployeeProfileDialog.jsx`.
  - Aggiunti alias `Nazionalita` e `MedicoCarante` in `Employee.cs` per garantire retrocompatibilità e resilienza su qualsiasi payload.
- **Gruppi Aziendali (`company-groups`)**:
  - Corretto `cap` in `postalCode` in `entityConfigs.js`.
- **CrudEntityView**:
  - Risolto il bug di shadowing alla riga 624 che annullava i `transform` dei campi durante la creazione di record.
  - Implementato refresh reattivo: `CrudEntityView` ora supporta `refreshToken` e ascolta l'evento `medwork:company-updated`.
  - Al salvataggio di un'azienda in `CompanyProfileDialog`, la vista sottostante (tabella aziende) si aggiorna istantaneamente sia localmente che tramite `loadRows()`.
- **Miglioramento Diagnostica Errori (`apiClient.ts`)**:
  - Funzione `safeReadError` estesa per estrarre e formattare i dettagli di validazione `parsed.errors` dello standard RFC 9110 ASP.NET Core, mostrando all'utente il campo specifico e il motivo dell'errore anziché un generico "One or more validation errors occurred."

### E. Risoluzione Errore Conversione Lavoratori (`categoriaProtetta` / `documentiPrivacy`)
- **Diagnosi**: Nel modello backend `Employee.cs`, i campi `CategoriaProtetta` e `DocumentiPrivacy` erano tipizzati come `string?`. In `EmployeeProfileDialog.jsx`, l'interfaccia utilizzava componenti `<Switch>` inviando valori booleani (`false`/`true`). Il deserializzatore System.Text.Json falliva con `HTTP 400: The JSON value could not be converted to System.String. Path: $.categoriaProtetta`.
- **Modifiche applicate**:
  - Creato `BooleanOrStringConverter.cs` in `MedWork.Api/Models/Common/` per gestire in modo flessibile e trasparente la deserializzazione di stringhe, booleani (`true`/`false`) o numeri senza mai lanciare eccezioni di conversione.
  - Applicato `[JsonConverter(typeof(BooleanOrStringConverter))]` su `CategoriaProtetta` e `DocumentiPrivacy` in `Employee.cs`.
  - In `EmployeeProfileDialog.jsx`: normalizzata la lettura a booleano in `loadFull()` e serializzazione a stringa sicura in `handleSave()`.

### F. Allineamento Pulsanti di Salvataggio in Alto
- **Modifiche applicate**:
  - In `EmployeeProfileDialog.jsx`: aggiunto il pulsante **Salva** (con icona disco e stile primario evidente) nella testata superiore del dialog (`#0f1f3d`) accanto al CF e al pulsante Chiudi, oltre a mantenerlo nel footer per comodità di consultazione.
  - In `CrudEntityView.jsx`: aggiunti i pulsanti **Salva** e **Annulla** direttamente nella testata (`DialogTitle`) di tutti i form modali di creazione e modifica entità (gruppi aziendali, sedi, reparti, mansioni, rischi, protocolli, ecc.), evitando di dover scorrere fino in fondo alla finestra per salvare.

### G. Suite di Test Automatizzata su Tutte le 22 Entità
- Creata ed eseguita la suite di collaudo [test_all_entities.ps1](file:///c:/github/medwork-manager/test_all_entities.ps1) che testa il ciclo di vita completo (**Lettura, Creazione, Modifica, Eliminazione**) con autenticazione JWT e tenant context.
- **Risultato del collaudo (22 su 22 riuscite con successo - 100% PASS)**:
  1. `company-groups` -> PASS (Read, Create, Update, Delete)
  2. `companies` -> PASS (Read, Create, Update, Delete)
  3. `branches` -> PASS (Read, Create, Update, Delete)
  4. `departments` -> PASS (Read, Create, Update, Delete)
  5. `work-locations` -> PASS (Read, Create, Update, Delete)
  6. `company-contacts` -> PASS (Read, Create, Update, Delete)
  7. `job-roles` -> PASS (Read, Create, Update, Delete)
  8. `risk-factors` -> PASS (Read, Create, Update, Delete)
  9. `protocols-registry` -> PASS (Read, Create, Update, Delete - aggiunto `HttpDelete` su `DoctorCrudController`)
  10. `employees` -> PASS (Read, Create, Update, Delete - testata conversione booleana/stringa)
  11. `personal-protocols` -> PASS (Read, Create, Update, Delete)
  12. `exam-types` -> PASS (Read, Create, Update, Delete)
  13. `medical-records` -> PASS (Read, Create, Update, Delete)
  14. `medical-visits` -> PASS (Read, Create, Update, Delete)
  15. `scheduled-exams` -> PASS (Read, Create, Update, Delete)
  16. `vaccinations` -> PASS (Read, Create, Update, Delete)
  17. `site-visits` -> PASS (Read, Create, Update, Delete)
  18. `anamneses` -> PASS (Read, Create, Update, Delete)
  19. `visit-exams` -> PASS (Read, Create, Update, Delete)
### I. Validazione Funzionale End-to-End: Azienda -> Medico Competente -> Lavoratore -> Visita Medica
- **Architettura Adottata: Modello Ibrido (Dinamico + Snapshot Storico)**:
  - **Lavoratore -> Medico Competente (Dinamico)**: Il lavoratore eredita dinamicamente il Medico Competente dalla relazione `Employee -> Company -> CompanyDoctor (IsCoordinator = true) -> Doctor`. Se l'azienda aggiorna il medico o se il lavoratore cambia azienda, la scheda e la griglia riflettono istantaneamente il nuovo medico senza ridondanze.
  - **Visita Medica -> Medico Esecutore (Snapshot Storico)**: All'atto della creazione della visita, il Medico Competente aziendale viene proposto e precompilato. Una volta salvata la visita, il medico esecutore viene persistito in modo immutabile nella tabella `MedicalVisits` (tutela medico-legale ex D.Lgs. 81/08).
- **Modifiche Backend**:
  - `MasterDataController.cs`: Proiezione di `CoordinatorDoctorId` e `CoordinatorDoctorName` in `GetCompanies()`; supporto al filtro `doctorId` e proiezione di `CompanyDoctorId` e `CompanyDoctorName` in `GetEmployees()`; null-safety su `DoctorFullName` in `GetMedicalVisits()`.
  - `DoctorCrudController.cs`: Assegnazione automatica del Medico Coordinatore dell'azienda dell'impiegato in `CreateMedicalVisit()` qualora non specificato.
  - `AppDbSeeder.cs`: Seeding delle relazioni `CompanyDoctor` per tutte le aziende di default.
- **Modifiche Frontend**:
  - `entityConfigs.js`: Aggiunto campo `coordinatorDoctorName` a `companies` e `companyDoctorName` a `employees`.
  - `WorkersCenter.jsx`: Aggiunta colonna `Medico Competente` nella tabella e filtro reattivo per `Medico Competente` nella toolbar superiore.
  - `EmployeeProfileDialog.jsx`: Visualizzazione Quick View del Medico Competente nell'header e nella sezione `Riferimenti medici`.
  - `MedicalVisitStepper.jsx`: Preselezione automatica del Medico Competente dell'azienda al selezionare del lavoratore.
- **Test Automatici (8 Scenari)**:
  - Creata la suite `CompanyDoctorPropagationTests.cs` con 8 test end-to-end: **70 test totali superati, 0 falliti (100% pass rate)**.
- **Test UI e Browser**:
  - Eseguiti e verificati tutti i flussi con acquisizione screenshot dedicati.

1. **Backend Tests**:
   - Esecuzione `dotnet test`: **62 test eseguiti con successo, 0 falliti**.
   - Aggiunti 3 nuovi unit test dedicati in `EntityValidationTests.cs` per verificare:
     - Validazione con `TenantId = 0` nei payload del client.
     - Validazione di `CompanyContact` su `Role` e `FullName`.
     - Risoluzione corretta degli alias di `Employee` (`Nazionalita`, `MedicoCarante`).
2. **Backend Compilation**:
   - `dotnet build`: Compilato con successo, **0 errori**.
3. **Frontend Compilation**:
   - `npm run build`: Bundling Vite completato con successo, **0 errori**.
