import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const API_URL = 'http://127.0.0.1:5279'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', ADMIN_CRED.username)
  await page.fill('input[type="password"]', ADMIN_CRED.password)
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

async function expectGroupOption(page, groupName) {
  const selector = page.getByLabel('Gruppo Attivo')
  await selector.click()
  await expect(selector.locator('[role="option"]').filter({ hasText: groupName }).first()).toBeVisible()
}

test.describe('E2E - Gruppi Aziendali', () => {
  test('Full UI flow: create group, manage members, plan, compliance, persistence', { timeout: 180000 }, async ({ page, context }) => {
    test.setTimeout(300000)

  // After a page reload the component re-mounts and auto-selects the first group
  // in the list (which may be a stale leftover), not the one just created/modified.
  // Re-select the created group explicitly.
  const selectCreatedGroup = async () => {
    await page.click('button:has-text("Gruppi aziendali")')
    await page.waitForTimeout(500)
    await page.getByLabel('Gruppo Attivo').first().click()
    await page.locator('[role="option"]').filter({ hasText: groupName }).first().click()
    await page.waitForTimeout(500)
  }
    await loginAsAdmin(page)
    await page.click('button:has-text("Gruppi aziendali")')
    await page.waitForTimeout(500)

    const groupName = `UI VALIDATION ${Date.now()}`
    await page.click('button:has-text("Nuovo Gruppo")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.getByLabel('Denominazione Gruppo *').fill(groupName)
    await page.getByLabel('Ragione Sociale Capogruppo *').fill('UI Validation SRL')
    await page.click('[role="dialog"] button:has-text("Salva Gruppo")')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Gruppo aziendale creato con successo!').first()).toBeVisible({ timeout: 10000 })
    await expectGroupOption(page, groupName)
    await page.keyboard.press('Escape')

    await page.click('button:has-text("Dashboard Gruppo")')
    await page.waitForTimeout(1500)
    const kpiTitles = [
      'Aziende nel Gruppo',
      'Sedi & Filiali Operative',
      'Lavoratori in Sorveglianza',
      'Protocolli Sanitari Attivi',
      'Visite in Scadenza (60gg)',
      'Visite Periodiche Scadute',
      'Sopralluoghi ex Art. 25',
      'Nomine MC in Scadenza',
      'Scadenze Vaccinali',
      'Alert di Conformità Attivi',
    ]
    expect(kpiTitles.length).toBe(10)
    for (const title of kpiTitles) {
      await expect(page.locator(`text=${title}`).first()).toBeVisible({ timeout: 10000 })
    }
    const h4Els = page.locator('[class*="MuiTypography-h4"]')
    const h4Count = await h4Els.count()
    expect(h4Count).toBeGreaterThanOrEqual(10)
    for (let i = 0; i < 10; i++) {
      const value = await h4Els.nth(i).textContent()
      expect(value?.trim()).not.toBe('')
    }

    await page.click('button:has-text("Governance & Struttura")')
    await page.waitForTimeout(1000)
    await page.click('button:has-text("Aggiungi Azienda")')
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    const companySelect = page.locator('[role="dialog"] [role="combobox"]').first()
    await companySelect.click({ force: true })
    let optionCount = await page.locator('[role="listbox"] [role="option"]').count()
    if (optionCount <= 1) {
      const loginRes = await page.request.post(`${API_URL}/api/auth/login`, {
        data: { username: 'admin', password: 'Admin123!', tenantSlug: 'default' },
      })
      const token = (await loginRes.json()).accessToken
      await page.request.post(`${API_URL}/api/admin-data/companies`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: {
          name: `SEED-${Date.now()}`,
          legalName: `SEED ${Date.now()} SRL`,
          vatNumber: `IT${Date.now().toString().slice(-11)}`,
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
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await selectCreatedGroup()
    await page.click('button:has-text("Governance & Struttura")')
    await page.waitForTimeout(1500)
    await expect(page.locator('text=Aziende nel Gruppo').first()).toBeVisible()
    await expect(page.locator('text=Aziende nel Gruppo').first().locator('..').locator('..').locator('table tbody tr').first()).toBeVisible()

    await page.click('button:has-text("Associa Medico")')
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    const dialog = page.getByRole('dialog')
    // MUI Select renders a bare <label> without a 'for' attribute, so getByLabel() cannot
    // resolve it. Click the comboboxes directly (role combobox = MUI Select input).
    // The listbox options are portaled outside the dialog, so use page-scoped locators.
    await dialog.getByRole('combobox').nth(1).click({ force: true })
    await page.getByRole('option', { name: 'Medico Competente Principale' }).click({ force: true })
    await dialog.getByRole('combobox').first().click()
    await expect(page.getByRole('option').first()).toBeVisible()
    await page.getByRole('option').first().click()
    await dialog.getByRole('button', { name: 'Associa' }).click()
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Medico associato al gruppo!').first()).toBeVisible({ timeout: 10000 })
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await selectCreatedGroup()
    await page.click('button:has-text("Governance & Struttura")')
    await page.waitForTimeout(1500)
    await expect(page.locator('text=Team Medico del Gruppo').first()).toBeVisible()

    await page.click('button:has-text("Governance & Struttura")')
    await page.waitForTimeout(1000)
    await page.click('button:has-text("Propaga Medici a Tutte le Aziende")')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=/nomine mediche propagate/').first()).toBeVisible({ timeout: 10000 })
    await page.click('button:has-text("Allinea Protocolli Sanitari di Gruppo")')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=/Protocolli di gruppo propagati/').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Team Medico del Gruppo').first().locator('..').locator('..').locator('table tbody tr').first()).toBeVisible()

    const companyRowCountBefore = await page.locator('text=Aziende nel Gruppo').first().locator('..').locator('..').locator('table tbody tr').count()
    const acceptDialog = (dlg) => dlg.accept()
    page.on('dialog', acceptDialog)
    await page.locator('text=Aziende nel Gruppo').first().locator('..').locator('..').locator('table tbody tr').first().locator('td:last-child button').click()
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Azienda rimossa dal gruppo').first()).toBeVisible({ timeout: 10000 })
    page.removeListener('dialog', acceptDialog)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await selectCreatedGroup()
    await page.click('button:has-text("Governance & Struttura")')
    await page.waitForTimeout(1500)
    const companyRowCountAfter = await page.locator('text=Aziende nel Gruppo').first().locator('..').locator('..').locator('table tbody tr').count()
    expect(companyRowCountAfter).toBe(companyRowCountBefore - 1)

    const doctorRowCountBefore = await page.locator('text=Team Medico del Gruppo').first().locator('..').locator('..').locator('table tbody tr').count()
    page.on('dialog', acceptDialog)
    await page.locator('text=Team Medico del Gruppo').first().locator('..').locator('..').locator('table tbody tr').first().locator('td:last-child button').click()
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Medico rimosso dal team del gruppo').first()).toBeVisible({ timeout: 10000 })
    page.removeListener('dialog', acceptDialog)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await selectCreatedGroup()
    await page.click('button:has-text("Governance & Struttura")')
    await page.waitForTimeout(1500)
    const doctorRowCountAfter = await page.locator('text=Team Medico del Gruppo').first().locator('..').locator('..').locator('table tbody tr').count()
    expect(doctorRowCountAfter).toBe(doctorRowCountBefore - 1)

    await page.click('button:has-text("Pianificazione Massiva")')
    await page.waitForTimeout(1000)
    const candidateCheckboxes = page.locator('table tbody tr input[type="checkbox"]')
    const checkboxCount = await candidateCheckboxes.count()
    if (checkboxCount > 0) {
      await candidateCheckboxes.first().check()
      await page.click('button:has-text("Pianifica Visite")')
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
      await page.click('[role="dialog"] button:has-text("Conferma e Pianifica")')
      await page.waitForTimeout(2000)
      await expect(page.locator('text=Visite pianificate con successo!').first()).toBeVisible({ timeout: 10000 })
    }

    await page.click('button:has-text("Nuova Campagna Gruppo")')
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    await page.click('[role="dialog"] button:has-text("Avvia Campagna Gruppo")')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=/Campagna .* attivata con successo/').first()).toBeVisible({ timeout: 10000 })

    await page.click('button:has-text("Pianifica Sopralluoghi Art. 25")')
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    await page.click('[role="dialog"] button:has-text("Programma per Tutte le Aziende")')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=/sopralluoghi pianificati con successo/').first()).toBeVisible({ timeout: 10000 })

    await page.click('button:has-text("Conformità & Alert D.Lgs 81/08")')
    await page.waitForTimeout(1500)
    const remediationBtn = page.locator('button:has-text("Risolvi"), button:has-text("Genera Cartelle"), button:has-text("Assegna Medico Gruppo"), button:has-text("Allinea Protocolli")').first()
    if (await remediationBtn.count() > 0) {
      await remediationBtn.click()
      await page.waitForTimeout(2000)
      await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10000 })
    }

    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.click('button:has-text("Gruppi aziendali")')
    await page.waitForTimeout(500)
    await expectGroupOption(page, groupName)
    await page.keyboard.press('Escape')
  })
})

