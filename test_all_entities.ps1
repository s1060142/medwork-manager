# Script di test completo di tutte le entita MedWork Manager
$baseUrl = "http://127.0.0.1:5279"

# 1. Login Admin
$adminLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"admin","password":"Admin123!","tenantSlug":"default"}'
$adminToken = $adminLogin.accessToken
$adminHeaders = @{ Authorization = "Bearer $adminToken"; "X-Tenant-Slug" = "default" }

# 2. Login Doctor
$doctorLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"doctor","password":"Doctor123!","tenantSlug":"default"}'
$doctorToken = $doctorLogin.accessToken
$doctorHeaders = @{ Authorization = "Bearer $doctorToken"; "X-Tenant-Slug" = "default" }

$results = [System.Collections.Generic.List[PSCustomObject]]::new()

function Run-Test {
    param(
        [string]$Name,
        [string]$ReadUrl,
        [string]$CreateUrl,
        [string]$UpdateUrl,
        [string]$DeleteUrl,
        [hashtable]$Headers,
        [scriptblock]$CreatePayloadBuilder,
        [scriptblock]$UpdatePayloadBuilder
    )

    $item = [PSCustomObject]@{
        Entity = $Name
        Read = "PENDING"
        Create = "PENDING"
        Update = "PENDING"
        Delete = "PENDING"
        Status = "FAIL"
        Error = ""
    }

    try {
        # Test Read
        $list = Invoke-RestMethod -Uri "$baseUrl$ReadUrl" -Method Get -Headers $Headers
        $count = if ($list -is [System.Array]) { $list.Count } else { 1 }
        $item.Read = "OK ($count rec)"

        # Test Create
        $createPayload = & $CreatePayloadBuilder $list
        if ($createPayload) {
            $json = $createPayload | ConvertTo-Json -Depth 5
            $created = Invoke-RestMethod -Uri "$baseUrl$CreateUrl" -Method Post -Headers $Headers -ContentType "application/json" -Body $json
            $createdId = $created.id
            if (-not $createdId -and $created.employeeId -and $created.riskFactorId) { 
                $createdId = "$($created.employeeId)/$($created.riskFactorId)" 
            }
            $item.Create = "OK (Id: $createdId)"

            # Test Update
            if ($UpdateUrl -and $createdId) {
                $updatePayload = & $UpdatePayloadBuilder $created
                if ($updatePayload) {
                    $updJson = $updatePayload | ConvertTo-Json -Depth 5
                    $resolvedUpdateUrl = if ($UpdateUrl.Contains("{id}")) { $UpdateUrl.Replace("{id}", $createdId.ToString()) } else { "$UpdateUrl/$createdId" }
                    $updated = Invoke-RestMethod -Uri "$baseUrl$resolvedUpdateUrl" -Method Put -Headers $Headers -ContentType "application/json" -Body $updJson
                    $item.Update = "OK"
                } else {
                    $item.Update = "SKIPPED"
                }
            } else {
                $item.Update = "N/A"
            }

            # Test Delete
            if ($DeleteUrl -and $createdId) {
                $resolvedDeleteUrl = if ($DeleteUrl.Contains("{id}")) { $DeleteUrl.Replace("{id}", $createdId.ToString()) } else { "$DeleteUrl/$createdId" }
                Invoke-RestMethod -Uri "$baseUrl$resolvedDeleteUrl" -Method Delete -Headers $Headers
                $item.Delete = "OK"
            } else {
                $item.Delete = "N/A"
            }
            $item.Status = "PASS"
        } else {
            $item.Create = "SKIPPED"
            $item.Update = "SKIPPED"
            $item.Delete = "SKIPPED"
            $item.Status = "PASS"
        }
    } catch {
        $item.Error = $_.Exception.Message
        if ($_.ErrorDetails) { $item.Error += " | Details: $($_.ErrorDetails.Message)" }
        $item.Status = "FAIL"
    }

    $results.Add($item)
    Write-Output "[$($item.Status)] $Name - Read: $($item.Read) | Create: $($item.Create) | Update: $($item.Update) | Delete: $($item.Delete)"
    if ($item.Error) { Write-Output "   ERROR: $($item.Error)" }
}

$now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

