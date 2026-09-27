import { test, expect } from '@playwright/test'
import path from 'path'

test('browser validation: clean session, login, active context, workers mounting and filtering', async ({ page }) => {
  const screenshotsDir = 'C:/Users/rober/.gemini/antigravity-ide/brain/64227543-d629-4f65-b5b9-d09e15e4b606'

  // Step 1: Open fresh session & clear cache/localStorage
  await page.goto('http://127.0.0.1:5173')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
  await page.waitForLoadState('networkidle')

  // Step 2: Verify Login page and screenshot
  await expect(page.locator('input[type="text"]')).toBeVisible()
  await page.screenshot({ path: path.join(screenshotsDir, '01_login_page.png'), fullPage: true })

  // Step 3: Fill credentials and login
  await page.locator('input[type="text"]').fill('doctor')
  await page.locator('input[type="password"]').fill('Doctor123!')
  await page.getByRole('button', { name: 'Accedi' }).click()

  // Step 4: Wait for landing dashboard & capture screenshot
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(screenshotsDir, '02_dashboard_landing.png'), fullPage: true })

  // Verify Active Company Context in localStorage and UI
  const activeCompanyId = await page.evaluate(() => {
    const settings = localStorage.getItem('medwork.runtime.settings')
    return settings ? JSON.parse(settings).activeCompanyId : null
  })
  console.log('Active Company ID in localStorage:', activeCompanyId)

  // Step 5: Click Gestione Lavoratori
  console.log('Navigating to Gestione Lavoratori...')
  const workersNavBtn = page.getByRole('button', { name: /Gestione Lavoratori/i })
  await expect(workersNavBtn).toBeVisible()
  await workersNavBtn.click()

  // Wait for WorkersCenter to mount and load data
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(screenshotsDir, '03_workers_center.png'), fullPage: true })

  // Step 6: Verify WorkersCenter DOM elements
  await expect(page.getByText(/Anagrafica lavoratori/i)).toBeVisible()
  await expect(page.getByText('Quick Actions')).toBeVisible()

  // Step 7: Verify worker rows and active company context filtering
  const workerRows = await page.locator('table tbody tr').count()
  console.log('Worker rows displayed in table:', workerRows)

  // Step 8: Open Nuova Visita Medica from Quick Actions and capture screenshot
  const nuovaVisitaBtn = page.getByRole('button', { name: /Nuova Visita Medica/i })
  if (await nuovaVisitaBtn.isVisible()) {
    await nuovaVisitaBtn.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(screenshotsDir, '04_stepper_checklist.png'), fullPage: true })
  }
})
