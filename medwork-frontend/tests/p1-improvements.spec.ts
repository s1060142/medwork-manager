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

test.describe('P1 Product Improvements Suite', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('1. Dashboard "Il Mio Giorno" & One-Click Appointment → Visit', async ({ page }) => {
    // Navigate to Il Mio Giorno
    const dashBtn = page.locator('.legacy-side-item:has-text("Il Mio Giorno")')
    await expect(dashBtn.first()).toBeVisible({ timeout: 5000 })
    await dashBtn.first().click()
    await page.waitForTimeout(500)

    // Verify KPI Cards
    await expect(page.locator('text=VISITE IN PROGRAMMA OGGI')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=GIUDIZI DA FIRMARE')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=COMPLIANCE D.LGS. 81/08')).toBeVisible({ timeout: 5000 })

    // Verify Agenda Pazienti table
    await expect(page.locator('text=Agenda Pazienti & Visite del Giorno')).toBeVisible({ timeout: 5000 })

    // Test One-Click Avvia Visita
    const avviaBtn = page.locator('button:has-text("Avvia Visita")').first()
    if (await avviaBtn.isVisible()) {
      await avviaBtn.click()
      await page.waitForTimeout(600)
      // Stepper should open
      await expect(page.locator('text=Nuova Visita Medica & Sorveglianza Sanitaria')).toBeVisible({ timeout: 5000 })
    }
  })

  test('2. Compliance Radar & Company Risk Heatmap', async ({ page }) => {
    // Navigate to Compliance via Global Search
    await page.keyboard.press('Control+KeyK')
    const searchModal = page.locator('input[placeholder*="Cerca lavoratore (nome/CF)"]')
    await expect(searchModal).toBeVisible({ timeout: 5000 })
    await searchModal.fill('Centro Giudizi')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')

    // Navigate to Il Mio Giorno and click Compliance Radar card
    const dashBtn = page.locator('.legacy-side-item:has-text("Il Mio Giorno")')
    await dashBtn.first().click()
    await page.waitForTimeout(400)

    const compCard = page.locator('text=COMPLIANCE D.LGS. 81/08')
    await compCard.click()
    await page.waitForTimeout(600)

    await expect(page.locator('text=Compliance Radar & Heatmap Aziendale')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=INDICE COMPLIANCE GLOBALE')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Heatmap Rischio Aziendale')).toBeVisible({ timeout: 5000 })
  })

  test('3. Smart Protocol Generator (D.Lgs. 81/08)', async ({ page }) => {
    // Navigate to Protocols via Global Search
    await page.keyboard.press('Control+KeyK')
    const searchModal = page.locator('input[placeholder*="Cerca lavoratore (nome/CF)"]')
    await expect(searchModal).toBeVisible({ timeout: 5000 })
    await searchModal.fill('Protocolli')
    await page.waitForTimeout(300)

    const protResult = page.locator('.MuiDialog-root').locator('text=Protocolli Sanitari & Rischi')
    await protResult.click()
    await page.waitForTimeout(600)

    // Open Smart Protocol Generator modal
    const smartBtn = page.locator('button:has-text("Smart Protocol Generator")')
    await expect(smartBtn).toBeVisible({ timeout: 5000 })
    await smartBtn.click()

    // Dialog should display presets
    await expect(page.locator('text=Smart Protocol Generator (D.Lgs. 81/08)')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Rischio Rumore')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Videoterminale')).toBeVisible({ timeout: 5000 })

    // Generate Rumore protocol
    const applyBtn = page.locator('button:has-text("Genera & Applica Protocollo")').first()
    await applyBtn.click()
    await page.waitForTimeout(600)

    // Should appear in table
    await expect(page.locator('text=Protocollo Sorveglianza Rumore').first()).toBeVisible({ timeout: 5000 })
  })

  test('4. Batch Visit Planner (Massive Scheduling Session)', async ({ page }) => {
    // Navigate to Scadenzario -> Scadenzario Visite
    const schedSide = page.locator('.legacy-side-item:has-text("Scadenzario")')
    await schedSide.click()
    await page.waitForTimeout(400)

    const visitPlanTab = page.locator('.legacy-tab:has-text("Scadenzario Visite")')
    if (await visitPlanTab.isVisible()) {
      await visitPlanTab.click()
      await page.waitForTimeout(500)
    }

    // Verify Pianificazione Visite & Batch Session Planner header
    await expect(page.locator('text=Pianificazione Visite & Batch Session Planner')).toBeVisible({ timeout: 5000 })

    // Select row checkbox
    const firstCheckbox = page.locator('tbody input[type="checkbox"]').first()
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check()
      const batchBtn = page.locator('button:has-text("Pianifica Sessione Massiva")')
      await expect(batchBtn).toBeEnabled({ timeout: 5000 })
      await batchBtn.click()

      // Modal opens
      await expect(page.locator('text=Pianifica Sessione Massiva Visite')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('text=Anteprima Slot Orari Generati')).toBeVisible({ timeout: 5000 })

      // Close modal
      await page.locator('button:has-text("Annulla")').click()
    }
  })

  test('5. Auto Recall Campaigns & Morning Digest', async ({ page }) => {
    // Navigate to Dashboard and click Convocazioni & Recall card
    const dashBtn = page.locator('.legacy-side-item:has-text("Il Mio Giorno")')
    await dashBtn.first().click()
    await page.waitForTimeout(400)

    const recallCard = page.locator('text=Convocazioni & Recall Automatici')
    await recallCard.click()
    await page.waitForTimeout(600)
    
    // Verify recall center
    await expect(page.locator('text=Convocazioni Automatiche & Recall')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Template Notifica & Convocazione')).toBeVisible({ timeout: 5000 })

    // Test Anteprima Testo
    const prevBtn = page.locator('button:has-text("Anteprima Testo")')
    if (await prevBtn.isVisible()) {
      await prevBtn.click()
      await expect(page.locator('text=Anteprima Convocazione:')).toBeVisible({ timeout: 5000 })
      await page.locator('button:has-text("Chiudi")').click()
    }
  })
})
