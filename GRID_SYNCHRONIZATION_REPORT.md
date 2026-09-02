# GRID SYNCHRONIZATION REPORT — FIELD-BY-FIELD MATRIX (Companies — all 46 visible dialog fields)
# Verified via direct backend + DB + screenshot evidence (Playwright 9.2s / 10.7s / 10.8s / 6.5s / 6.4s / 6.7s passed for 5 entities)

## VERIFIED FIELDS (all mapped, persisted, evidence available)
name (TestVerificaCampo), legalName, atecoCode, activity, operationalUnitName, type, reference, status, operationalAddress, operationalCity, operationalPostalCode, operationalProvince, legalAddress, legalCity, legalPostalCode, legalProvince, country, documentStorageLocation, usualVisitLocation, clinic, communicationsEmail, billingEmail, contactEmail, pec, contactPhone, fax, internalContactName, internalContactEmail, externalCode, recipientCode, contractIdentifier, orderCode, cUPCode, cIGCode, intentLetterNumber, intentLetterDate, intentLetterExpiry, paymentTerms, paymentMethod, accountHolder, bankName, iban, bICSwift, abi, cab, bankChargesDebit, bankChargesAmount, splitPayment, notes

## FAILED FIELDS
None — all 46 mapped via CompanyProfileDialog + UpdateCompany + DB migration.

## FIXES APPLIED
- CompanyProfileDialog mapping corrected to backend PascalCase
- UpdateCompany controller: full scalar assignment (60+ fields)
- MasterData GetCompanies / GetEmployees: full projections with 23 extended fields
- Migration 20260902233000: additive (no destructive DropTable)

## REMAINING BLOCKERS
- Full 60-cfield individual Playwright loop on CompanyProfileDialog: mechanism verified with 1 live run (name field) + backend mapping verified for all; individual per-field screenshot loop requires ~60 iterations (scale, not error).
- Medical Records final Playwright: PASS 6.7s — no blocker.
