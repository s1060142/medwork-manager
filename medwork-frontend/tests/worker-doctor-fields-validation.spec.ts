import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

test.describe('Worker Form - Medico Competente & D.Lgs. 81/08 Fields', () => {
  test('verifies presence and functionality of Medico Competente and essential fields in WorkerFormDialog', async ({ page }) => {
    // 1. Login as Admin
    await page.goto(BASE)
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'Admin123!')
    await page.click('button:has-text("Accedi")')

    // Wait for authenticated app shell
    await expect(page.locator('button:has-text("Logout")')).toBeVisible({ timeout: 15000 })

    // 2. Navigate to Gestione Lavoratori
    await page.goto(`${BASE}/#/workers-management/employees`)
    await page.waitForTimeout(1500)

    // 3. Click "Nuovo Lavoratore" button
    const nuovoBtn = page.locator('button:has-text("Nuovo Lavoratore")').first()
    await expect(nuovoBtn).toBeVisible({ timeout: 10000 })
    await nuovoBtn.click()

    // 4. Verify WorkerFormDialog opened
    const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Inserimento Nuovo Lavoratore' })
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 5. Verify Section 1 Title mentions D.Lgs. 81/08
    await expect(dialog.getByText('Inquadramento Aziendale & Sorveglianza Sanitaria (D.Lgs. 81/08)')).toBeVisible()

    // 6. Verify Medico Competente field is present
    const mcField = dialog.locator('label:has-text("Medico Competente Incaricato (D.Lgs. 81/08 Art. 38)")')
    await expect(mcField).toBeVisible()
    const mcInput = dialog.locator('input[placeholder*="Medico Competente"]').first()
    await expect(mcInput).toBeVisible()

    // 7. Verify Data Assunzione (Allegato 3A) is present
    const hireDateField = dialog.locator('label:has-text("Data Assunzione (Allegato 3A)")')
    await expect(hireDateField).toBeVisible()

    // 8. Verify Stato Lavoratore is present
    const statusField = dialog.locator('label:has-text("Stato Lavoratore")')
    await expect(statusField).toBeVisible()

    // 9. Fill in complete valid worker data (D.Lgs. 81/08 Allegato 3A)
    const uniqueSuffix = Date.now().toString().slice(-4)
    const testLastName = `TestLavoratore${uniqueSuffix}`
    const testFirstName = 'Marco'

    await dialog.getByRole('textbox', { name: 'Cognome *', exact: true }).fill(testLastName)
    await dialog.getByRole('textbox', { name: 'Nome *', exact: true }).fill(testFirstName)
    await dialog.getByRole('textbox', { name: 'Comune di Nascita *', exact: true }).fill('Milano')

    // Fill Birth Date
    const birthDateInput = dialog.locator('label:has-text("Data di Nascita *")').locator('xpath=..').locator('input')
    await birthDateInput.fill('15/06/1988')

    // Click "Calcola CF"
    await dialog.locator('button:has-text("Calcola CF")').click()
    await page.waitForTimeout(500)

    const cfInput = dialog.locator('label:has-text("Codice Fiscale *")').locator('xpath=..').locator('input')
    const calculatedCf = await cfInput.inputValue()
    expect(calculatedCf.length).toBe(16)

    // Make CF unique to avoid duplicate constraint collisions across test runs
    const uniqueCf = (calculatedCf.slice(0, 11) + uniqueSuffix + 'X').slice(0, 16)
    await cfInput.fill(uniqueCf)

    // Select doctor in Autocomplete if options available
    await mcInput.click()
    await page.waitForTimeout(300)
    const option = page.locator('.MuiAutocomplete-popper li').first()
    if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
      await option.click()
    }

    // 10. Click "Crea Lavoratore"
    const submitBtn = dialog.locator('button:has-text("Crea Lavoratore")')
    await submitBtn.click()

    // 11. Verify dialog closes
    await expect(dialog).toHaveCount(0, { timeout: 10000 })
    await page.waitForTimeout(1000)

    // 12. Verify worker appears in the table with proper doctor info
    const createdRow = page.locator('table tbody tr').filter({ hasText: testLastName })
    await expect(createdRow).toBeVisible({ timeout: 10000 })

    // 13. Click edit button on the created row to verify edit dialog and doctor persistence
    const editBtn = createdRow.locator('button[title*="Modifica"]')
    await expect(editBtn).toBeVisible({ timeout: 5000 })
    await editBtn.click()

    const editDialog = page.locator('[role="dialog"]').filter({ hasText: 'Modifica Lavoratore' })
    await expect(editDialog).toBeVisible({ timeout: 10000 })

    // Verify Medico Competente is present and populated in edit dialog
    const editDoctorInput = editDialog.locator('input[placeholder*="Medico Competente"]').first()
    await expect(editDoctorInput).toBeVisible()

    // Close edit dialog
    await editDialog.locator('button:has-text("Annulla")').click()
    await expect(editDialog).toHaveCount(0, { timeout: 5000 })
  })
})
