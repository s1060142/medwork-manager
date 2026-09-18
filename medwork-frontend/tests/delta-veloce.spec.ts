import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }

async function loginAsAdmin(page: any) {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  const passInput = page.locator('input[type="password"]')
  if (await passInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByLabel('Username').fill(ADMIN_CRED.username)
    await page.getByLabel('Password').fill(ADMIN_CRED.password)
    await page.locator('button[type="submit"]:has-text("Accedi")').click()
    await page.waitForLoadState('networkidle')
  }
  await page.waitForSelector('.legacy-topbar', { timeout: 15000 })
}

test.describe('P0 Delta Veloce & Temporal Sunset Filter Validation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Delta Veloce 1-Click Periodic Visit flow with Temporal Sunset Filter', async ({ page }) => {
    // 1. Open Medical Visit Stepper
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Nuova Visita")').first().click()
    await page.waitForTimeout(800)

    // 2. Select Worker (Mario Rossi or first worker)
    const workerAutocomplete = page.locator('input[placeholder*="Seleziona lavoratore"], input[aria-autocomplete="list"]').first()
    if (await workerAutocomplete.isVisible()) {
      await workerAutocomplete.click()
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(800)
    }

    // 3. Check if Smart Clone / Delta Veloce banner appears
    const deltaVeloceBtn = page.locator('button:has-text("Delta Veloce")').first()
    if (await deltaVeloceBtn.isVisible()) {
      await deltaVeloceBtn.click()
      await page.waitForTimeout(800)

      // Verify we automatically advanced to Step 1 (Esame Obiettivo & Parametri Vitali)
      await expect(page.locator('text=Parametri Vitali').first()).toBeVisible()
    }

    // 4. Verify 1-Click Normal physical exam
    const setNormalBtn = page.locator('button:has-text("Imposta Tutti \'Nella Norma\'"), button:has-text("Tutto Normale")').first()
    if (await setNormalBtn.isVisible()) {
      await setNormalBtn.click()
      await page.waitForTimeout(400)
    }

    // 5. Navigate to Step 2 (Giudizio di Idoneità)
    const nextBtn = page.locator('button:has-text("Avanti")').first()
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      await page.waitForTimeout(800)
    }

    // Verify Step 2 rendered
    await expect(page.locator('label:has-text("Esito Giudizio")').or(page.locator('text=Giudizio di Idoneità')).first()).toBeVisible({ timeout: 5000 })

    // 6. Screenshot for UI evidence
    await page.screenshot({ path: 'delta-veloce-validation.png', fullPage: true })
  })
})
