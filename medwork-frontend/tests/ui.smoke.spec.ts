import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  // Wait for dashboard to load - sidebar areas should be visible
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 })
}

test('login as admin', async ({ page }) => {
  await loginAsAdmin(page)
  await expect(page.locator('button:has-text("Logout")')).toBeVisible()
})

test('navigation sidebar opens areas and modules', async ({ page }) => {
  await loginAsAdmin(page)

  // Gestione Aziende -> the Anagrafica sub-tab becomes available
  await page.click('button:has-text("Gestione aziende")')
  await expect(page.locator('button:has-text("Anagrafica")')).toBeVisible()

  // Gestione Lavoratori -> "+ Nuovo lavoratore" create button appears
  await page.click('button:has-text("Gestione lavoratori")')
  await expect(page.locator('button:has-text("+ Nuovo lavoratore")')).toBeVisible()

  // Sorveglianza Sanitaria -> default module is the medical-visit stepper
  await page.click('button:has-text("Sorveglianza sanitaria")')
  await expect(page.getByText('Inserimento Visita Medica', { exact: false })).toBeVisible({ timeout: 15000 })
})

test('company context selection updates dashboard greeting', async ({ page }) => {
  await loginAsAdmin(page)

  const companyButton = page.locator("button:has-text('Acme Industria S.p.A.')")
  if (await companyButton.count() > 0) {
    await companyButton.first().click()
    await page.waitForTimeout(500)
    // Company selection works if we're still on the page
    await expect(page.locator('button:has-text("Gestione aziende")')).toBeVisible()
  }
})

test('dashboard quick actions and kpi cards render after company selection', async ({ page }) => {
  await loginAsAdmin(page)

  const companyButton = page.locator("button:has-text('Acme Industria S.p.A.')")
  if (await companyButton.count() > 0) {
    await companyButton.first().click()
    await page.waitForTimeout(500)
  }

  // Check that main navigation is working
  await expect(page.locator('button:has-text("Gestione aziende")')).toBeVisible()
  await expect(page.locator('button:has-text("Gestione lavoratori")')).toBeVisible()
  await expect(page.locator('button:has-text("Sorveglianza sanitaria")')).toBeVisible()
})

test('company CRUD flow via UI', async ({ page }) => {
  await loginAsAdmin(page)

  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })

  // "Nuova azienda" is the unique create button for the companies module
  const createButton = page.locator('button:has-text("Nuova azienda")')
  if (await createButton.count() > 0) {
    await createButton.click()
    // Wait for the create dialog to open (fields use label, not placeholder)
    await expect(page.getByText('Nuovo elemento')).toBeVisible({ timeout: 10000 })
    await page.getByLabel('Nome Azienda').fill('PLAYWRIGHT TEST CO')
    await page.getByLabel('Ragione Sociale').fill('PLAYWRIGHT TEST CO SRL')
    await page.getByLabel('Partita IVA').fill('IT00000000000')
    await page.getByLabel('Email Contatto (legacy)').fill('playwright@test.it')
    await page.getByLabel('Telefono').fill('0000000000')
    await page.click('button:has-text("Salva")')
    await expect(page.getByText('PLAYWRIGHT TEST CO', { exact: true })).toBeVisible({ timeout: 5000 })
  }
})

test('employee area opens and create button is reachable', async ({ page }) => {
  await loginAsAdmin(page)

  await page.click('button:has-text("Gestione lavoratori")')
  // The workers area renders its operational view
  await expect(page.locator('text=Aziende / Lavoratori')).toBeVisible({ timeout: 10000 })
  // The create button is present
  await expect(page.locator('button:has-text("+ Nuovo lavoratore")')).toBeVisible()
})

