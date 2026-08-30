import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', ADMIN_CRED.username)
  await page.fill('input[type="password"]', ADMIN_CRED.password)
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test.describe('E2E - Amministrazione', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    const companyBtn = page.locator('button:has-text("Acme Industria S.p.A.")')
    if (await companyBtn.count() > 0) {
      await companyBtn.first().click()
    }
    await page.click('button:has-text("Amministrazione")')
  })

  test('Fatturazione e Strumenti', async ({ page }) => {
    // Strumenti
    await page.click('button:has-text("Strumenti")')
    await expect(page.locator('button:has-text("Registra firma")').first()).toBeVisible()

    // Fatturazione
    await page.click('button:has-text("Fatturazione")')
    await expect(page.locator('button:has-text("Genera fatture")').first()).toBeVisible()
  })

  test('Audit Logs - Bottoni', async ({ page }) => {
    await page.click('button:has-text("Audit")')
    
    const refreshBtn = page.locator('button:has-text("Aggiorna")').first()
    await expect(refreshBtn).toBeVisible()
    
    
    // Verifichiamo che il pulsante Aggiorna sia cliccabile
    await refreshBtn.click()
  })
})
