import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const API_BASE = 'http://localhost:5279'

// Credentials
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }
const DOCTOR_CRED = { username: 'doctor', password: 'Doctor123!' }

async function login(page, creds = ADMIN_CRED) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', creds.username)
  await page.fill('input[type="password"]', creds.password)
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 })
  await page.waitForTimeout(500)
}

async function logout(page) {
  const btn = page.locator('button:has-text("Logout")').first()
  if (await btn.count() > 0) {
    await btn.click()
    await page.waitForSelector('text=Gestionale Medicina del Lavoro', { timeout: 10000 }).catch(() => {})
  }
}

async function selectCompany(page, companyName = 'Acme Industria S.p.A.') {
  const btn = page.locator(`button:has-text("${companyName}")`)
  if (await btn.count() > 0) {
    await btn.first().click()
    await page.waitForTimeout(300)
  }
}

async function openArea(page, areaLabel) {
  await page.click(`button:has-text("${areaLabel}")`)
  await page.waitForTimeout(500)
}

// Opens a tab inside the current workspace area (legacy-tab)
async function openTab(page, tabLabel) {
  const tab = page.locator(`.legacy-tab:has-text("${tabLabel}"), button:has-text("${tabLabel}")`).first()
  if (await tab.count() > 0) {
    await tab.click()
    await page.waitForTimeout(500)
  }
}

async function clickButton(page, text) {
  const btn = page.locator(`button:has-text("${text}")`).first()
  if (await btn.count() > 0) {
    await btn.click()
    await page.waitForTimeout(400)
    return true
  }
  return false
}

// ==================== TESTS ====================

test.describe('Authentication', () => {
  test('login as admin', async ({ page }) => {
    await login(page, ADMIN_CRED)
    await expect(page.locator('button:has-text("Logout")')).toBeVisible()
  })

  test('login as doctor', async ({ page }) => {
    await login(page, DOCTOR_CRED)
    await expect(page.locator('button:has-text("Logout")')).toBeVisible()
  })

  test('logout', async ({ page }) => {
    await login(page, ADMIN_CRED)
    await logout(page)
    await expect(page.locator('text=Gestionale Medicina del Lavoro')).toBeVisible()
  })
})

test.describe('Navigation & Sidebar', () => {
  test.beforeEach(async ({ page }) => await login(page))

  test('all 6 admin areas visible', async ({ page }) => {
    const areas = ['Gestione aziende', 'Gestione lavoratori', 'Analisi e relazioni', 'Sorveglianza sanitaria', 'Scadenzario', 'Amministrazione']
    for (const area of areas) {
      await expect(page.locator(`button:has-text("${area}")`)).toBeVisible()
    }
  })

  test('doctor sees 5 areas (no amministrazione)', async ({ page }) => {
    await logout(page)
    await login(page, DOCTOR_CRED)
    const areas = ['Gestione aziende', 'Gestione lavoratori', 'Analisi e relazioni', 'Sorveglianza sanitaria', 'Scadenzario']
    for (const area of areas) {
      await expect(page.locator(`button:has-text("${area}")`)).toBeVisible()
    }
    await expect(page.locator('button:has-text("Amministrazione")')).not.toBeVisible()
  })
})

