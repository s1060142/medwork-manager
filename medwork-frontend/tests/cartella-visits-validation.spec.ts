import { test, expect } from '@playwright/test'
import path from 'path'

test('visualize full medical visit in Cartella Sanitaria', async ({ page }) => {
  const screenshotsDir = 'C:/Users/rober/.gemini/antigravity-ide/brain/64227543-d629-4f65-b5b9-d09e15e4b606'

  // Step 1: Login
  await page.goto('http://127.0.0.1:5173')
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="text"]').fill('doctor')
  await page.locator('input[type="password"]').fill('Doctor123!')
  await page.getByRole('button', { name: 'Accedi' }).click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  // Step 2: Navigate to Gestione Lavoratori -> Cartelle Sanitarie (All. 3A)
  const workersNavBtn = page.getByRole('button', { name: /Gestione Lavoratori/i })
  await workersNavBtn.click()
  await page.waitForTimeout(1000)

  const cartelleChip = page.getByRole('button', { name: /Cartelle Sanitarie/i })
  await cartelleChip.click()
  await page.waitForTimeout(1500)

  // Step 3: Switch to Tab "Storico & Dettaglio Visite Mediche"
  const visitsTab = page.getByRole('tab', { name: /Storico & Dettaglio Visite/i })
  if (await visitsTab.isVisible()) {
    await visitsTab.click()
    await page.waitForTimeout(1000)
  }

  // Step 4: Take screenshot
  await page.screenshot({ path: path.join(screenshotsDir, '05_cartella_sanitaria_full_visit.png'), fullPage: true })
})