# 1. company-groups
Run-Test -Name "company-groups" -ReadUrl "/api/master-data/company-groups" -CreateUrl "/api/admin-data/company-groups" -UpdateUrl "/api/admin-data/company-groups" -DeleteUrl "/api/admin-data/company-groups" -Headers $adminHeaders -CreatePayloadBuilder {
    @{ name = "Gruppo Test $now"; legalName = "Gruppo Test SpA"; vatNumber = "IT00112233445"; taxCode = "00112233445"; singleArchive = $true }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; name = "Gruppo Test $now Mod"; legalName = "Gruppo Mod SpA"; vatNumber = "IT00112233445"; taxCode = "00112233445"; singleArchive = $false }
}

# 2. companies
$cSeed = ($now % 1000000000).ToString("D9")
Run-Test -Name "companies" -ReadUrl "/api/master-data/companies" -CreateUrl "/api/admin-data/companies" -UpdateUrl "/api/admin-data/companies" -DeleteUrl "/api/admin-data/companies" -Headers $adminHeaders -CreatePayloadBuilder {
    @{ name = "Azienda Test $now"; legalName = "Azienda Test Srl"; vatNumber = "IT99$cSeed"; taxCode = "99$cSeed"; activity = "Manifattura"; operationalUnitName = "Unita 1"; type = "Produzione"; reference = "Dott. Neri"; status = "Attiva" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; name = "Azienda Test $now Mod"; legalName = "Azienda Mod Srl"; vatNumber = "IT99$cSeed"; taxCode = "99$cSeed"; activity = "Manifattura Avanzata"; operationalUnitName = "Unita 1"; type = "Produzione"; reference = "Dott. Neri"; status = "Attiva" }
}

# 3. branches
Run-Test -Name "branches" -ReadUrl "/api/master-data/branches" -CreateUrl "/api/admin-data/branches" -UpdateUrl "/api/admin-data/branches" -DeleteUrl "/api/admin-data/branches" -Headers $adminHeaders -CreatePayloadBuilder {
    @{ companyId = 1; address = "Via Manzoni 15"; city = "Monza"; province = "MB"; postalCode = "20900" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; companyId = 1; address = "Via Manzoni 15 Mod"; city = "Monza"; province = "MB"; postalCode = "20900" }
}

# 4. departments
Run-Test -Name "departments" -ReadUrl "/api/master-data/departments" -CreateUrl "/api/admin-data/departments" -UpdateUrl "/api/admin-data/departments" -DeleteUrl "/api/admin-data/departments" -Headers $adminHeaders -CreatePayloadBuilder {
    @{ companyId = 1; name = "Controllo Qualita $now"; manager = "Dott. Gialli"; managerEmail = "gialli@qualita.it"; isActive = $true }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; companyId = 1; name = "Controllo Qualita Mod"; manager = "Dott. Gialli"; managerEmail = "gialli@qualita.it"; isActive = $true }
}

# 5. work-locations
Run-Test -Name "work-locations" -ReadUrl "/api/master-data/work-locations" -CreateUrl "/api/admin-data/work-locations" -UpdateUrl "/api/admin-data/work-locations" -DeleteUrl "/api/admin-data/work-locations" -Headers $adminHeaders -CreatePayloadBuilder {
    @{ companyId = 1; name = "Laboratorio Analisi $now"; address = "Via Volta 8"; city = "Bergamo"; postalCode = "24100"; province = "BG"; notes = "Area controllata"; isActive = $true }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; companyId = 1; name = "Laboratorio Analisi Mod"; address = "Via Volta 8"; city = "Bergamo"; postalCode = "24100"; province = "BG"; notes = "Area controllata"; isActive = $true }
}

# 6. company-contacts
Run-Test -Name "company-contacts" -ReadUrl "/api/master-data/company-contacts" -CreateUrl "/api/admin-data/company-contacts" -UpdateUrl "/api/admin-data/company-contacts" -DeleteUrl "/api/admin-data/company-contacts" -Headers $adminHeaders -CreatePayloadBuilder {
    @{ companyId = 1; role = "RLS"; fullName = "Roberto RLS $now"; email = "rls@azienda.it"; phone = "+39 340 1122334" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; companyId = 1; role = "RLS"; fullName = "Roberto RLS Mod"; email = "rls@azienda.it"; phone = "+39 340 1122334" }
}

