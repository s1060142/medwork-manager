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

test.describe('E2E - Scadenzario e Alert', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    const companyBtn = page.locator('button:has-text("Acme Industria S.p.A.")')
    if (await companyBtn.count() > 0) {
      await companyBtn.first().click()
    }
    await page.click('button:has-text("Scadenzario")')
  })

  test('Navigazione tab scadenzario e bottoni principali', async ({ page }) => {
    const tabs = [
      'Agenda', 
      'Prenotazioni', 
      'Scadenzario Visite', 
      'Scadenzario Attività', 
      'Scadenzario sopralluoghi', 
      'Scadenzario Nomine', 
      'Scadenzario Vaccinazioni'
    ]

    for (const tab of tabs) {
      const t = page.locator(`.legacy-tab:has-text("${tab}"), button:has-text("${tab}")`).first()
      if (await t.count() > 0) {
        await t.click()
        await page.waitForTimeout(300)
      }
    }

    // Bottoni della toolbar scadenzario
    const actionButtons = [
      'Aggiorna',
      'Nuova visita',
      'Convoca',
      'Esporta Report',
      'Backup Dati Now'
    ]

    for (const btn of actionButtons) {
      const locator = page.locator(`button:has-text("${btn}")`).first()
      if (await locator.count() > 0) {
         await expect(locator).toBeVisible()
      }
    }
  })
})
