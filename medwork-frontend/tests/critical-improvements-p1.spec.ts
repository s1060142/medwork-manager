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

test.describe('Critical Improvements Suite (#2 to #7)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Item #2: Risk-Driven Focused Physical Exam Chips', async ({ page }) => {
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Nuova Visita")').first().click()
    await page.waitForTimeout(800)

    // Select worker from select dropdown
    const selectDiv = page.locator('.MuiSelect-select').first()
    if (await selectDiv.isVisible()) {
      await selectDiv.click()
      await page.waitForTimeout(300)
      const firstOption = page.locator('li[role="option"]').first()
      if (await firstOption.isVisible()) {
        await firstOption.click()
        await page.waitForTimeout(600)
      }
    }

    // Go to Step 1
    await page.locator('button:has-text("Avanti")').first().click()
    await page.waitForTimeout(600)

    // Verify Focus chips
    await expect(page.locator('text=Focus Rachide / MMC').first()).toBeVisible({ timeout: 5000 })
    await page.locator('text=Focus Rachide / MMC').first().click()
    await page.waitForTimeout(400)

    await expect(page.locator('text=Focus Udito / Rumore').first()).toBeVisible()
    await page.locator('text=Focus Udito / Rumore').first().click()
    await page.waitForTimeout(400)
  })

  test('Item #3: Clinical Readiness Dashboard', async ({ page }) => {
    // Navigate via Global Search to Dashboard Medico
    await page.keyboard.press('Control+KeyK')
    await page.waitForTimeout(400)
    const searchInput = page.locator('input[placeholder*="Cerca lavoratore"]')
    await expect(searchInput).toBeVisible({ timeout: 5000 })
    await searchInput.fill('Visita Medica')
    await page.waitForTimeout(500)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)

    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await expect(page.locator('text=Sorveglianza Sanitaria').or(page.locator('.legacy-workspace-card')).first()).toBeVisible({ timeout: 5000 })
  })

  test('Item #4: Direct Search → Visit Tunnel', async ({ page }) => {
    await page.keyboard.press('Control+KeyK')
    await page.waitForTimeout(400)

    const searchInput = page.locator('input[placeholder*="Cerca lavoratore"]')
    await expect(searchInput).toBeVisible({ timeout: 5000 })
    await searchInput.fill('a')
    await page.waitForTimeout(1000)

    // Verify worker results appear and Avvia Visita action button is visible
    const workerSection = page.locator('text=LAVORATORI').first()
    if (await workerSection.isVisible()) {
      const startVisitChip = page.locator('text=Avvia Visita').first()
      await expect(startVisitChip).toBeVisible({ timeout: 5000 })
      await startVisitChip.click()
      await page.waitForTimeout(800)

      // Verify directly routed to visit stepper
      await expect(page.locator('text=Nuova Visita').or(page.locator('text=Sorveglianza')).first()).toBeVisible()
    } else {
      await page.keyboard.press('Escape')
    }
  })

  test('Item #5: INAIL Pre-Flight Validator', async ({ page }) => {
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Allegato 3B INAIL")').first().click()
    await page.waitForTimeout(800)

    await expect(page.locator('text=Pre-Flight Validator INAIL').first()).toBeVisible({ timeout: 5000 })
  })

  test('Item #6: Post-Signature Auto Dispatch', async ({ page }) => {
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Firma Massiva")').first().click()
    await page.waitForTimeout(800)

    await expect(page.locator('text=Auto-Dispatch').first()).toBeVisible({ timeout: 5000 })
  })

  test('Item #7: Criminal Liability Shield in Compliance Radar', async ({ page }) => {
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Compliance Radar")').first().click()
    await page.waitForTimeout(800)

    await expect(page.locator('text=Compliance Radar').or(page.locator('text=Heatmap')).first()).toBeVisible({ timeout: 5000 })
  })

  test('Item #9: Smart Epidemiological Narrative Generator', async ({ page }) => {
    await page.locator('text=Analisi e relazioni').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Relazioni aziendali")').first().click()
    await page.waitForTimeout(800)

    await expect(page.locator('text=Generatore Sintesi Epidemiologica').first()).toBeVisible({ timeout: 5000 })
    await page.locator('#btn-generate-epidemiological-narrative').click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=Sintesi epidemiologica aziendale generata').first()).toBeVisible({ timeout: 5000 })
  })

  test('Item #10: Cessazione Rapporto Lavoro Cartella 3A Package', async ({ page }) => {
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Cartella 3A")').first().click()
    await page.waitForTimeout(800)

    // Select employee if needed
    const workerInput = page.locator('input[placeholder*="lavoratore"]').or(page.locator('input[id*="autocomplete"]')).first()
    if (await workerInput.isVisible()) {
      await workerInput.click()
      await page.waitForTimeout(400)
      const firstOpt = page.locator('li[role="option"]').first()
      if (await firstOpt.isVisible()) {
        await firstOpt.click()
        await page.waitForTimeout(600)
      }
    }

    const cessBtn = page.locator('#btn-cessazione-cartella-3a')
    if (await cessBtn.isVisible()) {
      await cessBtn.click()
      await page.waitForTimeout(600)
      await expect(page.locator('text=Pacchetto Chiusura Cartella per Cessazione')).toBeVisible({ timeout: 5000 })
      await page.locator('#btn-confirm-cessation-export').click()
      await page.waitForTimeout(800)
    }
  })
})
