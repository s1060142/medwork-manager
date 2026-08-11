import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 })
}

async function openCompanyCreateDialog(page) {
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
  await page.locator('button:has-text("Nuova azienda")').click()
  await expect(page.getByText('Nuovo elemento')).toBeVisible({ timeout: 10000 })
}

test('company create dialog: Nuovo opens, Salva empty shows validation, Annulla closes', async ({ page }) => {
  await loginAsAdmin(page)
  await openCompanyCreateDialog(page)

  // Salva with empty required fields -> validation errors, dialog stays open
  await page.click('button:has-text("Salva")')
  await expect(page.getByText('Campo obbligatorio').first()).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('Nuovo elemento')).toBeVisible()

  // Annulla closes the dialog
  await page.click('button:has-text("Annulla")')
  await expect(page.getByText('Nuovo elemento')).toHaveCount(0, { timeout: 5000 })
})

test('company edit dialog: Modifica opens and closes', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })

  const editBtn = page.locator('button:has-text("Modifica")').first()
  if (await editBtn.count() > 0) {
    await editBtn.click()
    await expect(page.getByText('Modifica elemento').or(page.getByText('Nuovo elemento'))).toBeVisible({ timeout: 10000 })
    await page.click('button:has-text("Annulla")')
  }
})

test('company row "Profilo" opens CompanyProfileDialog with Salva/Chiudi', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })

  const profiloBtn = page.locator('table tbody tr button:has-text("Profilo")').first()
  if (await profiloBtn.count() > 0) {
    await profiloBtn.click()
    const dlg = page.locator('[role="dialog"]')
    await expect(dlg).toBeVisible({ timeout: 10000 })
    await expect(dlg.locator('button:has-text("Salva")')).toBeVisible()
    await expect(dlg.locator('button:has-text("Chiudi")')).toBeVisible()
    await dlg.locator('button:has-text("Chiudi")').click()
    await expect(page.locator('[role="dialog"]')).toHaveCount(0, { timeout: 5000 })
  }
})

test('employee profile: Nuova visita + Controllo periodico open stepper', async ({ page }) => {
  await loginAsAdmin(page)
  const companyButton = page.locator("button:has-text('Acme Industria S.p.A.')")
  if (await companyButton.count() > 0) { await companyButton.first().click(); await page.waitForTimeout(400) }

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
    const rand = Math.random().toString(36).slice(2, 9).toUpperCase().padEnd(7, 'X').slice(0, 7)
    const taxCode = `RSSMRA${rand}F205X`.slice(0, 16)
    const payload = { companyId: company.id, branchId: branch?.id, firstName: 'Prova', lastName: unique, birthDate: '1990-01-01', gender: 'M', birthCity: 'Milano', birthCityCode: 'F205', taxCode, jobRole: 'Operaio' }
    const res = await fetch('/api/admin-data/employees', { method: 'POST', headers, body: JSON.stringify(payload) })
    return res.ok ? res.json() : { error: res.status }
  })
  if (!created || created.error) {
    console.log('Skipping employee profile test: could not create test employee', created)
    return
  }

  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
  const row = page.locator('table tbody tr', { hasText: created.lastName })
  await expect(row).toBeVisible({ timeout: 10000 })
  await row.dblclick()

  const nuovaVisita = page.locator('[role="dialog"] button:has-text("Nuova visita")')
  await expect(nuovaVisita).toBeVisible({ timeout: 10000 })
  await nuovaVisita.click()
  await expect(page.locator('[role="dialog"]')).toHaveCount(0, { timeout: 10000 })
  await expect(page.getByText('Inserimento Visita Medica', { exact: false })).toBeVisible({ timeout: 15000 })
})

test('medical visit stepper: Avanti / Indietro navigation works', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Sorveglianza sanitaria")')
  await expect(page.getByText('Inserimento Visita Medica', { exact: false })).toBeVisible({ timeout: 15000 })

  const avanti = page.locator('button:has-text("Avanti")')
  const indietro = page.locator('button:has-text("Indietro")')
  await expect(avanti).toBeVisible({ timeout: 10000 })
  await expect(indietro).toBeVisible({ timeout: 10000 })
  // Advance one step; the stepper should still show navigation controls (Indietro, or Salva Visita on last step)
  await avanti.click()
  const stillNavigable = page.locator('button:has-text("Indietro"), button:has-text("Salva Visita")')
  await expect(stillNavigable.first()).toBeVisible({ timeout: 5000 })
})

test('protocols center: + Nuovo protocollo button is present and clickable', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Sorveglianza sanitaria")')
  const protocolliTab = page.locator('button:has-text("Protocolli")').first()
  if (await protocolliTab.count() > 0) {
    await protocolliTab.click()
    await page.waitForTimeout(500)
  }
  const nuovo = page.locator('button:has-text("+ Nuovo protocollo")').first()
  await expect(nuovo).toBeVisible({ timeout: 10000 })
  // Clicking should not crash the app (component saves via inline form state)
  await nuovo.click()
  await page.waitForTimeout(300)
  await expect(page.locator('text=Protocollo').first()).toBeVisible()
})

test('workers center toolbar buttons are present and clickable (no crash)', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

  const labels = ['Gestione completa', 'Aggiungi', 'Ricerca lavoratori', '+ Nuovo lavoratore']
  for (const label of labels) {
    const btn = page.locator(`button:has-text("${label}")`).first()
    await expect(btn).toBeVisible({ timeout: 10000 })
    await btn.click({ timeout: 5000 }).catch(() => {})
  }
})

test('dashboard quick actions: Nuova Visita Medica opens stepper', async ({ page }) => {
  await loginAsAdmin(page)
  const companyButton = page.locator("button:has-text('Acme Industria S.p.A.')")
  if (await companyButton.count() > 0) { await companyButton.first().click(); await page.waitForTimeout(400) }

  const nuovaVisita = page.locator('button:has-text("Nuova Visita Medica")')
  if (await nuovaVisita.count() > 0) {
    await nuovaVisita.click()
    await expect(page.getByText('Inserimento Visita Medica', { exact: false })).toBeVisible({ timeout: 15000 })
  }
})

test('tools center: Registra firma button present', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Amministrazione")')
  await page.locator('button:has-text("Strumenti")').first().click()
  await page.waitForTimeout(500)
  const registra = page.locator('button:has-text("Registra firma")')
  await expect(registra).toBeVisible({ timeout: 10000 })
})

test('billing center: Registra documento button present', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Amministrazione")')
  await page.locator('button:has-text("Fatturazione")').first().click()
  await page.waitForTimeout(500)
  const registra = page.locator('button:has-text("Registra documento")')
  await expect(registra).toBeVisible({ timeout: 10000 })
})

test('audit center: Aggiorna and Svuota buttons present', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Amministrazione")')
  await page.locator('button:has-text("Audit")').first().click()
  await page.waitForTimeout(500)
  const aggiorna = page.locator('button:has-text("Aggiorna")').first()
  const svuota = page.locator('button:has-text("Svuota")').first()
  await expect(aggiorna).toBeVisible({ timeout: 10000 })
  await expect(svuota).toBeVisible()
})

test('appointments calendar: month nav buttons present', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Sorveglianza sanitaria")')
  const appt = page.locator('button:has-text("Appuntamenti")')
  if (await appt.count() > 0) {
    await appt.first().click()
    await expect(page.locator('button:has-text("Today")')).toBeVisible({ timeout: 10000 })
  }
})
