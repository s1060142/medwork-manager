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

test.describe('E2E - Gestione Lavoratori', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    
    // Seleziona un'azienda per vedere i lavoratori
    const companyBtn = page.locator('button:has-text("Acme Industria S.p.A.")')
    if (await companyBtn.count() > 0) {
      await companyBtn.first().click()
    }

    await page.click('button:has-text("Gestione lavoratori")')
    await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
  })

  test('Lavoratori - Test pulsanti e azioni base', async ({ page }) => {
    // Nuova lavoratore
    await expect(page.locator('button:has-text("+ Nuovo lavoratore")').first()).toBeVisible()

    // Cerca un lavoratore esistente e apri profilo (se esiste)
    const profileBtn = page.locator('table tbody tr button:has-text("Profilo")').first()
    if (await profileBtn.count() > 0) {
      await profileBtn.click()
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      
      // Chiudi il modale
      const closeBtn = page.locator('[role="dialog"] button:has-text("Chiudi")').first()
      if (await closeBtn.count() > 0) {
        await closeBtn.click()
      } else {
        await page.keyboard.press('Escape')
      }
      await expect(page.locator('[role="dialog"]')).toHaveCount(0)
    }

    // Verifica pulsanti di ricerca e filtro
    await expect(page.locator('button:has-text("Ricerca lavoratori")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Filtra")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Reset")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Ricerca")').first()).toBeVisible()

    // Azioni d'insieme
    const massiveActions = ['Stampa', 'Stampe massive', 'Operazioni massive', 'Esporta dati in excel', 'Importa lavoratori']
    for (const btn of massiveActions) {
      await expect(page.locator(`button:has-text("${btn}")`).first()).toBeVisible()
    }
  })
})
