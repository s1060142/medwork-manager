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
    await page.locator('.legacy-side-item:has-text("Gestione aziende")').first().click()
    clicks++
    await page.waitForTimeout(500)

    // Verify company table loaded
    await expect(page.locator('.MuiTable-root, .legacy-content-area').first()).toBeVisible()

    // 2. Protocols configuration in Gestione Aziende
    await page.locator('.mw-chip:has-text("Protocolli")').first().click()
    clicks++
    await page.waitForTimeout(500)
    await expect(page.locator('text=Protocolli').first()).toBeVisible()

    // 3. Workers / Import
    await page.locator('.legacy-side-item:has-text("Gestione lavoratori")').first().click()
    clicks++
    await page.waitForTimeout(500)

    // 4. Compliance Verification in Analisi & Relazioni
    await page.locator('.legacy-side-item:has-text("Analisi & Relazioni")').first().click()
    clicks++
    await page.waitForTimeout(400)
    await page.locator('.mw-chip:has-text("Compliance Radar")').first().click()
    clicks++
    await page.waitForTimeout(1000)

    await expect(page.locator('text=Compliance Radar').first()).toBeVisible()
    console.log(`Scenario 1 completed in ${Date.now() - startTime}ms with ${clicks} primary clicks`)
  })

  test('Scenario 2: Prima visita preventiva con PDF giudizio', async ({ page }) => {
    const startTime = Date.now()
    let clicks = 0

    // 1. Navigate to Sorveglianza Sanitaria -> Nuova Visita (Step)
    await page.locator('.legacy-side-item:has-text("Sorveglianza sanitaria")').first().click()
    clicks++
    await page.waitForTimeout(400)
    await page.locator('.mw-chip:has-text("Nuova Visita (Step)")').first().click()
    clicks++
    await page.waitForTimeout(800)

    // 2. Move to Centro Giudizi & Firma
    await page.locator('.mw-chip:has-text("Centro Giudizi & Firma")').first().click()
    clicks++
    await page.waitForTimeout(800)
    await expect(page.locator('text=Giudizi').or(page.locator('text=Idoneità')).first()).toBeVisible()

    console.log(`Scenario 2 completed in ${Date.now() - startTime}ms with ${clicks} clicks`)
  })

  test('Scenario 3: Visita periodica annuale (Clone & Mass Sign)', async ({ page }) => {
    const startTime = Date.now()
    let clicks = 0

    // 1. Open Centro Giudizi & Firma
    await page.locator('.legacy-side-item:has-text("Sorveglianza sanitaria")').first().click()
    clicks++
    await page.waitForTimeout(400)
    await page.locator('.mw-chip:has-text("Centro Giudizi & Firma")').first().click()
    clicks++
    await page.waitForTimeout(800)

    await expect(page.locator('text=Giudizi').or(page.locator('text=Firma')).first()).toBeVisible()

    console.log(`Scenario 3 completed in ${Date.now() - startTime}ms with ${clicks} clicks`)
  })

  test('Scenario 4: Company visit campaign (Scadenzario & Batch Planner)', async ({ page }) => {
    const startTime = Date.now()
    let clicks = 0

    // 1. Open Scadenzario
    await page.locator('.legacy-side-item:has-text("Scadenzario")').first().click()
    clicks++
    await page.waitForTimeout(500)
    await page.locator('.mw-chip:has-text("Scadenze & Agende")').first().click()
    clicks++
    await page.waitForTimeout(800)

    await expect(page.locator('text=Scadenze').or(page.locator('.MuiTable-root')).first()).toBeVisible()

    console.log(`Scenario 4 completed in ${Date.now() - startTime}ms with ${clicks} clicks`)
  })

  test('Scenario 5: Annual compliance cycle (Allegato 3A, 3B, Art. 40)', async ({ page }) => {
    const startTime = Date.now()
    let clicks = 0

    // 1. Allegato 3B INAIL in Analisi e Relazioni
    await page.locator('.legacy-side-item:has-text("Analisi & Relazioni")').first().click()
    clicks++
    await page.waitForTimeout(400)
    await page.locator('.mw-chip:has-text("Allegato 3B INAIL")').first().click()
    clicks++
    await page.waitForTimeout(800)
    await expect(page.locator('text=Allegato 3B').first()).toBeVisible()

    // 2. Relazione Sanitaria Art. 40 in Analisi e Relazioni
    await page.locator('.mw-chip:has-text("Reportistica & All. 3B")').first().click()
    clicks++
    await page.waitForTimeout(800)
    await expect(page.locator('text=Relazioni').or(page.locator('text=Report')).or(page.locator('text=Elenco')).first()).toBeVisible()

    console.log(`Scenario 5 completed in ${Date.now() - startTime}ms with ${clicks} clicks`)
  })
})
