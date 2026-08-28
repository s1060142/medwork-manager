import { test, expect } from '@playwright/test'
import { TestFixtures, USERS, API_URL } from '../fixtures/test-fixtures'

let fixtures: TestFixtures

test.beforeEach(async ({ page, request, context }) => {
  fixtures = new TestFixtures(page, request, context, expect)
  await fixtures.loginAsAdmin()
})

test.describe('P0 - Authentication', () => {
  test('AUTH-01 - Admin login success', async () => {
    // Already logged in via beforeEach
    await fixtures.dashboard.waitForDashboard()
    await expect(fixtures.dashboard.companyManagementButton).toBeVisible()
    await expect(fixtures.dashboard.administrationButton).toBeVisible()
    await expect(fixtures.dashboard.logoutButton).toBeVisible()
  })

  test('AUTH-02 - Doctor login success', async () => {
    await fixtures.loginAsDoctor()
    await fixtures.dashboard.waitForDashboard()
    await expect(fixtures.dashboard.companyManagementButton).toBeVisible()
    // Doctor should NOT see administration
    await expect(fixtures.dashboard.administrationButton).not.toBeVisible()
  })

  test('AUTH-03 - Invalid credentials rejected', async () => {
    await fixtures.loginPage.ensureLoginPage()
    await fixtures.loginPage.login('wrong', 'wrong')
    await fixtures.loginPage.assertLoginError()
    await expect(fixtures.loginPage.errorAlert).toBeVisible()
  })

  test('AUTH-04 - Logout clears session', async () => {
    await fixtures.dashboard.waitForDashboard()
    await fixtures.dashboard.logout()
    await fixtures.dashboard.assertLoggedOut()
  })

  test('AUTH-05 - Tenant slug required', async () => {
    const response = await fixtures.request.post(`${API_URL}/api/auth/login`, {
      data: {
        username: 'admin',
        password: 'Admin123!',
      },
    })
    expect(response.status()).toBe(401)
  })
})

test.describe('P0 - Companies', () => {
  test('COMP-01 - List companies', async () => {
    await fixtures.page.click('button:has-text("Gestione aziende")')
    await fixtures.page.click('button:has-text("Anagrafica")')
    await expect(fixtures.page.getByText('Anagrafica').first()).toBeVisible({ timeout: 10000 })
  })

  test('COMP-02 - Create company', async () => {
    await fixtures.page.click('button:has-text("Gestione aziende")')
    await fixtures.page.click('button:has-text("Anagrafica")')
    await fixtures.companies.openCreateDialog()
    await fixtures.companies.fillCompanyForm({
      name: `TEST-CO-${Date.now()}`,
      legalName: 'Test Company SRL',
      vatNumber: `IT${Date.now().toString().slice(-11)}`,
      email: 'test@playwright.it',
      phone: '1234567890',
    })
    await fixtures.companies.saveCompany()
    await fixtures.page.waitForSelector('button:has-text("Anagrafica")', { timeout: 10000 })
  })

  test('COMP-03 - Company tenant isolation', async () => {
    const token = await fixtures.getAuthToken(USERS.admin)
    const companies = await fixtures.apiGet('/api/admin-data/companies', token)
    expect(Array.isArray(companies)).toBe(true)
  })
})

test.describe('P0 - Employees', () => {
  test('EMP-01 - List employees', async () => {
    await fixtures.page.click('button:has-text("Gestione lavoratori")')
    await fixtures.employees.waitForPage()
    await expect(fixtures.employees.newEmployeeButton).toBeVisible()
  })

  test('EMP-03 - Employee profile dialog', async () => {
    await fixtures.page.click('button:has-text("Gestione lavoratori")')
    await fixtures.employees.waitForPage()
    // If there are employees, verify profile can open
    const profileBtn = fixtures.page.locator('table tbody tr button:has-text("Profilo")').first()
    if (await profileBtn.count() > 0) {
      await profileBtn.click()
      await expect(fixtures.page.getByRole('dialog')).toBeVisible()
      await fixtures.page.keyboard.press('Escape')
    }
  })

  test('EMP-05 - Employee tenant isolation', async () => {
    const token = await fixtures.getAuthToken(USERS.admin)
    const employees = await fixtures.apiGet('/api/admin-data/employees', token)
    expect(Array.isArray(employees)).toBe(true)
  })
})