# 7. job-roles
Run-Test -Name "job-roles" -ReadUrl "/api/master-data/job-roles" -CreateUrl "/api/admin-data/job-roles" -UpdateUrl "/api/admin-data/job-roles" -DeleteUrl "/api/admin-data/job-roles" -Headers $adminHeaders -CreatePayloadBuilder {
    @{ name = "Tecnico Meccatronico $now"; description = "Manutenzione robotica"; iscoCode = "7412"; riskCategory = "Medio"; isActive = $true }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; name = "Tecnico Meccatronico Mod"; description = "Manutenzione robotica avanzata"; iscoCode = "7412"; riskCategory = "Medio"; isActive = $true }
}

# 8. risk-factors
Run-Test -Name "risk-factors" -ReadUrl "/api/master-data/risk-factors" -CreateUrl "/api/admin-data/risk-factors" -UpdateUrl "/api/admin-data/risk-factors" -DeleteUrl "/api/admin-data/risk-factors" -Headers $adminHeaders -CreatePayloadBuilder {
    @{ name = "Vibrazioni Meccaniche $now"; description = "Uso attrezzi a percussione ed impatto"; severityLevel = 3; allegato3BCategory = "Agenti fisici" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; name = "Vibrazioni Meccaniche Mod"; description = "Uso attrezzi a percussione ed impatto"; severityLevel = 4; allegato3BCategory = "Agenti fisici" }
}

# 9. protocols-registry (Doctor endpoints)
Run-Test -Name "protocols-registry" -ReadUrl "/api/master-data/protocols" -CreateUrl "/api/doctor-data/protocols" -UpdateUrl "/api/doctor-data/protocols" -DeleteUrl "/api/doctor-data/protocols" -Headers $doctorHeaders -CreatePayloadBuilder {
    @{ name = "Protocollo Meccatronica $now"; lawReference = "81/08"; cadenceDays = 730; objective = "Sorveglianza uditiva e osteoarticolare"; jobRoleId = 1 }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; name = "Protocollo Meccatronica Mod"; lawReference = "81/08"; cadenceDays = 365; objective = "Sorveglianza uditiva e osteoarticolare"; jobRoleId = 1 }
}

# 10. employees
$eCf = "TST" + ($now.ToString().Substring($now.ToString().Length - 13))
Run-Test -Name "employees" -ReadUrl "/api/master-data/employees" -CreateUrl "/api/admin-data/employees" -UpdateUrl "/api/admin-data/employees" -DeleteUrl "/api/admin-data/employees" -Headers $adminHeaders -CreatePayloadBuilder {
    @{ companyId = 1; branchId = 1; firstName = "Test"; lastName = "Lavoratore $now"; birthDate = "1990-04-10"; gender = "M"; birthCity = "Milano"; birthCityCode = "F205"; taxCode = $eCf; jobRole = "Operatore linea"; categoriaProtetta = $false; documentiPrivacy = $true; statoRisorsa = "Attivo" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; companyId = 1; branchId = 1; firstName = "Test"; lastName = "Lavoratore Mod"; birthDate = "1990-04-10"; gender = "M"; birthCity = "Milano"; birthCityCode = "F205"; taxCode = $eCf; jobRole = "Operatore linea"; categoriaProtetta = $true; documentiPrivacy = $true; statoRisorsa = "Attivo" }
}

# 11. personal-protocols (Create a new protocol first to guarantee unassigned pair)
$tempProtocol = Invoke-RestMethod -Uri "$baseUrl/api/doctor-data/protocols" -Method Post -Headers $doctorHeaders -ContentType "application/json" -Body (@{ name = "Protocollo Temp $now"; lawReference = "81/08"; cadenceDays = 365 } | ConvertTo-Json)
Run-Test -Name "personal-protocols" -ReadUrl "/api/master-data/personal-protocols" -CreateUrl "/api/admin-data/personal-protocols" -UpdateUrl "/api/admin-data/personal-protocols" -DeleteUrl "/api/admin-data/personal-protocols" -Headers $adminHeaders -CreatePayloadBuilder {
    @{ employeeId = 1; protocolId = $tempProtocol.id; assignedAt = "2026-09-01"; isOverride = $false; notes = "Assegnazione automatica" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; employeeId = 1; protocolId = $tempProtocol.id; assignedAt = "2026-09-01"; isOverride = $true; notes = "Modifica override" }
}
Invoke-RestMethod -Uri "$baseUrl/api/doctor-data/protocols/$($tempProtocol.id)" -Method Delete -Headers $doctorHeaders | Out-Null

