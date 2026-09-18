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

test.describe('P0 Product Improvements Suite', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('1. Global Search (Ctrl+K) Omnisearch Modal works', async ({ page }) => {
    // Open via Ctrl+K
    await page.keyboard.press('Control+KeyK')
    const searchModal = page.locator('input[placeholder*="Cerca lavoratore (nome/CF)"]')
    await expect(searchModal).toBeVisible({ timeout: 5000 })

    // Type query
    await searchModal.fill('Mario')
    await page.waitForTimeout(400)

    // Results or quick actions should be listed inside dialog
    const modalDialog = page.locator('.MuiDialog-root')
    await expect(modalDialog.getByText('Mario Rossi').first()).toBeVisible({ timeout: 5000 })

    // Close with Escape
    await page.keyboard.press('Escape')
    await expect(searchModal).not.toBeVisible()

    // Test clicking topbar search button
    const topbarBtn = page.locator('button:has-text("Cerca lavoratore, azienda...")')
    if (await topbarBtn.isVisible()) {
      await topbarBtn.click()
      await expect(searchModal).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(searchModal).not.toBeVisible()
    }
  })

  test('2. Clone Previous Visit & Structured Physical Exam (Normal by Default) & Prescriptions Library', async ({ page }) => {
    // Navigate to Sorveglianza Sanitaria
    const sorvBtn = page.locator('.legacy-side-item:has-text("Sorveglianza sanitaria")')
    await expect(sorvBtn).toBeVisible({ timeout: 5000 })
    await sorvBtn.click()
    await page.waitForTimeout(400)

    // Click Nuova visita tab
    const nuovaVisitaTab = page.locator('.legacy-tab:has-text("Nuova visita")')
    if (await nuovaVisitaTab.isVisible()) {
      await nuovaVisitaTab.click()
      await page.waitForTimeout(400)
    }

    // Wait for stepper
    await expect(page.locator('text=Nuova Visita Medica & Sorveglianza Sanitaria')).toBeVisible({ timeout: 8000 })

    // Select employee
    const employeeSelect = page.locator('.MuiTextField-root:has-text("Lavoratore in Visita *") .MuiSelect-select')
    await employeeSelect.click()
    const firstOption = page.locator('li.MuiMenuItem-root').first()
    await firstOption.click()
    await page.waitForTimeout(400)

    // Test Clone previous visit button presence and click
    const cloneBtn = page.locator('button:has-text("Copia da ultima visita")')
    await expect(cloneBtn).toBeEnabled()
    await cloneBtn.click()
    await page.waitForTimeout(500)

    // Fill doctor if not set
    const doctorSelect = page.locator('.MuiTextField-root:has-text("Medico Competente *") .MuiSelect-select')
    if (await doctorSelect.isVisible()) {
      await doctorSelect.click()
      const docOption = page.locator('li.MuiMenuItem-root').first()
      if (await docOption.isVisible()) {
        await docOption.click()
      }
    }

    // Proceed to Step 2: Esame Obiettivo & Parametri Vitali
    await page.locator('button:has-text("Avanti")').click()
    await page.waitForTimeout(400)

    // Verify Fast Normal Buttons
    const normalBtn = page.locator('button:has-text("Tutto N.D.P. (Nella Norma)")')
    await expect(normalBtn).toBeVisible()
    await normalBtn.click()

    // Verify Vitals input and BMI calculation
    const heightInput = page.locator('input[placeholder="175"]')
    const weightInput = page.locator('input[placeholder="75"]')
    await heightInput.fill('180')
    await weightInput.fill('78')
    await page.waitForTimeout(300)

    // Verify BMI badge is computed and displayed
    await expect(page.locator('text=BMI 24.1 — Normopeso')).toBeVisible()

    // Proceed to Step 3: Giudizio di Idoneità & Prescrizioni
    await page.locator('button:has-text("Avanti")').click()
    await page.waitForTimeout(400)

    // Verify Prescriptions Library chips
    const dpiChip = page.locator('.MuiChip-root:has-text("Uso obbligatorio DPI uditivi")').first()
    await expect(dpiChip).toBeVisible()
    await dpiChip.click()

    // Verify prescriptions input contains the clicked preset text
    const prescInput = page.locator('textarea[placeholder*="Obbligo DPI uditivi"]')
    await expect(prescInput).toHaveValue(/Uso obbligatorio DPI uditivi/)
  })

  test('3. Worker Clinical Timeline & Vital Trends in Employee Profile Dialog', async ({ page }) => {
    // Navigate to Gestione lavoratori
    const workersSide = page.locator('.legacy-side-item:has-text("Gestione lavoratori")')
    await expect(workersSide).toBeVisible({ timeout: 5000 })
    await workersSide.click()
    await page.waitForLoadState('networkidle')

    // Open first worker profile via action button or double click
    const openCardBtn = page.locator('button[title*="Apri cartella lavoratore"], button[aria-label="Lista"]').first()
    await expect(openCardBtn).toBeVisible({ timeout: 8000 })
    await openCardBtn.click()
    
    // Wait for dialog
    const dialog = page.locator('div[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Switch to Timeline Clinica tab
    const timelineTab = dialog.locator('button[role="tab"]:has-text("Timeline Clinica")')
    await expect(timelineTab).toBeVisible()
    await timelineTab.click()

    // Verify Vitals & Timeline content
    await expect(dialog.locator('text=Trend Parametri Vitali & Quadro Biometrico')).toBeVisible()
    await expect(dialog.locator('text=PRESSIONE ARTERIOSA')).toBeVisible()
    await expect(dialog.locator('text=Timeline Storica Sorveglianza Sanitaria')).toBeVisible()

    // Close dialog
    await dialog.locator('button:has-text("Chiudi")').click()
    await expect(dialog).not.toBeVisible()
  })
})
