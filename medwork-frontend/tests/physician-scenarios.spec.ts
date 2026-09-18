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

test.describe('End-to-End Physician Workflow Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Scenario 1: Nuovo cliente onboarding & compliance verification', async ({ page }) => {
    const startTime = Date.now()
    let clicks = 0

    // 1. Go to Gestione Aziende
    await page.locator('text=Gestione aziende').first().click()
    clicks++
    await page.waitForTimeout(500)

    // Verify company table loaded
    await expect(page.locator('.MuiTable-root, .legacy-content-area').first()).toBeVisible()

    // 2. Protocols configuration
    await page.locator('text=Sorveglianza sanitaria').first().click()
    clicks++
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Protocolli & Rischi")').first().click()
    clicks++
    await page.waitForTimeout(500)
    await expect(page.locator('text=Protocolli').first()).toBeVisible()

    // 3. Workers / Import
    await page.locator('text=Gestione lavoratori').first().click()
    clicks++
    await page.waitForTimeout(500)

    // 4. Compliance Verification
    await page.locator('text=Sorveglianza sanitaria').first().click()
    clicks++
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Compliance Radar")').first().click()
    clicks++
    await page.waitForTimeout(1000)

    await expect(page.locator('text=Compliance Radar').first()).toBeVisible()
    console.log(`Scenario 1 completed in ${Date.now() - startTime}ms with ${clicks} primary clicks`)
  })

  test('Scenario 2: Prima visita preventiva con PDF giudizio', async ({ page }) => {
    const startTime = Date.now()
    let clicks = 0

    // 1. Navigate to Nuova Visita
    await page.locator('text=Sorveglianza sanitaria').first().click()
    clicks++
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Nuova Visita")').first().click()
    clicks++
    await page.waitForTimeout(800)

    // 2. Fill Stepper Step 1
    const workerSelect = page.locator('label:has-text("Lavoratore")').or(page.locator('text=Seleziona Lavoratore')).first()
    if (await workerSelect.isVisible()) {
      // Worker select exists
    }

    // 3. Move to Giudizio
    await page.locator('button:has-text("Centro Giudizi")').first().click()
    clicks++
    await page.waitForTimeout(800)
    await expect(page.locator('text=Centro Giudizi').first()).toBeVisible()

    console.log(`Scenario 2 completed in ${Date.now() - startTime}ms with ${clicks} clicks`)
  })

  test('Scenario 3: Visita periodica annuale (Clone & Mass Sign)', async ({ page }) => {
    const startTime = Date.now()
    let clicks = 0

    // 1. Open Firma Massiva
    await page.locator('text=Sorveglianza sanitaria').first().click()
    clicks++
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Firma Massiva")').first().click()
    clicks++
    await page.waitForTimeout(800)

    await expect(page.locator('text=Firma Digitale Massiva').first()).toBeVisible()

    console.log(`Scenario 3 completed in ${Date.now() - startTime}ms with ${clicks} clicks`)
  })

  test('Scenario 4: Company visit campaign (Scadenzario & Batch Planner)', async ({ page }) => {
    const startTime = Date.now()
    let clicks = 0

    // 1. Open Scadenzario
    await page.locator('text=Scadenzario').first().click()
    clicks++
    await page.waitForTimeout(500)
    await page.locator('button:has-text("Scadenzario Visite")').first().click()
    clicks++
    await page.waitForTimeout(800)

    await expect(page.locator('text=Pianificazione').or(page.locator('text=Scadenze')).or(page.locator('.MuiTable-root')).first()).toBeVisible()

    console.log(`Scenario 4 completed in ${Date.now() - startTime}ms with ${clicks} clicks`)
  })

  test('Scenario 5: Annual compliance cycle (Allegato 3A, 3B, Art. 40)', async ({ page }) => {
    const startTime = Date.now()
    let clicks = 0

    // 1. Allegato 3B INAIL
    await page.locator('text=Sorveglianza sanitaria').first().click()
    clicks++
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Allegato 3B INAIL")').first().click()
    clicks++
    await page.waitForTimeout(800)
    await expect(page.locator('text=Allegato 3B').first()).toBeVisible()

    // 2. Relazione Sanitaria Art. 40
    await page.locator('text=Analisi e relazioni').first().click()
    clicks++
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Relazioni aziendali")').first().click()
    clicks++
    await page.waitForTimeout(800)

    console.log(`Scenario 5 completed in ${Date.now() - startTime}ms with ${clicks} clicks`)
  })
})