# 12. exam-types
Run-Test -Name "exam-types" -ReadUrl "/api/master-data/exam-types" -CreateUrl "/api/admin-data/exam-types" -UpdateUrl "/api/admin-data/exam-types" -DeleteUrl "/api/admin-data/exam-types" -Headers $adminHeaders -CreatePayloadBuilder {
    @{ name = "ECG a Riposo $now"; category = "Cardiologia" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; name = "ECG a Riposo Mod"; category = "Cardiologia" }
}

# 13. medical-records (Create a test employee first so they don't have a record yet)
$tempEmpCf = "MED" + ($now.ToString().Substring($now.ToString().Length - 13))
$tempEmp = Invoke-RestMethod -Uri "$baseUrl/api/admin-data/employees" -Method Post -Headers $adminHeaders -ContentType "application/json" -Body (@{
    companyId = 1; branchId = 1; firstName = "Record"; lastName = "Test $now"; birthDate = "1992-03-03"; gender = "F"; birthCity = "Roma"; birthCityCode = "H501"; taxCode = $tempEmpCf; jobRole = "Impiegata"
} | ConvertTo-Json)
Run-Test -Name "medical-records" -ReadUrl "/api/master-data/medical-records" -CreateUrl "/api/doctor-data/medical-records" -UpdateUrl "/api/doctor-data/medical-records" -DeleteUrl "/api/doctor-data/medical-records" -Headers $doctorHeaders -CreatePayloadBuilder {
    @{ employeeId = $tempEmp.id; medicalHistory = "Anamnesi completa per lavoratore test senza patologie."; notes = "Idonea"; currentTherapies = "Nessuna"; status = "Active" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; employeeId = $tempEmp.id; medicalHistory = "Anamnesi completa per lavoratore test senza patologie."; notes = "Idonea confermata"; currentTherapies = "Nessuna"; status = "Active" }
}
Invoke-RestMethod -Uri "$baseUrl/api/admin-data/employees/$($tempEmp.id)" -Method Delete -Headers $adminHeaders | Out-Null

# 14. medical-visits
Run-Test -Name "medical-visits" -ReadUrl "/api/master-data/medical-visits" -CreateUrl "/api/doctor-data/medical-visits" -UpdateUrl "/api/doctor-data/medical-visits" -DeleteUrl "/api/doctor-data/medical-visits" -Headers $doctorHeaders -CreatePayloadBuilder {
    @{ employeeId = 1; doctorId = 1; visitDate = "2026-09-01"; nextDeadlineDate = "2027-09-01"; visitType = "Preventive"; outcome = "Idoneo alla mansione specifica"; targetOrgans = "Apparato locomotore"; objectiveExam = "Esame nella norma"; clinicalNotes = "Nessuna prescrizione" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; employeeId = 1; doctorId = 1; visitDate = "2026-09-01"; nextDeadlineDate = "2027-09-01"; visitType = "Preventive"; outcome = "Idoneo senza limitazioni"; targetOrgans = "Apparato locomotore"; objectiveExam = "Esame nella norma"; clinicalNotes = "Nessuna prescrizione" }
}

# 15. scheduled-exams
Run-Test -Name "scheduled-exams" -ReadUrl "/api/master-data/scheduled-exams" -CreateUrl "/api/doctor-data/scheduled-exams" -UpdateUrl "/api/doctor-data/scheduled-exams" -DeleteUrl "/api/doctor-data/scheduled-exams" -Headers $doctorHeaders -CreatePayloadBuilder {
    @{ employeeId = 1; examTypeId = 1; dueDate = "2027-02-01"; status = "Planned" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; employeeId = 1; examTypeId = 1; dueDate = "2027-02-01"; status = "Completed" }
}

# 16. vaccinations
Run-Test -Name "vaccinations" -ReadUrl "/api/master-data/vaccinations" -CreateUrl "/api/doctor-data/vaccinations" -UpdateUrl "/api/doctor-data/vaccinations" -DeleteUrl "/api/doctor-data/vaccinations" -Headers $doctorHeaders -CreatePayloadBuilder {
    @{ employeeId = 1; vaccineName = "Antiepatite B $now"; dateAdministered = "2026-02-01"; nextDueDate = "2031-02-01" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; employeeId = 1; vaccineName = "Antiepatite B Richiamo"; dateAdministered = "2026-02-01"; nextDueDate = "2031-02-01" }
}

