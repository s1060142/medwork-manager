import { expect, test, type Page } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }

async function loginAsAdmin(page: Page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', ADMIN_CRED.username)
  await page.fill('input[type="password"]', ADMIN_CRED.password)
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 })
}

async function openGroups(page: Page) {
  await page.click('button:has-text("Gestione aziende")')
  await page.click('button:has-text("Gruppi aziendali")')
  await expect(page.locator('button:has-text("Nuovo Gruppo"), button:has-text("Crea il Tuo Primo Gruppo Aziendale")').first()).toBeVisible({ timeout: 10000 })
}


async function selectGroup(page: Page, name: string) {
  const combobox = page.getByLabel('Gruppo Attivo').first()
  await expect(combobox).toBeVisible({ timeout: 10000 })
  await combobox.click()
  await page.waitForTimeout(1000)
  const option = page.locator('[role="option"]').filter({ hasText: name }).first()
  await expect(option).toBeVisible({ timeout: 10000 })
  await option.click()
  await expect(page.locator('h5').filter({ hasText: name }).first()).toBeVisible({ timeout: 10000 })
}
async function reloadGroups(page: Page) {
  await page.reload({ waitUntil: 'networkidle' })
  await openGroups(page)
}

async function expectToast(page: Page, message: string) {
  await expect(page.getByText(message).first()).toBeVisible({ timeout: 10000 })
}

async function createGroup(page: Page, name: string) {
  await page.click('button:has-text("Nuovo Gruppo")')
  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Denominazione Gruppo *').fill(name)
  await dialog.getByLabel('Ragione Sociale Capogruppo *').fill(name + ' SRL')
  await dialog.getByRole('button', { name: 'Salva Gruppo' }).click()
  await expectToast(page, 'Gruppo aziendale creato con successo!')
  await page.waitForTimeout(1000)
  await reloadGroups(page)
  await selectGroup(page, name)
  await expect(page.locator('h5').filter({ hasText: name }).first()).toBeVisible()
}

async function acceptNextConfirmation(page: Page) {
  page.once('dialog', dialog => dialog.accept())
}

