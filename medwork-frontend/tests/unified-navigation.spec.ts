import { test, expect } from '@playwright/test'
import path from 'path'

test('visualize unified Sorveglianza Sanitaria navigation without duplicates', async ({ page }) => {
  const screenshotsDir = 'C:/Users/rober/.gemini/antigravity-ide/brain/64227543-d629-4f65-b5b9-d09e15e4b606'

  // Login
  await page.goto('http://127.0.0.1:5173')
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="text"]').fill('doctor')
  await page.locator('input[type="password"]').fill('Doctor123!')
  await page.getByRole('button', { name: 'Accedi' }).click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  // Navigate to Sorveglianza Sanitaria
  const healthNavBtn = page.getByRole('button', { name: /Sorveglianza Sanitaria/i })
  await healthNavBtn.click()
  await page.waitForTimeout(1500)

  // Capture screenshot of the unified navigation bar
  await page.screenshot({ path: path.join(screenshotsDir, '08_sorveglianza_sanitaria_unified.png'), fullPage: true })
})
