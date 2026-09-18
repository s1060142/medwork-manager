# Company Groups UI Validation - Confirmed Functional Blockers

## CONFIRMED BLOCKERS

### B1. Add Doctor payload: roleInGroup key and value mismatch
Severity: BLOCKER
File: medwork-frontend/src/components/CompanyGroupsCenter.jsx lines 372-375
Fix: Change roleInGroup to Role in payload. Change MenuItem values to match C# enum names.

### B2. bulk-plan-campaign: missing critical request fields
Severity: BLOCKER
File: CompanyGroupsCenter.jsx line 267
Fix: Remap payload to match BulkPlanCampaignRequest. Add CompanyIds/ProtocolId/TargetMonths to dialog.

### B3. bulk-plan-site-visits: missing required fields
Severity: BLOCKER
File: CompanyGroupsCenter.jsx lines 281-284
Fix: Remap payload to match BulkPlanSiteVisitsRequest. Add CompanyIds/Structure to dialog.


## Objective
Minimal fix plan for confirmed functional blockers preventing Company Groups UI from functioning against backend contracts.

## ALREADY RESOLVED (in current tracked diff)

- R1: apiSend argument order fixed in all 11 calls in CompanyGroupsCenter.jsx
- R2: Login tenant context propagated via App.tsx:365 and LoginCard.jsx:61
- R3: DELETE argument order fixed at CompanyGroupsCenter.jsx:357, 389

## CONFIRMED CORRECT - no fix needed

- Compliance action keys: nominate-doctor, plan-visit, create-record verified matching between backend and frontend
- Add/Remove company and doctor routes match backend controller signatures
- Create group payload matches CompanyGroup model

## OPTIONAL (non-blockers)

- O1: Remove ambulatory field from bulk-plan-visits payload (cosmetic, silently ignored)
- O2: Expand company-groups-ui-validation.spec.ts with persistence/CRUD coverage
- O3: Update App.test.jsx:17 authLogin mock with tenantId/tenantSlug

## Test Strategy (post-fix)

1. Doctor assignment: verify POST payload has Role key with valid enum value
2. Campaign persistence: execute, reload, verify in deadlines view
3. Site visit persistence: execute, reload, verify in site visits tab
4. Bulk visits: select candidates, execute, verify created visits
5. Compliance remediation: trigger each action, verify toast and data change
6. Membership CRUD: add/remove companies and doctors, verify persistence
7. Group creation: create group, verify list and navigation
8. Login tenant flow: verify tenantId in localStorage after login
