# Company Groups UI Validation - Confirmed Functional Blockers

## CONFIRMED BLOCKERS

### B1. Add Doctor payload - roleInGroup property and enum value mismatch
Severity: BLOCKER
File: medwork-frontend/src/components/CompanyGroupsCenter.jsx lines 372-375
Backend: MedWork.Api/Controllers/CompanyGroupsController.cs line 1879
Problem: roleInGroup != Role property; display strings != C# enum names

### B2. bulk-plan-campaign - missing critical request fields
Severity: BLOCKER
File: medwork-frontend/src/components/CompanyGroupsCenter.jsx line 267
Problem: Sends {title,startDate,endDate,notes}; needs {Title,CompanyIds,ProtocolId,TargetMonths}

### B3. bulk-plan-site-visits - missing required fields
Severity: BLOCKER
File: medwork-frontend/src/components/CompanyGroupsCenter.jsx lines 281-284
Problem: Sends {scheduledDate,doctorId,notes}; needs {CompanyIds,TargetDate,Structure,Notes}

## ALREADY RESOLVED (in current tracked diff)

### R1. apiSend argument order - 11 calls fixed in CompanyGroupsCenter.jsx
### R2. Login tenant context - App.tsx:365, LoginCard.jsx:61
### R3. DELETE argument order - CompanyGroupsCenter.jsx:357, 389