# 17. site-visits
Run-Test -Name "site-visits" -ReadUrl "/api/master-data/site-visits" -CreateUrl "/api/doctor-data/site-visits" -UpdateUrl "/api/doctor-data/site-visits" -DeleteUrl "/api/doctor-data/site-visits" -Headers $doctorHeaders -CreatePayloadBuilder {
    @{ companyId = 1; visitedStructure = "Reparto Assemblaggio $now"; location = "Milano"; doctorName = "Dott. Mario Rossi"; visitDate = "2026-09-01"; frequency = "Annuale"; nextDueDate = "2027-09-01"; outcome = "Conforme"; notes = "Sopralluogo completato con esito favorevole" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; companyId = 1; visitedStructure = "Reparto Assemblaggio Mod"; location = "Milano"; doctorName = "Dott. Mario Rossi"; visitDate = "2026-09-01"; frequency = "Annuale"; nextDueDate = "2027-09-01"; outcome = "Conforme"; notes = "Sopralluogo completato con esito favorevole" }
}

# 18. anamneses (Create a new medical visit first so it doesn't have an anamnesis yet)
$tempVisit = Invoke-RestMethod -Uri "$baseUrl/api/doctor-data/medical-visits" -Method Post -Headers $doctorHeaders -ContentType "application/json" -Body (@{
    employeeId = 1; doctorId = 1; visitDate = "2026-09-03"; nextDeadlineDate = "2027-09-03"; visitType = "Periodic"; outcome = "In attesa"
} | ConvertTo-Json)
Run-Test -Name "anamneses" -ReadUrl "/api/master-data/anamneses" -CreateUrl "/api/doctor-data/anamneses" -UpdateUrl "/api/doctor-data/anamneses" -DeleteUrl "/api/doctor-data/anamneses" -Headers $doctorHeaders -CreatePayloadBuilder {
    @{ medicalVisitId = $tempVisit.id; workHistory = "Addetto produzione da 10 anni"; personalHistory = "Non fumatore"; familyHistory = "Genitori viventi sani"; remotePathology = "Nessuna"; recentPathology = "Nessuna" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; medicalVisitId = $tempVisit.id; workHistory = "Addetto produzione da 10 anni"; personalHistory = "Non fumatore"; familyHistory = "Genitori viventi sani"; remotePathology = "Nessuna"; recentPathology = "Influenza stagionale risolta" }
}
Invoke-RestMethod -Uri "$baseUrl/api/doctor-data/medical-visits/$($tempVisit.id)" -Method Delete -Headers $doctorHeaders | Out-Null

# 19. visit-exams
Run-Test -Name "visit-exams" -ReadUrl "/api/master-data/visit-exams" -CreateUrl "/api/doctor-data/visit-exams" -UpdateUrl "/api/doctor-data/visit-exams" -DeleteUrl "/api/doctor-data/visit-exams" -Headers $doctorHeaders -CreatePayloadBuilder {
    @{ medicalVisitId = 1; examTypeId = 1; referenceRange = "> 80%"; result = "FVC 95%, FEV1 92% - parametri nei limiti della norma"; notes = "Referto allegato" }
} -UpdatePayloadBuilder { param($c)
    @{ id = $c.id; medicalVisitId = 1; examTypeId = 1; referenceRange = "> 80%"; result = "FVC 95%, FEV1 92% - parametri ottimali"; notes = "Referto validato" }
}

# 20. Read-only entities: doctor-availabilities and notification-logs
Run-Test -Name "doctor-availabilities" -ReadUrl "/api/master-data/doctor-availabilities" -CreateUrl "" -UpdateUrl "" -DeleteUrl "" -Headers $doctorHeaders -CreatePayloadBuilder { $null } -UpdatePayloadBuilder { $null }
Run-Test -Name "notification-logs" -ReadUrl "/api/master-data/notification-logs" -CreateUrl "" -UpdateUrl "" -DeleteUrl "" -Headers $doctorHeaders -CreatePayloadBuilder { $null } -UpdatePayloadBuilder { $null }

Write-Output ""
Write-Output "============================================================"
Write-Output "RIASSUNTO TEST ENTITA:"
Write-Output "============================================================"
$results | Format-Table -AutoSize
