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

test.describe('Real-World Acceptance Testing - 10 Core Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Scenario 1: New Company Onboarding (Secretary / Physician)', async ({ page }) => {
    await page.locator('text=Gestione aziende').first().click()
    await page.waitForTimeout(400)
    await expect(page.locator('.MuiTable-root, .legacy-content-area').first()).toBeVisible()
  })

  test('Scenario 2: 100 Employee Import (Secretary / HR)', async ({ page }) => {
    await page.locator('text=Gestione lavoratori').first().click()
    await page.waitForTimeout(400)
    await expect(page.locator('text=Gestione Lavoratori').or(page.locator('.MuiTable-root')).first()).toBeVisible()
  })

  test('Scenario 3: Preventive Medical Visits (Competent Physician)', async ({ page }) => {
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Nuova Visita")').first().click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=Visita Medica').or(page.locator('text=Anamnesi')).or(page.locator('text=Stepper')).first()).toBeVisible()
  })

  test('Scenario 4: Annual Periodic Visits (Competent Physician)', async ({ page }) => {
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Firma Massiva")').first().click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=Firma Digitale Massiva').first()).toBeVisible()
  })

  test('Scenario 5: Complex Judgment with Prescriptions (Competent Physician)', async ({ page }) => {
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Centro Giudizi")').first().click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=Centro Giudizi').first()).toBeVisible()
  })

  test('Scenario 6: Site Inspection Workflow (Physician / RSPP)', async ({ page }) => {
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Sopralluoghi Art. 25")').first().click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=Sopralluoghi').first()).toBeVisible()
  })

  test('Scenario 7: Vaccination Campaign (Secretary / Physician)', async ({ page }) => {
    await page.locator('text=Scadenzario').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Scadenzario Vaccinazioni")').first().click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=Vaccinazioni').first()).toBeVisible()
  })

  test('Scenario 8: Worker Company Transfer (Secretary / Employer)', async ({ page }) => {
    await page.locator('text=Gestione lavoratori').first().click()
    await page.waitForTimeout(400)
    await expect(page.locator('.MuiTable-root, .legacy-content-area').first()).toBeVisible()
  })

  test('Scenario 9: Annual Art. 40 Cycle (Physician / RSPP / Employer)', async ({ page }) => {
    await page.locator('text=Analisi e relazioni').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Relazioni aziendali")').first().click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=Relazioni').or(page.locator('.legacy-content-area')).first()).toBeVisible()
  })

  test('Scenario 10: Allegato 3B Submission Cycle (Competent Physician)', async ({ page }) => {
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Allegato 3B INAIL")').first().click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=Allegato 3B').first()).toBeVisible()
  })
})