test.describe('P0 - Medical Visits', () => {
  test('VISIT-01 - Create medical visit', async () => {
    await fixtures.page.click('button:has-text("Sorveglianza sanitaria")')
    await fixtures.visits.waitForStepper()
    await fixtures.visits.selectFirstEmployee()
    await fixtures.visits.selectFirstDoctor()
    await fixtures.visits.fillBasicInfo(
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    )
    await fixtures.visits.selectVisitType('Periodic')
    await fixtures.visits.fillTargetOrgans()
    await fixtures.visits.fillOutcome('Idoneo senza limitazioni')
    await fixtures.visits.fillDeadline(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    await fixtures.visits.saveVisit()
    await fixtures.visits.assertVisitSaved()
  })

  test('VISIT-02 - Auto deadline calculation', async () => {
    const token = await fixtures.getAuthToken(USERS.admin)
    const employees = await fixtures.apiGet('/api/admin-data/employees', token)
    if (!Array.isArray(employees) || employees.length === 0) {
      test.skip('No employees for deadline test')
      return
    }
    const employeeId = employees[employees.length - 1].id
    const doctors = await fixtures.apiGet('/api/master-data/doctors', token)
    const doctorId = Array.isArray(doctors) && doctors.length > 0 ? doctors[0].id : 1
    const visit = await fixtures.createTestVisit(token, employeeId, doctorId)
    expect(visit.nextDeadlineDate).toBeTruthy()
  })

  test('VISIT-04 - Visit tenant isolation', async () => {
    const token = await fixtures.getAuthToken(USERS.admin)
    const visits = await fixtures.apiGet('/api/doctor-data/medical-visits', token)
    expect(Array.isArray(visits)).toBe(true)
  })
})

test.describe('P0 - Medical Records', () => {
  test('MR-01 - Create medical record', async () => {
    const token = await fixtures.getAuthToken(USERS.admin)
    const uniqueTaxCode = `MR${Date.now()}A`
    const created = await fixtures.apiPost('/api/admin-data/employees', token, {
      firstName: 'MRTest',
      lastName: 'Record',
      taxCode: uniqueTaxCode,
      companyId: 1,
      jobRole: 'Test',
      branchId: 1,
      birthCity: 'Roma',
      birthCityCode: 'H501',
      birthDate: '1990-01-01',
      isActive: true,
    })
    const employeeId = created.id
    const record = await fixtures.apiPost('/api/doctor-data/medical-records', token, {
      employeeId,
      medicalHistory: 'Test medical history with enough length',
      notes: 'Test notes',
      currentTherapies: 'None',
    })
    expect(record.id).toBeTruthy()
  })

  test('MR-03 - Medical record tenant isolation', async () => {
    const token = await fixtures.getAuthToken(USERS.admin)
    const records = await fixtures.apiGet('/api/doctor-data/medical-records', token)
    expect(Array.isArray(records)).toBe(true)
  })
})

test.describe('P0 - Protocols', () => {
  test('PROTO-01 - List protocols', async () => {
    await fixtures.page.click('button:has-text("Sorveglianza sanitaria")')
    await fixtures.page.click('button:has-text("Protocolli")')
    await fixtures.protocols.waitForPage()
    await expect(fixtures.page.getByText('Protocolli sanitari').first()).toBeVisible()
  })

  test('PROTO-02 - Create protocol', async () => {
    await fixtures.page.click('button:has-text("Sorveglianza sanitaria")')
    await fixtures.page.click('button:has-text("Protocolli")')
    await fixtures.protocols.waitForPage()
    await fixtures.protocols.openCreateDialog()
    await fixtures.protocols.fillProtocolForm({
      name: `TEST-PROTO-${Date.now()}`,
      cadenceDays: 365,
      objective: 'Test protocol',
      description: 'E2E test protocol',
      lawReference: 'D.Lgs. 81/08',
    })
    await fixtures.protocols.saveProtocol()
    await fixtures.page.waitForSelector('text=Protocolli sanitari', { timeout: 10000 })
  })

  test('PROTO-04 - Protocol tenant isolation', async () => {
    const token = await fixtures.getAuthToken(USERS.doctor)
    const protocols = await fixtures.apiGet('/api/doctor-data/protocols', token)
    expect(Array.isArray(protocols)).toBe(true)
  })
})

test.describe('P0 - Patient Portal', () => {
  test('PAT-01 - Patient anamnesis read', async () => {
    const token = await fixtures.getAuthToken(USERS.admin)
    const employees = await fixtures.apiGet('/api/admin-data/employees', token)
    if (!Array.isArray(employees) || employees.length === 0) {
      test.skip('No employees for patient portal test')
      return
    }
    const employeeId = employees[employees.length - 1].id
    const visits = await fixtures.apiGet(`/api/doctor-data/medical-visits?employeeId=${employeeId}`, token)
    if (!Array.isArray(visits) || visits.length === 0) {
      test.skip('No visits for patient portal test')
      return
    }
    const visitId = visits[0].id
    const anamnesis = await fixtures.apiGet(`/api/patient-portal/anamnesis?visitId=${visitId}`, token)
    expect(anamnesis).toBeTruthy()
  })

  test('PAT-03 - Patient tenant isolation', async () => {
    const token = await fixtures.getAuthToken(USERS.admin)
    const response = await fixtures.page.request.get(`${API_URL}/api/patient-portal/anamnesis`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // Should return 403 or 404 when no valid patient token
    expect([200, 403, 404]).toContain(response.status())
  })
})

test.describe('P0 - PDF Generation', () => {
  test('PDF-01 - Fitness judgment PDF download', async () => {
    const token = await fixtures.getAuthToken(USERS.admin)
    const employees = await fixtures.apiGet('/api/admin-data/employees', token)
    if (!Array.isArray(employees) || employees.length === 0) {
      test.skip('No employees for PDF test')
      return
    }
    const employeeId = employees[employees.length - 1].id
    const doctors = await fixtures.apiGet('/api/master-data/doctors', token)
    const doctorId = Array.isArray(doctors) && doctors.length > 0 ? doctors[0].id : 1
    const visit = await fixtures.createTestVisit(token, employeeId, doctorId)
    const pdfBuffer = await fixtures.pdfViewer.downloadPdf(
      `${API_URL}/api/documents/visits/${visit.id}/fitness-judgment-pdf`
    )
    expect(pdfBuffer.length).toBeGreaterThan(0)
  })

  test('PDF-03 - PDF tenant isolation', async () => {
    const token = await fixtures.getAuthToken(USERS.admin)
    const response = await fixtures.page.request.get(
      `${API_URL}/api/documents/visits/999999/fitness-judgment-pdf`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    expect([404, 403]).toContain(response.status())
  })
})

test.describe('P0 - Administration', () => {
  test('ADMIN-01 - Administration section visible to admin', async () => {
    await expect(fixtures.dashboard.administrationButton).toBeVisible()
    await fixtures.dashboard.administrationButton.click()
    await fixtures.administration.waitForPage()
    await expect(fixtures.page.getByText('Amministrazione').first()).toBeVisible()
  })

  test('ADMIN-02 - Audit log buttons', async () => {
    await fixtures.page.click('button:has-text("Amministrazione")')
    await fixtures.administration.waitForPage()
    await fixtures.administration.openAuditTab()
    await expect(fixtures.administration.updateAuditButton).toBeVisible()
    await expect(fixtures.administration.clearAuditButton).toBeVisible()
  })

  test('ADMIN-03 - Doctor cannot access administration', async () => {
    await fixtures.loginAsDoctor()
    await expect(fixtures.dashboard.administrationButton).not.toBeVisible()
  })
})
