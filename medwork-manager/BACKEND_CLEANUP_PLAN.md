# Backend Cleanup Plan - MedWork.Api

## Analysis Summary

Based on analysis of `app-spec.md` and the backend codebase, here's what needs to be cleaned up:

### Models to REMOVE (Not used in controllers/services, legacy/unused):
1. **Legacy Models** (10 files) - All reference `LegacyEmployee` which doesn't exist in DbContext:
   - `LegacyEmployee.cs`
   - `LegacyAccident.cs`
   - `LegacyAllergy.cs`
   - `LegacyCarcinogen.cs`
   - `LegacyOccupationalDisease.cs`
   - `LegacyPreviousJob.cs`
   - `LegacyProtection.cs`
   - `LegacyRisk.cs`
   - `LegacySubstanceAbuse.cs`
   - `LegacyVaccination.cs`

2. **Visit Detail Models** (32 files) - Not used in any controller/service:
   - `VisitAccident.cs`
   - `VisitAllergy.cs`
   - `VisitAudio.cs`
   - `VisitAudit.cs`
   - `VisitCarcinogen.cs`
   - `VisitCeca.cs`
   - `VisitCovid.cs`
   - `VisitDiarPri.cs`
   - `VisitDisability.cs`
   - `VisitDisNas.cs`
   - `VisitDrugTest.cs`
   - `VisitFamilyHistory.cs`
   - `VisitInjury.cs`
   - `VisitOccupationalDisease.cs`
   - `VisitOutcomeA3B.cs`
   - `VisitPersonalHistory.cs`
   - `VisitPreviousJob.cs`
   - `VisitProtection.cs`
   - `VisitQuestionAge.cs`
   - `VisitQuestionMusSch.cs`
   - `VisitQuestionNote.cs`
   - `VisitQuestionVdt.cs`
   - `VisitRadIon.cs`
   - `VisitReportTra.cs`
   - `VisitRisk.cs`
   - `VisitSonOsas.cs`
   - `VisitSpine.cs`
   - `VisitSpirometry.cs`
   - `VisitSubstanceAbuse.cs`
   - `VisitTitmus.cs`
   - `VisitUpperLimb.cs`
   - `VisitVaccination.cs`
   - `VisitVestibular.cs`
   - `VisitVisioTest.cs`
   - `VisitVmDrugs.cs`

3. **Report/Mapping Models** (8 files) - Not used:
   - `MansioniEsamiScadenze.cs`
   - `MansioniRischi.cs`
   - `MansioniVaccinazioni.cs`
   - `ReportJobRoleExams.cs`
   - `ReportJobRoleProtocols.cs`
   - `ReportJobRoleRisks.cs`
   - `ReportJobRoleVaccinations.cs`
   - `ReportMansioni.cs`

4. **Unused Supporting Models** (16 files):
   - `Incaricati.cs`
   - `SafetyDto.cs`
   - `TableLock.cs`
   - `HrDto.cs`
   - `Vaccine.cs` (use Vaccination instead)
   - `EmployeeCountHistory.cs`
   - `EmployeeExpiry.cs`
   - `EmployeeExpiryDetail.cs`
   - `ExportLog.cs`
   - `FileUsage.cs`
   - `Municipality.cs`
   - `Nation.cs`
   - `OccupationalDiseaseDm.cs`
   - `Personalization.cs`
   - `PrintOptions.cs`
   - `Province.cs`
   - `Referent.cs`
   - `Region.cs`

### Models to KEEP (Used in controllers/services):
- Core: `Company`, `Branch`, `Employee`, `Doctor`, `Department`, `WorkLocation`, `SiteVisit`, `CompanyContact`, `CompanyGroup`, `CompanyPerson`, `CompanyService`, `JobRole`
- Medical: `MedicalVisit`, `MedicalRecord`, `Anamnesis`, `VisitExam`, `ExamType`, `ScheduledExam`, `Vaccination`, `DoctorAvailability`
- Risk: `RiskFactor`, `EmployeeRisk`, `JobRoleRiskFactor`, `Protocol`, `PersonalProtocol`, `RiskAssessment`
- PPE: `Ppe`, `EmployeePpe`, `JobRolePpe`
- Documents: `Attachment`
- Injuries: `Injury`, `InjuryAttachment`, `InjuryDetail`
- Billing: `ElectronicInvoice`, `ElectronicInvoiceLine`, `SdiConfiguration`, `ElectronicInvoiceLog`, `SdiNotificationLog`, `PriceList`, `Quote`
- Devices: `DiagnosticDevice`, `DeviceExamLog`, `DeviceParserConfig`
- Signatures: `GraphicSignature`
- Cardiology: `CardiologistReport`, `Hl7Message`, `LisConfiguration`
- Auth: `AppUser`, `AuditLog`, `NotificationLog`
- Enums: `DomainEnums.cs`
- Master Data: `AtecoCode`

### Models to ADD (Missing per app-spec):
1. **Worker Status/Idoneità tracking** - Need to add to Employee or create FitnessOutcome entity
2. **Accreditation/Scadenzario entities** - For deadline tracking
3. **Listino/PriceList items** - Already have PriceList but need line items
4. **Availability slots** - Already have DoctorAvailability
5. **Laboratory accreditation** - New entity needed
6. **Health record export tracking** - New entity needed
7. **Activity/Task tracking** - For dashboard activities

### DbContext Cleanup:
- Remove DbSet references for deleted models
- Remove navigation properties from MedicalVisit for deleted Visit* models
- Remove OnModelCreating configurations for deleted models

### Migration:
- Create migration to drop tables for deleted entities
- Update existing tables as needed

## Task Progress

- [x] 1. Delete Legacy models (10 files)
- [x] 2. Delete Visit detail models (32 files)
- [x] 3. Delete Report/Mapping models (8 files)
- [x] 4. Delete Unused supporting models (16 files)
- [x] 5. Update MedicalVisit.cs - remove navigation properties to deleted models
- [x] 6. Update AppDbContext.cs - remove DbSets and configurations for deleted models, add new entities
- [x] 7. Update Employee.cs - add fitness/idoneità status fields
- [x] 8. Create new entities for missing features (Accreditation, LabAccreditation, HealthRecordExport, Activity)
- [x] 9. Fix broken references (Branch, RiskFactor, JobRoleVaccination, HR DTOs, Safety DTOs)
- [x] 10. Build - SUCCESS
- [x] 11. Create and run migration
- [x] 12. Run tests (7 pre-existing failures unrelated to cleanup)
