# Company Groups Redesign - Complete Design Specification

## 1. Group Dashboard (Capability #1)

### Aggregated KPIs per Group
- [x] companies count per group
- [x] branches count per group  
- [x] employees count per group
- [x] active protocols count per group
- [x] visits due per group
- [x] visits overdue per group
- [x] site visits due per group
- [x] nominations due per group
- [x] vaccination deadlines per group
- [x] compliance alerts per group

### Interface
```
GET /api/CompanyGroups/{id}/dashboard
Response:
{
  "id": 1,
  "name": "Gruppo Acme",
  "type": "Holding",
  "status": "Attivo",
  "companiesCount": 5,
  "employeesCount": 128,
  "activeProtocolsCount": 3,
  "visitsDue": 12,
  "visitsOverdue": 3,
  "siteVisitsDue": 7,
  "nominationsDue": 2,
  "vaccinationDeadlines": 5,
  "complianceAlerts": 0
}
```

## 2. Unified Deadlines (Capability #2)

### Unified View Across All Companies in Group
- Visit deadlines - view across all companies in the group
- Activity deadlines - view across all companies in the group
- Site visit deadlines - view across all companies in the group
- Nomination deadlines - view across all companies in the group
- Vaccination deadlines - view across all companies in the group

### Interface
```
GET /api/CompanyGroups/{id}/deadlines
Query params:
- type: visit|activity|site-visit|nomination|vaccination
- companyId?: filter by specific company (optional)
- physicianId?: filter by physician (optional)
- riskProfile?: filter by risk profile (optional)

Returns aggregated deadlines across group companies
```

## 3. Unified Workforce View (Capability #3)

### Features
- [x] viewing employees across all companies in group
- [x] filtering by company
- [x] filtering by physician
- [x] filtering by protocol
- [x] filtering by risk profile
- [x] filtering by status (active/inactive)
- [x] filtering by role (medico competente, collaboratore, coordinatore)

### Interface
```
GET /api/CompanyGroups/{id}/employees
Query params:
- companyId?: filter by specific company
- physicianId?: filter by physician Id
- protocolId?: filter by protocol Id
- riskProfile?: filter by risk profile
- status?: active|inactive|all

Returns: List of employee records with company context
```

## 4. Shared Clinical Governance (Capability #4)

### Group-Level Health & Safety Policies (D.Lgs 81/08 compliance)
- [x] Centralized risk factor management at group level
- [x] Protocol propagation settings (PropagateProtocols bool)
- [x] Doctor propagation settings (PropagateDoctors bool)
- [x] Visit schedule propagation (PropagateVisitSchedules bool)
- [x] Risk factor inheritance from group to companies
- [x] Doctor assignment at group level with roles

### Interface
```
POST /api/CompanyGroups/{id}/protocols
Body: Protocol assignment to group
- propagates to all companies in group if PropagateProtocols = true

GET /api/CompanyGroups/{id}/risk-factors
Returns: All risk factors assigned at group level

POST /api/CompanyGroups/{id}/doctors
Body: Doctor assignment with role (Coordinatore/MedicoCompetente/Collaboratore)
```

## 5. Group-level Billing (Capability #5)

### Features
- [x] Consolidated billing frequency configuration (BillingFrequency enum: Mensile/Trimestrale/Semestrale/Annuale/PerVisita)
- [x] Group-level billing configuration
- [x] Billing document generation per group
- [x] Shared financial reporting across companies

### Interface
```
GET /api/CompanyGroups/{id}/billing-config
POST /api/CompanyGroups/{id}/billing-config
Body: { billingFrequency: "Mensile" | "Trimestrale" | "Semestrale" | "Annuale" | "PerVisita" }

GET /api/CompanyGroups/{id}/billing-documents
Returns billing documents for the group
```

## 6. Acceptance Criteria (Summary)

### Functional Requirements
- **FR-001**: CompanyGroup entity must support Type (GroupType enum), Status (GroupStatus enum), and MembershipStatus enum
- **FR-002**: CompanyGroup must have PropagateProtocols, PropagateRiskFactors, PropagateDoctors, PropagateVisitSchedules, ConsolidatedBilling boolean flags
- **FR-003**: Group dashboard endpoint must return all 10 aggregated KPIs
- **FR-004**: Unified deadline view must aggregate across all companies in the group
- **FR-005**: Employee view must filter across group companies
- **FR-006**: Group must support risk factor assignment and propagation
- **FR-007**: Group must support doctor assignment with roles at group level
- **FR-008**: Group must support billing frequency configuration
- **FR-009**: All endpoints must be multi-tenant (TenantId aware)

### Technical Requirements
- **TR-001**: Database migration must preserve existing data (companies, users, protocols)
- **TR-002**: All new enums must have proper validation (RegularExpression for VATNumber, TaxCode)
- **TR-003**: EF Core model configuration in AppDbContext.OnModelCreating
- **TR-004**: API controllers with proper authorization (Admin + Doctor roles)
- **TR-005**: Frontend components must render group dashboard KPIs pixel-perfect
- **TR-006**: Tests must cover all new endpoints (unit + integration)

### Data Migration Notes
- Existing CompanyGroup records need Type default = Altro, Status default = Attivo
- New navigation properties: CompanyGroup → Companies (inverse), GroupRiskFactors, GroupDoctors
- Existing data must be backfilled with default enum values
- CompanyGroupId foreign keys added to GroupRiskFactor, GroupDoctor, GroupVisitSchedule entities (if they exist)

## 7. API Controller Design

### New Controller: CompanyGroupsController
Base route: `api/CompanyGroups`

Endpoints:
- `GET /` - List all groups for tenant
- `GET /{id}` - Get group by id with dashboard data
- `GET /{id}/dashboard` - Dashboard KPIs
- `GET /{id}/deadlines` - Unified deadlines view
- `GET /{id}/employees` - Unified workforce view
- `POST /{id}/protocols` - Assign protocols to group
- `POST /{id}/risk-factors` - Assign risk factors to group
- `POST /{id}/doctors` - Assign doctors to group with roles
- `GET /{id}/billing-config` - Get billing config
- `POST /{id}/billing-config` - Set billing config
- `GET /{id}/companies` - List companies in group

## 8. Frontend Component Design

### New Components (medwork-frontend/src/components/)
- `CompanyGroupDashboard.jsx` - KPI cards grid
- `CompanyGroupDeadlines.jsx` - Unified deadline list
- `CompanyGroupEmployees.jsx` - Employee table with filters
- `CompanyGroupSettings.jsx` - Group configuration (type, propagation, billing)
- `GroupRiskFactorsForm.jsx` - Risk factor assignment form
- `GroupDoctorsForm.jsx` - Doctor assignment with roles

### Page Integration
- Update existing group page to use new dashboard layout
- Add navigation to group details with unified views
- Preserve backward compatibility where possible

## 9. Test Coverage Plan

### Unit Tests (MedWork.Api.Tests)
- CompanyGroup model validation tests
- GroupType/GroupStatus/MembershipStatus enum validation
- CompanyGroup dashboard data calculations
- Group risk factor propagation logic
- Group doctor role assignment validation

### Integration Tests
- API endpoint tests for all CompanyGroups endpoints
- Dashboard KPI aggregation tests
- Deadline unification across companies
- Employee filtering across group companies
- Billing configuration CRUD tests

### Scenario Tests (Playwright)
- Group dashboard renders all KPIs
- Unified deadlines view shows data from all group companies
- Employee filtering by company/physician/protocol works across group
- Group settings propagation toggles work correctly
- Billing frequency configuration persists and affects reports