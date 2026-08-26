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

test.describe('E2E - Gestione Aziende', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.click('button:has-text("Gestione aziende")')
  })

  test('Anagrafica - Test pulsanti principali', async ({ page }) => {
    await page.click('button:has-text("Anagrafica")')
    await expect(page.locator('text=Anagrafica').first()).toBeVisible()

    // Test: Nuova azienda button (apre e chiude il modale)
    await page.click('button:has-text("Nuova azienda")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.click('[role="dialog"] button:has-text("Annulla"), [role="dialog"] button:has-text("Chiudi")')
    await expect(page.locator('[role="dialog"]')).toHaveCount(0)

    // Test bottoni secondari (devono essere presenti, anche se stub)
    const actionButtons = [
      'Stampa',
      'Esporta dati in excel',
      'Operazioni massive',
      'Importa dati'
    ]
    for (const btn of actionButtons) {
      await expect(page.locator(`button:has-text("${btn}")`).first()).toBeVisible()
    }
  })

  test('Gruppi aziendali - Test pulsanti', async ({ page }) => {
    await page.click('button:has-text("Gruppi aziendali")')
    await expect(page.locator('text=Gruppi aziendali').first()).toBeVisible()
    
    await expect(page.locator('button:has-text("Nuovo")').first()).toBeVisible()
  })
})
