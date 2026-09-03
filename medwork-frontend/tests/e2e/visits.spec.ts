import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.getByLabel('Tenant').fill('default')
  await page.getByLabel('Username').fill(ADMIN_CRED.username)
  await page.getByLabel('Password').fill(ADMIN_CRED.password)
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test.describe('E2E - Sorveglianza Sanitaria e Visite', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    const companyBtn = page.locator('button:has-text("Acme Industria S.p.A.")')
    await companyBtn.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
    if (await companyBtn.count() > 0) {
      await companyBtn.first().click()
      await page.waitForTimeout(500)
    }
    await page.click('button:has-text("Sorveglianza sanitaria")')
    await page.waitForTimeout(500)
  })

  test('Nuova visita medica - Stepper completo', async ({ page }) => {
    // La vista "Nuova visita" è la schermata di default aprendo "Sorveglianza sanitaria"
    // quindi non serve cliccare il tab.
    await expect(page.getByText('Inserimento Visita Medica', { exact: false })).toBeVisible({ timeout: 15000 })
    
    // Step 1: Anamnesi
    await expect(page.locator('text=Anamnesi Lavorativa').first()).toBeVisible()
    
    // Seleziona Lavoratore e Medico
    // Playwright locator per mui select
    await page.getByLabel('Lavoratore *').click()
    await page.getByRole('option').nth(0).click()

    await page.getByLabel('Medico *').click()
    await page.getByRole('option').nth(0).click()

    // Click Avanti
    const forwardBtn = page.locator('button:has-text("Avanti")').first()
    await forwardBtn.click()
    
    // Step 2: Esame Obiettivo
    await expect(page.locator('text=Cardiovascolare').first()).toBeVisible()
    await page.getByLabel('Organi bersaglio *').fill('Apparato visivo')
    await forwardBtn.click()

    // Step 3: Giudizio
    // Il bottone Salva apparirà in questo step
    
    // Salva
    await page.getByLabel('Esito Giudizio di Idoneità *').click()
    await page.getByRole('option', { name: 'Idoneo alla mansione', exact: false }).first().click()
    await page.getByLabel('Prossima scadenza *').fill('01/01/2030')
    const saveBtn = page.locator('button:has-text("Salva Visita")').first()
    await saveBtn.click()
    
    // Successo - Torna automaticamente alla lista principale
    await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10000 })
  })

  test.skip('Protocolli Sanitari - Pulsanti', async ({ page }) => {
    const protocolliTab = page.locator('.legacy-tab:has-text("Protocolli"), button:has-text("Protocolli")').first()
    await protocolliTab.click()
    await expect(page.getByText('Protocollo', { exact: false }).first()).toBeVisible({ timeout: 10000 })

    await expect(page.locator('button:has-text("+ Nuovo protocollo")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Stampa")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Esporta excel")').first()).toBeVisible()
  })
})
