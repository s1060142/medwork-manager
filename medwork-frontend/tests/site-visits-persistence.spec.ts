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

async function navigateToSopralluoghi(page: any) {
  await page.keyboard.press('Control+KeyK')
  const searchModal = page.locator('input[placeholder*="Cerca lavoratore (nome/CF)"]')
  await expect(searchModal).toBeVisible({ timeout: 5000 })
  await searchModal.fill('Sopralluoghi')
  await page.waitForTimeout(300)
  
  const sopralluoghiResult = page.locator('.MuiDialog-root').locator('text=Sopralluoghi Ambienti di Lavoro')
  await sopralluoghiResult.click()
  await page.waitForTimeout(600)
}

test.describe('Workflow Verification: Site Visits (Sopralluoghi Art. 25 D.Lgs. 81/08)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Plan site visit, save inspection report, verify persistence across reloads', async ({ page }) => {
    // 1. Navigate to Sopralluoghi via Global Search / Menu
    await navigateToSopralluoghi(page)

    // Verify header
    await expect(page.locator('text=Sopralluoghi Ambienti di Lavoro')).toBeVisible({ timeout: 5000 })

    // 2. Click "Pianifica Nuovo Sopralluogo"
    await page.click('button:has-text("Pianifica Nuovo Sopralluogo"), button:has-text("Pianifica il primo sopralluogo")')
    await expect(page.locator('text=Pianifica Sopralluogo Ambienti di Lavoro')).toBeVisible()

    // Fill unique structure name
    const uniqueReparto = `Reparto Assemblaggio 4.0 - ${Date.now().toString().slice(-4)}`
    const structureInput = page.locator('input[placeholder*="Reparto"], input[value*="Stabilimento Principale"]').first()
    await structureInput.fill(uniqueReparto)

    const notesInput = page.locator('textarea[placeholder*="microclima"]')
    await notesInput.fill('Verifica conformità microclima estivo e postazioni sollevamento carichi pesanti.')

    // Submit
    await page.click('button:has-text("Conferma Pianificazione")')
    await page.waitForTimeout(1000)

    // 3. Verify in table
    await expect(page.locator(`text=${uniqueReparto}`)).toBeVisible({ timeout: 5000 })

    // 4. Reload page to verify persistence
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await navigateToSopralluoghi(page)
    await expect(page.locator(`text=${uniqueReparto}`)).toBeVisible({ timeout: 5000 })

    // 5. Record inspection report / verbale
    const targetRow = page.locator(`tr:has-text("${uniqueReparto}")`)
    await targetRow.locator('button:has-text("Verbale")').click()
    await expect(page.locator('text=Verbale di Sopralluogo & Rilievi')).toBeVisible()

    // Set outcome to "Con Prescrizioni"
    const outcomeSelect = page.locator('.MuiDialog-root').locator('div[role="combobox"]').first()
    await outcomeSelect.click()
    await page.click('li[data-value="Con Prescrizioni"]')

    const verbaleNotes = page.locator('textarea[placeholder*="Dettagliare lo stato"]')
    await verbaleNotes.fill('Rilevata necessità di installare ausili meccanici per movimentazione sopra 15kg.')

    // Save report
    await page.click('button:has-text("Salva Verbale Ufficiale")')
    await page.waitForTimeout(1000)

    // 6. Verify updated outcome in table
    await expect(targetRow.locator('text=Con Prescrizioni')).toBeVisible()

    // 7. Reload page to verify persistence of verbale and business outcome
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await navigateToSopralluoghi(page)
    await expect(page.locator(`tr:has-text("${uniqueReparto}")`).locator('text=Con Prescrizioni')).toBeVisible({ timeout: 5000 })
  })
})