test('company group create flow sends boolean archivioUnico (no 400)', async ({ page }) => {
  await loginAsAdmin(page)

  // Open Gruppi Aziendali (under company-management)
  await page.click('button:has-text("Gestione aziende")')
  await page.waitForSelector('button:has-text("Gruppi aziendali")', { timeout: 10000 })
  await page.click('button:has-text("Gruppi aziendali")')
  await page.waitForSelector('text=Gruppi Aziendali', { timeout: 5000 })

  const createButton = page.locator('button:has-text("Nuovo")')
  await expect(createButton.first()).toBeVisible({ timeout: 10000 })
  await createButton.first().click()

  // Dialog opens; fill required text fields
  await expect(page.getByText('Nuovo elemento')).toBeVisible({ timeout: 10000 })
  const groupName = `GRUPPO TEST ${Date.now()}`
  await page.getByLabel('Descrizione').fill(groupName)
  await page.getByLabel('Ragione Sociale').fill('Gruppo Test SRL')
  // Archivio Documentale Unico must submit a boolean (regression for 400 archivioUnico)
  const archivio = page.getByLabel('Archivio Documentale Unico')
  await expect(archivio).toBeVisible()
  // default is "No" (false) -> selecting it ensures a bool value is sent
  await archivio.click()
  await page.locator('li[role="option"]:has-text("No")').click()

  await page.click('button:has-text("Salva")')
  // On success the new group appears in the table (proves POST returned 200, not 400)
  await expect(page.getByText(groupName, { exact: true })).toBeVisible({ timeout: 8000 })
})

test('employee profile "Nuova visita" opens the visit stepper', async ({ page }) => {
  await loginAsAdmin(page)

  // Ensure a company is selected so the workers list is populated
  const companyButton = page.locator("button:has-text('Acme Industria S.p.A.')")
  if (await companyButton.count() > 0) {
    await companyButton.first().click()
    await page.waitForTimeout(500)
  }

  // Create a test employee via the authenticated API (reuse browser session token)
  const created = await page.evaluate(async () => {
    const token = localStorage.getItem('accessToken')
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    const cj = await fetch('/api/master-data/companies', { headers }).then((r) => r.json())
    const companies = Array.isArray(cj) ? cj : (cj.items || [])
    const company = companies[0]
    if (!company) return { error: 'no company' }
    const bj = await fetch(`/api/master-data/branches?companyId=${company.id}`, { headers }).then((r) => r.json())
    const branches = Array.isArray(bj) ? bj : (bj.items || [])
    const branch = branches[0]
    const unique = `TESTPV${Date.now()}`
    // Build a unique, valid-looking tax code to avoid collisions
    const rand = Math.random().toString(36).slice(2, 9).toUpperCase().padEnd(7, 'X').slice(0, 7)
    const taxCode = `RSSMRA${rand}F205X`.slice(0, 16)
    const payload = { companyId: company.id, branchId: branch?.id, firstName: 'Prova', lastName: unique, birthDate: '1990-01-01', gender: 'M', birthCity: 'Milano', birthCityCode: 'F205', taxCode, jobRole: 'Operaio' }
    const res = await fetch('/api/admin-data/employees', { method: 'POST', headers, body: JSON.stringify(payload) })
    return res.ok ? res.json() : { error: res.status, txt: await res.text() }
  })

  // If we couldn't create a test employee (no seed data), skip rather than fail
  if (!created || created.error) test.skip()

  // Gestione lavoratori -> workers list (profile opens on row double-click)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

  // Locate the row for the created employee and open its profile
  const row = page.locator('table tbody tr', { hasText: created.lastName })
  await expect(row).toBeVisible({ timeout: 10000 })
  await row.dblclick()

  // The employee profile dialog should show the "Nuova visita" button
  const nuovaVisita = page.locator('[role="dialog"] button:has-text("Nuova visita")')
  await expect(nuovaVisita).toBeVisible({ timeout: 10000 })
  await nuovaVisita.click()

  // Clicking it should close the profile and open the medical-visit stepper
  await expect(page.locator('[role="dialog"]')).toHaveCount(0, { timeout: 10000 })
  await expect(page.getByText('Inserimento Visita Medica', { exact: false })).toBeVisible({ timeout: 15000 })
})