test.describe('Company Groups UI Validation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await openGroups(page)
  })

  test('creates, edits, persists, and deletes a group', async ({ page }) => {
    const name = 'UI-CG-' + Date.now()
    const editedName = name + '-EDITED'
    await createGroup(page, name)
    await reloadGroups(page)
    await selectGroup(page, name)

    await page.locator('button:has-text("Modifica Gruppo")').first().click()
    const editDialog = page.locator('[role="dialog"]')
    await expect(editDialog.getByLabel('Denominazione Gruppo *')).toHaveValue(name)
    await editDialog.getByLabel('Denominazione Gruppo *').fill(editedName)
    await editDialog.getByRole('button', { name: 'Salva Modifiche' }).click()
    await expectToast(page, 'Gruppo aziendale aggiornato con successo!')
    await expect(page.locator('h5').filter({ hasText: editedName }).first()).toBeVisible()

    await reloadGroups(page)
    await selectGroup(page, editedName)
    await expect(page.locator('h5').filter({ hasText: editedName }).first()).toBeVisible()

    acceptNextConfirmation(page)
    await page.locator('button:has-text("Elimina Gruppo")').first().click()
    await expectToast(page, 'Gruppo aziendale eliminato con successo!')
    await reloadGroups(page)
    const deletedCombobox = page.getByLabel('Gruppo Attivo').first()
    if (await deletedCombobox.count()) {
      await deletedCombobox.click()
      await expect(page.locator('[role="option"]').filter({ hasText: editedName })).toHaveCount(0)
    } else {
      await expect(page.getByText(editedName)).toHaveCount(0)
    }
  })

  test('adds and removes a company through the governance UI when data is available', async ({ page }) => {
    const name = 'UI-CG-COMPANY-' + Date.now()
    await createGroup(page, name)

    await page.locator('button:has-text("Governance & Struttura")').first().click()
    await expect(page.getByText('Aziende nel Gruppo').first()).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("Aggiungi Azienda")').first().click()
    const dialog = page.locator('[role="dialog"]')
    const select = dialog.locator('select').first()
    const optionCount = await select.locator('option').count()
    if (optionCount <= 1) {
      test.info().annotations.push({ type: 'skip', description: 'No available company is configured for this tenant' })
      await dialog.getByRole('button', { name: 'Annulla' }).click()
      acceptNextConfirmation(page)
      await page.locator('button:has-text("Elimina Gruppo")').first().click()
      await expectToast(page, 'Gruppo aziendale eliminato con successo!')
      return
    }

    await select.selectOption({ index: 1 })
    await dialog.getByRole('button', { name: 'Aggiungi' }).click()
    await expectToast(page, 'Azienda aggiunta al gruppo!')
    const companyRows = page.getByText('Aziende nel Gruppo', { exact: true }).first().locator('..').locator('table tbody tr')
    await expect(companyRows.first()).toBeVisible()

    acceptNextConfirmation(page)
    await companyRows.first().locator('button[color="error"]').click()
    await expectToast(page, 'Azienda rimossa dal gruppo')
    await reloadGroups(page)
    await page.locator('button:has-text("Governance & Struttura")').first().click()
    await expect(page.getByText('Aziende nel Gruppo').first()).toBeVisible()

    acceptNextConfirmation(page)
    await page.locator('button:has-text("Elimina Gruppo")').first().click()
    await expectToast(page, 'Gruppo aziendale eliminato con successo!')
  })

  test('adds and removes a group doctor through the governance UI when data is available', async ({ page }) => {
    const name = 'UI-CG-DOCTOR-' + Date.now()
    await createGroup(page, name)
    await page.locator('button:has-text("Governance & Struttura")').first().click()
    await page.locator('button:has-text("Associa Medico")').first().click()
    const dialog = page.locator('[role="dialog"]')
    const doctorSelect = dialog.locator('select').first()
    const optionCount = await doctorSelect.locator('option').count()
    if (optionCount <= 1) {
      test.info().annotations.push({ type: 'skip', description: 'No available doctor is configured for this tenant' })
      await dialog.getByRole('button', { name: 'Annulla' }).click()
      acceptNextConfirmation(page)
      await page.locator('button:has-text("Elimina Gruppo")').first().click()
      await expectToast(page, 'Gruppo aziendale eliminato con successo!')
      return
    }
    await doctorSelect.selectOption({ index: 1 })
    await dialog.locator('select').nth(1).selectOption({ index: 0 })
    await dialog.getByRole('button', { name: 'Associa' }).click()
    await expectToast(page, 'Medico associato al gruppo!')
    const doctorRows = page.getByText('Team Medico del Gruppo', { exact: true }).first().locator('..').locator('table tbody tr')
    await expect(doctorRows.first()).toBeVisible()
    acceptNextConfirmation(page)
    await doctorRows.first().locator('button[color="error"]').click()
    await expectToast(page, 'Medico rimosso dal team del gruppo')
    await reloadGroups(page)
    await page.locator('button:has-text("Governance & Struttura")').first().click()
    await expect(page.getByText('Team Medico del Gruppo').first()).toBeVisible()
    acceptNextConfirmation(page)
    await page.locator('button:has-text("Elimina Gruppo")').first().click()
    await expectToast(page, 'Gruppo aziendale eliminato con successo!')
  })

  test('exposes planning, compliance, and propagation actions', async ({ page }) => {
    const name = 'UI-CG-ACTIONS-' + Date.now()
    await createGroup(page, name)
    await page.locator('button:has-text("Pianificazione Massiva")').first().click()
    await expect(page.getByText('Strumenti di Pianificazione Operativa Gruppo').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("Pianifica Visite")')).toBeVisible()
    await expect(page.locator('button:has-text("Nuova Campagna Gruppo")')).toBeVisible()
    await expect(page.locator('button:has-text("Pianifica Sopralluoghi Art. 25")')).toBeVisible()
    await page.locator('button:has-text("Nuova Campagna Gruppo")').first().click()
    await expect(page.locator('[role="dialog"]').getByText('Lancia Campagna Sorveglianza Sanitaria Gruppo')).toBeVisible()
    await page.locator('[role="dialog"]').getByRole('button', { name: 'Annulla' }).click()
    await page.locator('button:has-text("Pianifica Sopralluoghi Art. 25")').first().click()
    await expect(page.locator('[role="dialog"]').getByText('Pianifica Sopralluoghi Ambienti di Lavoro')).toBeVisible()
    await page.locator('[role="dialog"]').getByRole('button', { name: 'Annulla' }).click()
    await page.locator('[role="tab"]').filter({ hasText: /Conformit/ }).first().click()
    await expect(page.getByText(/Radar Conformit/).first()).toBeVisible({ timeout: 10000 })
    const remediation = page.locator('button:has-text("Genera Cartelle"), button:has-text("Assegna Medico Gruppo"), button:has-text("Allinea Protocolli"), button:has-text("Risolvi")').first()
    if (await remediation.count()) {
      await remediation.click()
      await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10000 })
    }
    await page.locator('[role="tab"]').filter({ hasText: /Conformit/ }).first().click()
    await page.locator('button:has-text("Governance & Struttura")').first().click()
    await page.locator('button:has-text("Propaga Medici a Tutte le Aziende")').first().click()
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("Allinea Protocolli Sanitari di Gruppo")').first().click()
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10000 })
    acceptNextConfirmation(page)
    await page.locator('button:has-text("Elimina Gruppo")').first().click()
    await expectToast(page, 'Gruppo aziendale eliminato con successo!')
  })
})