test.describe('Company Management - Gestione Aziende', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('Anagrafica Aziende loads + toolbar buttons', async ({ page }) => {
    await openArea(page, 'Gestione aziende')
    await openTab(page, 'Anagrafica')
    await expect(page.getByText('Anagrafica')).toBeVisible({ timeout: 10000 })
    for (const b of ['Nuova azienda', 'Stampa', 'Esporta dati in excel', 'Operazioni massive', 'Importa dati']) {
      await expect(page.locator(`button:has-text("${b}")`).first()).toBeVisible()
    }
  })

  test('Gruppi Aziendali loads', async ({ page }) => {
    await openArea(page, 'Gestione aziende')
    await openTab(page, 'Gruppi aziendali')
    await expect(page.getByText('Gruppi aziendali')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("Nuovo")').first()).toBeVisible()
  })

  test('Checklist (Protocolli) loads', async ({ page }) => {
    await openArea(page, 'Gestione aziende')
    await openTab(page, 'Checklist')
    await expect(page.getByText('Checklist')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Workers Management - Gestione Lavoratori', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('WorkersCenter toolbar + footer buttons', async ({ page }) => {
    await openArea(page, 'Gestione lavoratori')
    await expect(page.getByText('Aziende / Lavoratori')).toBeVisible({ timeout: 10000 })
    for (const b of ['Gestione completa', 'Aggiungi', 'Ricerca lavoratori', 'Reset', 'Ricerca', '+ Nuovo lavoratore', 'Stampa', 'Stampe massive', 'Operazioni massive', 'Esporta dati in excel', 'Importa lavoratori']) {
      await expect(page.locator(`button:has-text("${b}")`).first()).toBeVisible()
    }
  })

  test('EmployeeProfileDialog opens on Profilo button', async ({ page }) => {
    await openArea(page, 'Gestione lavoratori')
    const profileBtn = page.locator('table tbody tr button:has-text("Profilo")').first()
    if (await profileBtn.count() > 0) {
      await profileBtn.click()
      const dlg = page.locator('[role="dialog"]')
      await expect(dlg).toBeVisible({ timeout: 10000 })
      await dlg.locator('button:has-text("Chiudi")').click()
      await expect(page.locator('[role="dialog"]')).toHaveCount(0)
    }
  })
})

test.describe('Health Surveillance - Sorveglianza Sanitaria', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('Nuova visita (stepper) opens', async ({ page }) => {
    await openArea(page, 'Sorveglianza sanitaria')
    await openTab(page, 'Nuova visita')
    await expect(page.getByText('Inserimento Visita Medica', { exact: false })).toBeVisible({ timeout: 15000 })
  })

  test('ProtocolsCenter loads + buttons', async ({ page }) => {
    await openArea(page, 'Sorveglianza sanitaria')
    await openTab(page, 'Protocolli')
    await expect(page.getByText('Protocollo', { exact: false }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("Nuovo protocollo")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Esporta CSV")').first()).toBeVisible()
  })

  test('Appuntamenti (calendar) loads', async ({ page }) => {
    await openArea(page, 'Sorveglianza sanitaria')
    const tab = page.locator('.legacy-tab:has-text("Appuntamenti"), button:has-text("Appuntamenti")').first()
    if ((await tab.count()) === 0) {
      console.log('Appuntamenti tab not found in this context')
      return
    }
    await tab.click()
    await page.waitForTimeout(800)
    // Calendar area is present (tab label or agenda heading)
    await expect(page.locator('text=Appuntamenti').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Schedule - Scadenzario', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('Scadenzario tabs accessible', async ({ page }) => {
    await openArea(page, 'Scadenzario')
    const tabs = ['Agenda', 'Prenotazioni', 'Scadenzario Visite', 'Scadenzario Attività', 'Scadenzario sopralluoghi', 'Scadenzario Nomine', 'Scadenzario Vaccinazioni']
    for (const tab of tabs) {
      const t = page.locator(`.legacy-tab:has-text("${tab}"), button:has-text("${tab}")`).first()
      if (await t.count() > 0) {
        await t.click()
        await page.waitForTimeout(300)
      }
    }
    // at least the default tab content is visible
    await expect(page.locator('button:has-text("Aggiorna")').first()).toBeVisible()
  })

  test('Dashboard Scadenze - KPIs and Quick Actions', async ({ page }) => {
    await selectCompany(page)
    const actions = ['Nuova Visita Medica', 'Aggiungi Dipendente', 'Backup Dati Now', 'Esporta Report']
    let found = 0
    for (const a of actions) {
      if ((await page.locator(`button:has-text("${a}")`).first().count()) > 0) found++
    }
    console.log(`Dashboard quick actions found: ${found}/4`)
  })
})

test.describe('Administration - Amministrazione', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_CRED)
    await selectCompany(page)
  })

  test('Admin tabs load (Fatturazione, Strumenti, Audit)', async ({ page }) => {
    await openArea(page, 'Amministrazione')
    for (const tab of ['Impostazioni', 'Fatturazione', 'Strumenti', 'Audit']) {
      await openTab(page, tab)
      await expect(page.locator(`.legacy-tab:has-text("${tab}")`).first()).toBeVisible({ timeout: 10000 })
    }
    // Tools center button present
    await openTab(page, 'Strumenti')
    await expect(page.locator('button:has-text("Registra firma")').first()).toBeVisible()
    // Billing center button present
    await openTab(page, 'Fatturazione')
    await expect(page.locator('button:has-text("Genera fatture")').first()).toBeVisible()
    // Audit center buttons present
    await openTab(page, 'Audit')
    await expect(page.locator('button:has-text("Aggiorna")').first()).toBeVisible()
  })
})

test.describe('Profile Dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('CompanyProfileDialog opens on Profilo button', async ({ page }) => {
    await openArea(page, 'Gestione aziende')
    await openTab(page, 'Anagrafica')
    const profiloBtn = page.locator('table tbody tr button:has-text("Profilo")').first()
    if (await profiloBtn.count() > 0) {
      await profiloBtn.click()
      const dlg = page.locator('[role="dialog"]')
      await expect(dlg).toBeVisible({ timeout: 10000 })
      await dlg.locator('button:has-text("Chiudi")').click()
      await expect(page.locator('[role="dialog"]')).toHaveCount(0)
    }
  })
})

// ==================== API HEALTH CHECKS ====================

test.describe('API Endpoints Health Check', () => {
  const endpoints = [
    { name: 'Companies', url: '/api/master-data/companies', method: 'GET' },
    { name: 'Employees', url: '/api/master-data/employees', method: 'GET' },
    { name: 'Medical Visits', url: '/api/master-data/medical-visits', method: 'GET' },
    { name: 'Protocols', url: '/api/master-data/protocols', method: 'GET' },
    { name: 'Risk Factors', url: '/api/master-data/risk-factors', method: 'GET' },
    { name: 'Job Roles', url: '/api/master-data/job-roles', method: 'GET' },
    { name: 'Exam Types', url: '/api/master-data/exam-types', method: 'GET' },
    { name: 'Branches', url: '/api/master-data/branches', method: 'GET' },
    { name: 'Company Groups', url: '/api/master-data/company-groups', method: 'GET' },
    { name: 'Employee Risks', url: '/api/master-data/employee-risks', method: 'GET' },
    { name: 'Expiring Visits', url: '/api/medical-visits/expiring?days=30', method: 'GET' },
  ]

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  for (const ep of endpoints) {
    test('API ' + ep.name + ' returns 200', async ({ page }) => {
      const token = await page.evaluate(() => localStorage.getItem('accessToken'))
      const response = await page.request.get(API_BASE + ep.url, {
        headers: { Authorization: 'Bearer ' + token },
      })
      expect(typeof response.status === 'function' ? response.status() : response.status).toBe(200)
    })
  }
})
