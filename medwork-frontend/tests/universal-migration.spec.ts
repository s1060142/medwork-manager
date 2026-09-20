import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }

async function loginAsAdmin(page: any) {
  await page.goto(BASE)
  const isLoginVisible = await page.locator('input[type="password"]').isVisible({ timeout: 2000 }).catch(() => false)
  if (isLoginVisible) {
    await page.fill('input[type="text"]', ADMIN_CRED.username)
    await page.fill('input[type="password"]', ADMIN_CRED.password)
    await page.click('button:has-text("Accedi")')
  }
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test.describe('Universal Migration Engine - Feature 1 Verification', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Navigate to Migration Center and perform full dry-run preview', async ({ page }) => {
    // 1. Go to Administration -> Migrazione & Import
    await page.locator('text=Amministrazione').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Migrazione & Import")').first().click()
    await page.waitForTimeout(600)

    // 2. Verify Stepper and Format cards
    await expect(page.locator('text=Universal Migration Engine')).toBeVisible()
    await expect(page.locator('text=Winasped / WinAspi')).toBeVisible()

    // 3. Move to Step 1 (Upload/Edit)
    await page.locator('button:has-text("Continua al Caricamento")').click()
    await page.waitForTimeout(400)
    await expect(page.locator('text=Carica il file esportato')).toBeVisible()

    // 4. Click Dry-Run validation
    const dryRunBtn = page.locator('button:has-text("Valida & Anteprima")')
    await expect(dryRunBtn).toBeVisible()
    await dryRunBtn.click()
    await page.waitForTimeout(1000)

    // 5. Verify Step 2 Dry-Run Results
    await expect(page.locator('text=Esito Validazione Preventiva')).toBeVisible()
    await expect(page.locator('text=Aziende Identificate')).toBeVisible()
    await expect(page.locator('text=Lavoratori Riconosciuti')).toBeVisible()
    await expect(page.locator('text=Visite Storiche Mappate')).toBeVisible()

    // Capture verification screenshot
    await page.screenshot({ path: 'tests/test-results/evidence/universal-migration.png', fullPage: true })
  })
})
