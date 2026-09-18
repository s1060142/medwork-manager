import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const API_URL = 'http://127.0.0.1:5279'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }

test('debug associate doctor dialog', async ({ page }) => {
  await page.goto(BASE)
  await page.fill('input[type="text"]', ADMIN_CRED.username)
  await page.fill('input[type="password"]', ADMIN_CRED.password)
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })

  await page.click('button:has-text("Gruppi aziendali")')
  await page.waitForTimeout(500)

  const groupName = 'UI VALIDATION ' + Date.now()
  await page.click('button:has-text("Nuovo Gruppo")')
  await expect(page.locator('[role="dialog"]')).toBeVisible()
  await page.getByLabel('Denominazione Gruppo *').fill(groupName)
  await page.getByLabel('Ragione Sociale Capogruppo *').fill('UI Validation SRL')
  await page.click('[role="dialog"] button:has-text("Salva Gruppo")')
  await page.waitForTimeout(2000)
  await expect(page.locator('text=Gruppo aziendale creato con successo!').first()).toBeVisible({ timeout: 10000 })

  await page.click('button:has-text("Governance & Struttura")')
  await page.waitForTimeout(1000)
  await page.click('button:has-text("Aggiungi Azienda")')
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  const companySelect = page.locator('[role="dialog"] [role="combobox"]').first()
  await companySelect.click({ force: true })
  let optionCount = await page.locator('[role="listbox"] [role="option"]').count()
  if (optionCount <= 1) {
    const loginRes = await page.request.post(API_URL + '/api/auth/login', {
      data: { username: 'admin', password: 'Admin123!', tenantSlug: 'default' },
    })
    const token = (await loginRes.json()).accessToken
    await page.request.post(API_URL + '/api/admin-data/companies', {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      data: {
        name: 'SEED-' + Date.now(),
        legalName: 'SEED ' + Date.now() + ' SRL',
        vatNumber: 'IT' + Date.now().toString().slice(-11),
        email: 'seed@example.com',
        phone: '0000000000',
      },
    })
    await page.click('[role="dialog"] button:has-text("Annulla")')
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.click('button:has-text("Gruppi aziendali")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("Governance & Struttura")')
    await page.waitForTimeout(1000)
    await page.click('button:has-text("Aggiungi Azienda")')
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    await page.locator('[role="dialog"] [role="combobox"]').first().click({ force: true })
    optionCount = await page.locator('[role="listbox"] [role="option"]').count()
  }
  await page.locator('[role="listbox"] [role="option"]').nth(1).click({ force: true })
  await page.click('[role="dialog"] button:has-text("Aggiungi")')
  await page.waitForTimeout(2000)
  await expect(page.locator('text=Azienda aggiunta al gruppo!').first()).toBeVisible({ timeout: 10000 })

  await page.click('button:has-text("Associa Medico")')
  await page.waitForTimeout(2000)

  const dialog = page.locator('[role="dialog"]').first()
  console.log('Dialog count:', await page.locator('[role="dialog"]').count())
  console.log('Dialog visible:', await dialog.isVisible())

  const labels = await dialog.locator('label, [role="combobox"]').all()
  for (const l of labels) {
    console.log('Label/combobox:', await l.textContent(), '| aria-label:', await l.getAttribute('aria-label'), '| id:', await l.getAttribute('id'))
  }

  const comboboxes = await dialog.locator('[role="combobox"]').all()
  console.log('Combobox count in dialog:', comboboxes.length)
  for (let i = 0; i < comboboxes.length; i++) {
    const text = await comboboxes[i].textContent()
    console.log('Combobox ' + i + ': "' + text + '"')
  }

  await page.screenshot({ path: '/tmp/debug-doctor-dialog.png' })

  if (comboboxes.length >= 2) {
    await comboboxes[1].click({ force: true })
    await page.waitForTimeout(1000)
    const options = await page.locator('[role="listbox"] [role="option"]').all()
    console.log('Options count:', options.length)
    for (const o of options) {
      console.log('Option:', await o.textContent())
    }
    if (options.length > 0) {
      await options[0].click({ force: true })
      await page.waitForTimeout(500)
    }
    await page.locator('[role="dialog"] button:has-text("Associa")').click({ force: true })
    await page.waitForTimeout(2000)
    const toast = await page.locator('text=Medico associato al gruppo!').first()
    console.log('Toast visible:', await toast.isVisible().catch(() => false))
  }
})
