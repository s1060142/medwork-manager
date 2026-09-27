import { test, expect } from '@playwright/test'

test('debug login and workers navigation', async ({ page }) => {
  const networkLogs: { url: string; status: number; method: string }[] = []

  page.on('response', (response) => {
    networkLogs.push({
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
    })
  })

  page.on('console', (msg) => {
    console.log('BROWSER CONSOLE:', msg.type(), msg.text())
  })

  // Navigate to app
  await page.goto('http://127.0.0.1:5173')
  await page.waitForLoadState('networkidle')

  // Fill login
  await page.locator('input[type="text"]').fill('doctor')
  await page.locator('input[type="password"]').fill('Doctor123!')
  await page.getByRole('button', { name: 'Accedi' }).click()

  // Wait for post-login dashboard
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  console.log('Network logs after login:', JSON.stringify(networkLogs, null, 2))

  // Check localStorage
  const token = await page.evaluate(() => localStorage.getItem('accessToken'))
  const role = await page.evaluate(() => localStorage.getItem('role'))
  const settings = await page.evaluate(() => localStorage.getItem('medwork.runtime.settings'))
  console.log('localStorage token exists:', !!token)
  console.log('localStorage role:', role)
  console.log('localStorage settings:', settings)

  // Click Gestione Lavoratori
  console.log('Clicking Gestione Lavoratori...')
  const workersBtn = page.getByRole('button', { name: /Gestione Lavoratori/i })
  await expect(workersBtn).toBeVisible()
  await workersBtn.click()
  await page.waitForTimeout(1500)

  // Verify WorkersCenter loaded
  await expect(page.getByText(/Anagrafica lavoratori, idoneità e fascicoli sanitari/i)).toBeVisible()
  await expect(page.getByText('Quick Actions')).toBeVisible()
  console.log('WorkersCenter verified successfully!')

  // Click Sorveglianza Sanitaria and test Nuova Visita Medica with Checklist
  console.log('Navigating to Sorveglianza Sanitaria -> Nuova Visita Medica...')
  const surveillanceBtn = page.getByRole('button', { name: /Sorveglianza Sanitaria/i })
  await surveillanceBtn.click()
  await page.waitForTimeout(1000)

  const stepperChip = page.getByRole('button', { name: 'Nuova Visita Medica' })
  await expect(stepperChip).toBeVisible()
  await stepperChip.click()
  await page.waitForTimeout(1500)

  // Verify MedicalVisitStepper and Checklist Anamnestica loaded
  await expect(page.getByText(/Checklist Anamnestica per Mansione & Rischi \(Allegato 3A\)/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Applica check standard/i })).toBeVisible()
  console.log('MedicalVisitStepper Checklist verified successfully!')

  // Click Gestione Aziende and verify no duplicate tabs
  console.log('Navigating to Gestione Aziende...')
  const companiesBtn = page.getByRole('button', { name: /Gestione Aziende/i })
  await companiesBtn.click()
  await page.waitForTimeout(1500)

  // Verify companies table loaded
  await expect(page.getByText(/Acme Industria S.p.A./i).first()).toBeVisible()
  console.log('Gestione Aziende verified successfully!')
})
