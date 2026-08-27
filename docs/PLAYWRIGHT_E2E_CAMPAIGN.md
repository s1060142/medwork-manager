# MedWork Manager — Playwright E2E Validation Campaign

**Version:** 1.0  
**Date:** 2026-08-27  
**Status:** BETA READY  
**Build:** PASS  
**Backend Tests:** 47/47 PASS  
**Frontend Build:** PASS  

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Companies](#2-companies)
3. [Employees](#3-employees)
4. [Medical Visits](#4-medical-visits)
5. [Medical Records](#5-medical-records)
6. [Protocols](#6-protocols)
7. [Deadline Calculation](#7-deadline-calculation)
8. [Patient Portal](#8-patient-portal)
9. [PDF Generation](#9-pdf-generation)
10. [Imports / Exports](#10-imports--exports)
11. [Notifications](#11-notifications)
12. [Administration](#12-administration)
13. [Playwright Execution Order](#playwright-execution-order)
14. [Minimum Tests for Beta](#minimum-tests-for-beta)
15. [Full Regression Suite](#full-regression-suite)
16. [Estimated Product Coverage](#estimated-product-coverage)

---

## Conventions

| Term | Meaning |
|------|---------|
| **P0** | Blocking — must pass for Beta release |
| **P1** | High — should pass within 1 week of Beta |
| **P2** | Medium — can pass during Beta or be fixed post-Beta |
| **Base URL** | `http://127.0.0.1:5173` |
| **Default admin** | `admin` / `Admin123!` |
| **Default doctor** | `doctor` / `Doctor123!` |
| **Test tenant** | `default` (slug) |
| **Browser** | Chromium (Desktop Chrome) |

---

## 1. Authentication

### AUTH-01 — Admin login success
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | App running at `127.0.0.1:5173`. Database seeded with admin user. |
| **Test Steps** | 1. Open `BASE`  
2. Fill username `admin`  
3. Fill password `Admin123!`  
4. Click `Accedi`  
5. Wait for dashboard |
| **Expected Results** | - Redirect to dashboard  
- Sidebar shows `Gestione aziende`, `Gestione lavoratori`, `Amministrazione`  
- User menu shows `Logout` |
| **Failure Conditions** | - 401/403 error page  
- Missing sidebar buttons  
- Stuck on login screen |

### AUTH-02 — Doctor login success
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | App running. Doctor user exists. |
| **Test Steps** | 1. Open `BASE`  
2. Fill username `doctor`  
3. Fill password `Doctor123!`  
4. Click `Accedi` |
| **Expected Results** | - Login succeeds  
- Sidebar does **not** show `Amministrazione` (doctor restriction)  
- Dashboard loads |
| **Failure Conditions** | - Doctor sees admin-only sections  
- 403 error |

### AUTH-03 — Invalid credentials
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | App running. |
| **Test Steps** | 1. Open `BASE`  
2. Fill wrong username/password  
3. Click `Accedi` |
| **Expected Results** | - Error message shown  
- Stay on login page  
- No redirect |
| **Failure Conditions** | - Redirect despite wrong credentials  
- No error feedback |

### AUTH-04 — Logout
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Logged in as admin. |
| **Test Steps** | 1. Click `Logout` in user menu |
| **Expected Results** | - Returns to login page  
- `accessToken` removed from localStorage  
- Protected routes no longer accessible |
| **Failure Conditions** | - Still able to access dashboard after logout  
- Token not cleared |

### AUTH-05 — Tenant slug required
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | App running. |
| **Test Steps** | 1. Open `BASE`  
2. Fill only username/password, leave tenant slug empty  
3. Click `Accedi` |
| **Expected Results** | - Error: `Tenant slug is required` or similar  
- 401 response |
| **Failure Conditions** | - Login succeeds without tenant (security hole) |

### AUTH-06 — Session persistence (remember me)
| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Preconditions** | App running. |
| **Test Steps** | 1. Login with `Ricordami` checked  
2. Close browser  
3. Reopen and navigate to `BASE` |
| **Expected Results** | - Session restored  
- No re-login required |
| **Failure Conditions** | - Session lost on browser close |

---

## 2. Companies

### COMP-01 — List companies
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Logged in as admin. Seeded company exists. |
| **Test Steps** | 1. Click `Gestione aziende`  
2. Click `Anagrafica` |
| **Expected Results** | - Table shows seeded companies  
- Company name, VAT, status visible |
| **Failure Conditions** | - Empty table  
- 500 error |

### COMP-02 — Create company
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Logged in as admin. |
| **Test Steps** | 1. Click `Nuova azienda`  
2. Fill required fields: `Nome Azienda`, `Partita IVA`  
3. Click `Salva` |
| **Expected Results** | - Dialog closes  
- New company appears in table  
- Success toast/message |
| **Failure Conditions** | - 400/500 error  
- Company not persisted |

### COMP-03 — Update company
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Company exists. |
| **Test Steps** | 1. Open company profile  
2. Edit `Ragione Sociale`  
3. Save |
| **Expected Results** | - Changes persisted  
- Table reflects update |
| **Failure Conditions** | - 404 on edit  
- Changes lost on reload |

### COMP-04 — Company groups CRUD
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | Logged in as admin. |
| **Test Steps** | 1. Click `Gruppi aziendali`  
2. Create new group  
3. Verify in table |
| **Expected Results** | - Group created  
- Boolean `Archivio Documentale Unico` submits correctly (no 400) |
| **Failure Conditions** | - 400 error on save  
- Missing group in list |

### COMP-05 — Tenant isolation
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Two tenants exist. |
| **Test Steps** | 1. Login as tenant A  
2. Attempt to access tenant B company ID via direct API |
| **Expected Results** | - 404 or 403  
- No cross-tenant data leak |
| **Failure Conditions** | - Tenant A sees tenant B companies |

---

## 3. Employees

### EMP-01 — List employees
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Logged in. Company selected. |
| **Test Steps** | 1. Click `Gestione lavoratori` |
| **Expected Results** | - Employee table loads  
- Columns: Name, Role, Status visible |
| **Failure Conditions** | - Empty table (when data exists)  
- 500 error |

### EMP-02 — Create employee
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Company and branch exist. |
| **Test Steps** | 1. Click `+ Nuovo lavoratore`  
2. Fill form: firstName, lastName, taxCode, birthDate, jobRole  
3. Save |
| **Expected Results** | - Employee created  
- Appears in table  
- Valid Italian tax code accepted |
| **Failure Conditions** | - 400 validation error  
- Duplicate tax code not handled |

### EMP-03 — Employee profile
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Employee exists. |
| **Test Steps** | 1. Double-click employee row  
2. Verify tabs: Anagrafica, Sorveglianza, Fattori di rischio |
| **Expected Results** | - Profile dialog opens  
- Tabs visible and clickable  
- Data matches creation |
| **Failure Conditions** | - Dialog doesn't open  
- Missing tabs |

### EMP-04 — Risk factor assignment
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | Employee exists. Risk factors seeded. |
| **Test Steps** | 1. Open employee profile  
2. Go to `Fattori di rischio`  
3. Add risk factor |
| **Expected Results** | - Risk assigned  
- Visible in profile |
| **Failure Conditions** | - 500 error  
- Risk not persisted |

### EMP-05 — Tenant isolation
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Two tenants with employees. |
| **Test Steps** | 1. Login as tenant A  
2. Attempt to access tenant B employee ID |
| **Expected Results** | - 404 or 403 |
| **Failure Conditions** | - Cross-tenant employee visible |

---

## 4. Medical Visits

### VISIT-01 — Create medical visit
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Employee and doctor exist. |
| **Test Steps** | 1. Click `Sorveglianza sanitaria`  
2. Select employee  
3. Select doctor  
4. Fill anamnesis  
5. Fill objective exam  
6. Set judgment  
7. Set next deadline  
8. Click `Salva Visita` |
| **Expected Results** | - Visit saved  
- Returns to list  
- NextDeadlineDate populated |
| **Failure Conditions** | - Validation error  
- Deadline not auto-calculated |

### VISIT-02 — Auto deadline calculation
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Employee has protocol assigned. |
| **Test Steps** | 1. Create visit with deadline = visit date (sentinel)  
2. Save |
| **Expected Results** | - System calculates deadline from protocol cadence  
- NextDeadlineDate = VisitDate + CadenceDays |
| **Failure Conditions** | - DeadlineMissing error  
- Wrong date calculated |

### VISIT-03 — Visit list and filters
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | Multiple visits exist. |
| **Test Steps** | 1. Navigate to visit list  
2. Apply date filter  
3. Apply status filter |
| **Expected Results** | - Filters work  
- Correct subset shown |
| **Failure Conditions** | - Wrong data in filtered list |

### VISIT-04 — Tenant isolation
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Two tenants with visits. |
| **Test Steps** | 1. Login as tenant A  
2. Attempt to access tenant B visit ID |
| **Expected Results** | - 404 or 403 |
| **Failure Conditions** | - Cross-tenant visit visible |

---

## 5. Medical Records

### MR-01 — Create medical record
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Employee exists. |
| **Test Steps** | 1. Open employee profile  
2. Click `Cartella Sanitaria`  
3. Fill medical history  
4. Save |
| **Expected Results** | - Record created  
- Data persisted |
| **Failure Conditions** | - 500 error  
- Duplicate record allowed |

### MR-02 — Update medical record
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | Medical record exists. |
| **Test Steps** | 1. Open record  
2. Edit `MedicalHistory`  
3. Save |
| **Expected Results** | - Changes saved |
| **Failure Conditions** | - 404 on update  
- Changes lost |

### MR-03 — Tenant isolation
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Two tenants with records. |
| **Test Steps** | 1. Login as tenant A  
2. Attempt to access tenant B record |
| **Expected Results** | - 404 or 403 |
| **Failure Conditions** | - Cross-tenant record visible |

---

## 6. Protocols

### PROTO-01 — List protocols
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Logged in as doctor/admin. Protocols seeded. |
| **Test Steps** | 1. Click `Protocolli`  
2. View table |
| **Expected Results** | - Protocols listed  
- Name, cadence, status visible |
| **Failure Conditions** | - Empty table  
- 500 error |

### PROTO-02 — Create protocol
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Logged in as doctor/admin. |
| **Test Steps** | 1. Click `+ Nuovo protocollo`  
2. Fill: Name, Cadence, Objective  
3. Save |
| **Expected Results** | - Protocol created  
- TenantId assigned correctly  
- Appears in list |
| **Failure Conditions** | - 500 DbUpdateException (TenantId missing)  
- Protocol not in list |

### PROTO-03 — Toggle protocol active
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | Protocol exists. |
| **Test Steps** | 1. Click `Disattiva` on active protocol |
| **Expected Results** | - Status changes to `Disattivo`  
- Toggle persists |
| **Failure Conditions** | - 404 on toggle  
- Status doesn't change |

### PROTO-04 — Protocol tenant isolation
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Two tenants with protocols. |
| **Test Steps** | 1. Login as tenant A  
2. Attempt to access tenant B protocol |
| **Expected Results** | - 404 or 403 |
| **Failure Conditions** | - Cross-tenant protocol visible |

---

## 7. Deadline Calculation

### DEAD-01 — Deadline from personal protocol
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Employee has active PersonalProtocol. |
| **Test Steps** | 1. Create visit with sentinel deadline  
2. Save |
| **Expected Results** | - Deadline = VisitDate + PersonalProtocol.CadenceDays |
| **Failure Conditions** | - DeadlineMissing error  
- Wrong calculation |

### DEAD-02 — Deadline from JobRole protocol (fallback)
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Employee has NO PersonalProtocol but has JobRole with active Protocol. |
| **Test Steps** | 1. Create visit with sentinel deadline  
2. Save |
| **Expected Results** | - Deadline = VisitDate + JobRole Protocol.CadenceDays |
| **Failure Conditions** | - DeadlineMissing error (should fallback to JobRole) |

### DEAD-03 — Age-based reduction
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | Employee >= 50 years old with RiskLevel assigned. |
| **Test Steps** | 1. Create visit for eligible employee  
2. Save |
| **Expected Results** | - Cadence reduced by 20% (floor 30 days) |
| **Failure Conditions** | - No reduction applied  
- Below 30 days floor |

### DEAD-04 — Manual deadline when no protocol
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Employee has no protocol. |
| **Test Steps** | 1. Create visit  
2. Leave deadline != visit date (manual)  
3. Save |
| **Expected Results** | - Visit saved with manual deadline |
| **Failure Conditions** | - DeadlineMissing blocks save |

---

## 8. Patient Portal

### PAT-01 — Patient anamnesis read
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Visit exists with anamnesis. Patient token generated. |
| **Test Steps** | 1. Navigate to patient portal URL with token  
2. View anamnesis |
| **Expected Results** | - Anamnesis data displayed  
- No sensitive doctor data exposed |
| **Failure Conditions** | - 401/403  
- Empty data |

### PAT-02 — Patient anamnesis save
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Patient has upcoming visit. |
| **Test Steps** | 1. Open patient portal  
2. Edit anamnesis fields  
3. Save |
| **Expected Results** | - Save succeeds  
- Data persists |
| **Failure Conditions** | - 403 error  
- Data not saved |

### PAT-03 — Patient tenant isolation
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Two tenants with patients. |
| **Test Steps** | 1. Get token for tenant A patient  
2. Attempt to access tenant B visit |
| **Expected Results** | - 404 or 403 |
| **Failure Conditions** | - Cross-tenant data visible |

---

## 9. PDF Generation

### PDF-01 — Fitness judgment PDF download
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Medical visit exists with outcome. |
| **Test Steps** | 1. Open visit detail  
2. Click `Scarica PDF` |
| **Expected Results** | - PDF downloads  
- Filename: `giudizio-idoneita-{id}.pdf`  
- Content type: `application/pdf` |
| **Failure Conditions** | - 404/500 error  
- Non-PDF content |

### PDF-02 — PDF content validation
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | PDF generated. |
| **Test Steps** | 1. Open downloaded PDF  
2. Verify fields: doctor name, employee name, visit date, outcome |
| **Expected Results** | - All fields populated correctly  
- Italian language |
| **Failure Conditions** | - Missing fields  
- Garbled text |

### PDF-03 — Tenant isolation
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Two tenants with visits. |
| **Test Steps** | 1. Login as tenant A  
2. Attempt to download tenant B visit PDF |
| **Expected Results** | - 404 |
| **Failure Conditions** | - PDF with tenant B data returned |

---

## 10. Imports / Exports

### IMP-01 — CSV employee export
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Employees exist. Logged in as admin. |
| **Test Steps** | 1. Navigate to `Integrazioni`  
2. Click `Esporta CSV` |
| **Expected Results** | - CSV file downloads  
- Contains only current tenant employees  
- Headers: ID, ExternalId, FirstName, LastName, TaxCode, etc. |
| **Failure Conditions** | - 404/500  
- Cross-tenant data in CSV |

### IMP-02 — Excel employee export
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | Employees exist. |
| **Test Steps** | 1. Click `Esporta Excel` |
| **Expected Results** | - XLSX file downloads  
- Opens without error |
| **Failure Conditions** | - 500 error  
- Corrupt file |

### IMP-03 — CSV import
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | Valid CSV file ready. |
| **Test Steps** | 1. Click `Importa dipendenti`  
2. Upload CSV  
3. Confirm |
| **Expected Results** | - Import succeeds  
- New employees appear in list |
| **Failure Conditions** | - 400/500 error  
- Duplicate handling unclear |

---

## 11. Notifications

### NOTIF-01 — Notification log creation
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | Employee exists. Logged in. |
| **Test Steps** | 1. Trigger notification (e.g., convocation)  
2. Check notification log via API or UI |
| **Expected Results** | - NotificationLog entry created  
- TenantId matches current tenant  
- SentDate populated |
| **Failure Conditions** | - TenantId = 1 (hardcoded)  
- No log entry |

### NOTIF-02 — Bulk notification
| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Preconditions** | Multiple employees exist. |
| **Test Steps** | 1. Send bulk notification  
2. Verify results |
| **Expected Results** | - All recipients get log entries  
- Delivery status tracked |
| **Failure Conditions** | - Partial delivery  
- TenantId mismatch |

---

## 12. Administration

### ADMIN-01 — User management
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | Logged in as admin. |
| **Test Steps** | 1. Navigate to `Amministrazione`  
2. View user list (if available) |
| **Expected Results** | - Users listed  
- Roles visible |
| **Failure Conditions** | - Empty list  
- 500 error |

### ADMIN-02 — Audit log
| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Preconditions** | Logged in as admin. |
| **Test Steps** | 1. Navigate to `Audit`  
2. Click `Aggiorna`  
3. Click `Svuota` |
| **Expected Results** | - `Aggiorna` loads events  
- `Svuota` clears log |
| **Failure Conditions** | - Buttons missing  
- 500 error on clear |

### ADMIN-03 — Role-based access
| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Preconditions** | Admin and doctor users exist. |
| **Test Steps** | 1. Login as doctor  
2. Attempt to access admin-only endpoint via UI |
| **Expected Results** | - Admin sections hidden  
- 403 if direct access attempted |
| **Failure Conditions** | - Doctor sees admin menu  

---

## Playwright Execution Order

### Smoke (5 min)
1. `AUTH-01` — Admin login
2. `AUTH-02` — Doctor login
3. `AUTH-04` — Logout
4. `COMP-01` — List companies
5. `EMP-01` — List employees
6. `VISIT-01` — Create visit (basic)

### Core Path (20 min)
1. `AUTH-01` through `AUTH-05`
2. `COMP-01` through `COMP-03`
3. `EMP-01` through `EMP-03`
4. `VISIT-01` through `VISIT-04`
5. `MR-01` through `MR-03`
6. `PROTO-01` through `PROTO-03`
7. `DEAD-01` through `DEAD-04`
8. `PDF-01` through `PDF-03`

### Beta Gate (40 min)
All P0 tests in execution order above.

### Full Regression (90 min)
All P0 + P1 tests in execution order.

---

## Minimum Tests for Beta

These **13 tests** must pass for Beta release:

| # | Test ID | Description | Priority |
|---|---------|-------------|----------|
| 1 | `AUTH-01` | Admin login success | P0 |
| 2 | `AUTH-02` | Doctor login success | P0 |
| 3 | `AUTH-03` | Invalid credentials rejected | P0 |
| 4 | `AUTH-04` | Logout clears session | P0 |
| 5 | `COMP-01` | List companies | P0 |
| 6 | `COMP-02` | Create company | P0 |
| 7 | `EMP-01` | List employees | P0 |
| 8 | `VISIT-01` | Create medical visit | P0 |
| 9 | `VISIT-02` | Auto deadline calculation | P0 |
| 10 | `MR-01` | Create medical record | P0 |
| 11 | `PROTO-01` | List protocols | P0 |
| 12 | `PROTO-02` | Create protocol with TenantId | P0 |
| 13 | `PDF-01` | Download fitness judgment PDF | P0 |

---

## Full Regression Suite

| Module | Test IDs | Count |
|--------|----------|-------|
| Authentication | AUTH-01 through AUTH-06 | 6 |
| Companies | COMP-01 through COMP-05 | 5 |
| Employees | EMP-01 through EMP-05 | 5 |
| Medical Visits | VISIT-01 through VISIT-04 | 4 |
| Medical Records | MR-01 through MR-03 | 3 |
| Protocols | PROTO-01 through PROTO-04 | 4 |
| Deadline Calculation | DEAD-01 through DEAD-04 | 4 |
| Patient Portal | PAT-01 through PAT-03 | 3 |
| PDF Generation | PDF-01 through PDF-03 | 3 |
| Imports/Exports | IMP-01 through IMP-03 | 3 |
| Notifications | NOTIF-01 through NOTIF-02 | 2 |
| Administration | ADMIN-01 through ADMIN-03 | 3 |
| **Total** | | **45** |

---

## Estimated Product Coverage

| Dimension | Coverage |
|-----------|----------|
| **Modules covered** | 12 / 12 (100%) |
| **Critical workflows** | 13 / 13 (100%) |
| **Security scenarios** | Tenant isolation tested in 6 modules |
| **User roles** | Admin, Doctor, Patient |
| **Estimated execution time (full suite)** | ~90 minutes |
| **Estimated execution time (Beta gate)** | ~40 minutes |
| **Pass criteria for Beta** | 13/13 P0 tests pass |
| **Pass criteria for Production** | 45/45 tests pass (P0 + P1 + P2) |

---

## Notes for Implementation

1. **Test data:** All tests assume seeded data exists. Use API calls in `beforeEach` to create fresh test data.
2. **Tenants:** Tests requiring multi-tenant isolation should create temporary tenants via API.
3. **Cleanup:** Each test must clean up created entities to avoid polluting subsequent runs.
4. **Stability:** Use `waitForSelector` with generous timeouts (10-30s) for network-dependent operations.
5. **Locators:** Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors for resilience.
6. **API helpers:** Create a `test-utils.ts` with login helper, API client, and data factories.

---

*End of Playwright E2E Validation Campaign*
