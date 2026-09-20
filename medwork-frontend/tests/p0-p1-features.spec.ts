import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('.legacy-side-item:has-text("Gestione aziende"), button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 })
}

test.describe('P0 & P1 Competitive Feature Suite', () => {
  test('P0: Smart Mansiogramma loads and allows interactive risk toggling', async ({ page }) => {
    await loginAsAdmin(page)

    // Open Gestione aziende -> Anagrafica
    await page.locator('.legacy-side-item:has-text("Gestione aziende"), button:has-text("Gestione aziende")').first().click()
    await page.waitForTimeout(600)
    await page.locator('.legacy-tab:has-text("Anagrafica"), button:has-text("Anagrafica")').first().click()
    await page.waitForTimeout(800)

    // Open first company row's Profilo button if available
    const profiloBtn = page.locator('table tbody tr button:has-text("Profilo")').first()
    if (await profiloBtn.count() > 0) {
      await profiloBtn.click()
      const dlg = page.locator('[role="dialog"]')
      await expect(dlg).toBeVisible({ timeout: 10000 })

      // Click Smart Mansiogramma tab
      const mansiogramTab = dlg.locator('.MuiTab-root:has-text("Smart Mansiogramma"), button:has-text("Smart Mansiogramma"), [role="tab"]:has-text("Smart Mansiogramma")').first()
      await expect(mansiogramTab).toBeVisible({ timeout: 5000 })
      await mansiogramTab.click()

      // Verify matrix table renders with job roles and risk checkboxes
      await expect(dlg.getByText('Smart Mansiogramma & Matrice Rischi')).toBeVisible({ timeout: 8000 })
      await expect(dlg.getByText('Impiegato Amministrativo / Ufficio')).toBeVisible({ timeout: 5000 })

      // Toggle a risk checkbox
      const checkbox = dlg.locator('table tbody tr').first().locator('input[type="checkbox"]').first()
      await checkbox.click()

      // Save matrix
      await dlg.locator('button:has-text("Salva Matrice")').click()
      await expect(dlg.getByText('Mansiogramma aziendale e matrice rischi salvati')).toBeVisible({ timeout: 5000 })

      // Close dialog
      await dlg.locator('button:has-text("Annulla")').click()
    }
  })

  test('P0: Keyboard Fast Track & Macro Expansion in Medical Visit', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to Sorveglianza Sanitaria -> Nuova Visita
    await page.locator('.legacy-side-item:has-text("Sorveglianza sanitaria"), button:has-text("Sorveglianza sanitaria")').first().click()
    await page.waitForTimeout(600)

    // Verify stepper rendered
    await expect(page.locator('text=Compilazione Visita Medica').or(page.locator('text=Anamnesi')).first()).toBeVisible({ timeout: 15000 })

    // Type macro code .norm in Anamnesi Lavorativa
    const workHistoryInput = page.locator('textarea').first()
    await workHistoryInput.focus()
    await workHistoryInput.fill('.norm ')
    await page.waitForTimeout(300)

    // Verify macro expansion
    await expect(workHistoryInput).toHaveValue(/Paziente in buone condizioni generali/)

    // Select employee in dropdown to satisfy Step 0 validation
    const employeeSelect = page.locator('label:has-text("Lavoratore")').locator('..').locator('[role="combobox"], .MuiSelect-select').first()
    if (await employeeSelect.count() > 0) {
      await employeeSelect.click()
      await page.locator('li[role="option"]').first().click()
    }

    // Advance to Step 1 (Esame Obiettivo)
    await page.locator('button:has-text("Avanti")').click()
    await expect(page.getByText('Compilazione Rapida Esame Obiettivo')).toBeVisible({ timeout: 8000 })

    // Test Fast Action for All Normal (F4)
    const normalBtn = page.locator('button:has-text("Tutti nella norma")').first()
    if (await normalBtn.count() > 0) {
      await normalBtn.click()
    } else {
      await page.keyboard.press('F4')
    }
    await expect(page.locator('text=Tutti gli 8 apparati').or(page.locator('text=Nella norma')).first()).toBeVisible({ timeout: 5000 })

    // Advance to Step 2 (Giudizio & FEA)
    await page.locator('button:has-text("Avanti")').click()
    await expect(page.getByText('Firma Elettronica Avanzata (FEA) su Tablet')).toBeVisible({ timeout: 5000 })

    // Open FEA Signature Pad
    await page.locator('button:has-text("Firma su Tablet")').click()
    await expect(page.getByText('Conforme AgID / D.Lgs. 81/08')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('canvas')).toBeVisible()

    // Draw signature on canvas
    const canvas = page.locator('canvas')
    const box = await canvas.boundingBox()
    if (box) {
      await page.mouse.move(box.x + 20, box.y + 20)
      await page.mouse.down()
      await page.mouse.move(box.x + 100, box.y + 80)
      await page.mouse.up()
      await page.locator('button:has-text("Conferma & Apponi Firma")').click()
      await expect(page.getByText('Firma Acquisita (Rifai)')).toBeVisible({ timeout: 5000 })
    }
  })

  test('P1: Portale RSPP/DdL is accessible and displays compliance KPI and certificates', async ({ page }) => {
    await loginAsAdmin(page)

    // Open Gestione aziende -> Portale RSPP/DdL tab
    await page.click('button:has-text("Gestione aziende")')
    await page.waitForTimeout(600)
    await page.click('button:has-text("Portale RSPP/DdL")')

    // Verify Employer Portal loaded
    await expect(page.getByText('Portale di consultazione idoneità e conformità sanitaria').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Compliance Sorveglianza').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Registro Lavoratori & Giudizi di Idoneità').first()).toBeVisible({ timeout: 10000 })
  })

  test('P1: No-Show formal notice action in Recall Campaigns Center', async ({ page }) => {
    await loginAsAdmin(page)

    // Open Scadenzario -> Convocazioni (Recall)
    await page.locator('.legacy-side-item:has-text("Scadenzario"), button:has-text("Scadenzario")').first().click()
    await page.waitForTimeout(600)
    const recallTab = page.locator('.legacy-tab:has-text("Convocazioni (Recall)"), button:has-text("Convocazioni (Recall)")').first()
    if (await recallTab.count() > 0) {
      await recallTab.click()
      await page.waitForSelector('text=Convocazioni Automatiche & Recall', { timeout: 10000 })

      // Verify No-Show action button presence in candidate rows
      const noShowBtn = page.locator('button:has-text("No-Show / Sollecito DdL")').first()
      if (await noShowBtn.count() > 0) {
        await noShowBtn.click()
        await expect(page.getByText('Notifica formale No-Show inviata')).toBeVisible({ timeout: 8000 })
      }
    }
  })
})
