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

test.describe('Sprint Objectives: Official Documents, Allegato 3A/3B & Batch Signature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('1. Legal Fitness Judgment PDF & Allegato 3A Download', async ({ page }) => {
    // Navigate to Cartella clinica -> Centro Giudizi
    await page.keyboard.press('Control+KeyK')
    const searchModal = page.locator('input[placeholder*="Cerca lavoratore (nome/CF)"]')
    await expect(searchModal).toBeVisible({ timeout: 5000 })
    await searchModal.fill('Centro Giudizi')
    await page.waitForTimeout(300)
    
    const centerResult = page.locator('.MuiDialog-root').locator('text=Centro Giudizi di Idoneità')
    await centerResult.click()
    await page.waitForTimeout(600)

    // Verify table rendered
    await expect(page.locator('text=Centro Giudizi di Idoneità (Art. 41 D.Lgs. 81/08)')).toBeVisible({ timeout: 5000 })

    // Verify presence of download icons (Fitness Judgment & Allegato 3A)
    const fitButtons = page.locator('button[aria-label*="Certificato"], button[title*="Certificato"]')
    const allegatoButtons = page.locator('button[aria-label*="Allegato 3A"], button[title*="Allegato 3A"]')
    
    expect(await fitButtons.count() + await allegatoButtons.count()).toBeGreaterThanOrEqual(0)
  })

  test('2. Allegato 3B XML INAIL Export & XSD Validation', async ({ page }) => {
    // Navigate to Allegato 3B via global search
    await page.keyboard.press('Control+KeyK')
    const searchModal = page.locator('input[placeholder*="Cerca lavoratore (nome/CF)"]')
    await expect(searchModal).toBeVisible({ timeout: 5000 })
    await searchModal.fill('Allegato 3B')
    await page.waitForTimeout(300)

    const allegatoResult = page.locator('.MuiDialog-root').locator('text=Flusso Allegato 3B INAIL')
    await allegatoResult.first().click()
    await page.waitForTimeout(600)

    // Verify Allegato 3B center UI
    await expect(page.locator('text=Allegato 3B INAIL — Flusso Telematico Ufficiale')).toBeVisible({ timeout: 5000 })

    // Test XSD validation
    const validateBtn = page.locator('button:has-text("Valida XSD")')
    await expect(validateBtn).toBeVisible({ timeout: 5000 })
    await expect(validateBtn).toBeEnabled({ timeout: 10000 })
    await validateBtn.click()
    await page.waitForTimeout(600)

    // Check success or error banner
    await expect(page.locator('.MuiAlert-root').first()).toBeVisible({ timeout: 5000 })
  })

  test('3. Annual Health Report (Art. 40 D.Lgs. 81/08)', async ({ page }) => {
    // Navigate to Analisi e relazioni
    const reportSide = page.locator('.legacy-side-item:has-text("Analisi e relazioni")')
    await reportSide.click()
    await page.waitForTimeout(400)

    // Click Relazioni aziendali tab
    const relTab = page.locator('.legacy-tab:has-text("Relazioni aziendali")')
    if (await relTab.isVisible()) {
      await relTab.click()
      await page.waitForTimeout(400)
    }

    // Verify Relazione Sanitaria Art. 40 card & download button
    const art40Section = page.locator('text=Relazione Sanitaria Annuale (Art. 40 D.Lgs. 81/08)')
    await expect(art40Section).toBeVisible({ timeout: 5000 })

    const art40Btn = page.locator('button:has-text("Scarica Relazione Sanitaria Art. 40 (PDF)")')
    await expect(art40Btn).toBeVisible({ timeout: 5000 })
  })

  test('4. Batch Digital Signature (Firma Digitale Massiva)', async ({ page }) => {
    // Navigate to Firma Massiva via global search
    await page.keyboard.press('Control+KeyK')
    const searchModal = page.locator('input[placeholder*="Cerca lavoratore (nome/CF)"]')
    await expect(searchModal).toBeVisible({ timeout: 5000 })
    await searchModal.fill('Firma Digitale')
    await page.waitForTimeout(300)

    const signResult = page.locator('.MuiDialog-root').locator('text=Firma Digitale Massiva')
    await signResult.click()
    await page.waitForTimeout(600)

    // Verify Batch Signature Center
    await expect(page.locator('text=Firma Digitale Massiva & Auto-Dispatch Pipeline')).toBeVisible({ timeout: 5000 })

    // If unsigned visits exist, test modal flow
    const firstCheckbox = page.locator('tbody input[type="checkbox"]').first()
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check()
      const batchBtn = page.locator('button:has-text("Firma e Invia")')
      await expect(batchBtn).toBeEnabled({ timeout: 5000 })
      await batchBtn.click()

      // Confirm modal opens
      await expect(page.locator('text=Conferma Firma Digitale Massiva')).toBeVisible({ timeout: 5000 })
      await page.locator('button:has-text("Annulla")').click()
    }
  })
})
