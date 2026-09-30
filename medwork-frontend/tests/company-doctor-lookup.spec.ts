import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

test.describe('Medico Competente Lookup in Modifica Azienda', () => {
  test('allows selecting and persisting competent doctor via lookup in Modifica Azienda', async ({ page }) => {
    // 1. Login as Admin
    await page.goto(BASE)
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'Admin123!')
    await page.click('button:has-text("Accedi")')

    // Wait for authenticated app shell
    await expect(page.locator('button:has-text("Logout")')).toBeVisible({ timeout: 15000 })

    // 2. Navigate to Gestione Aziende -> Aziende
    await page.goto(`${BASE}/#/company-management/companies`)
    await page.waitForTimeout(1000)

    // Verify company table loaded and has "Medico Competente" column
    const mcColumnHeader = page.locator('th:has-text("Medico Competente")')
    await expect(mcColumnHeader).toBeVisible({ timeout: 10000 })

    // 3. Click "Modifica" on the first company row
    const editBtn = page.locator('table tbody tr button:has-text("Modifica")').first()
    await expect(editBtn).toBeVisible({ timeout: 5000 })
    await editBtn.click()

    // 4. Verify "Modifica azienda" dialog is open
    const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Modifica azienda' })
    await expect(dialog).toBeVisible({ timeout: 10000 })

    // 5. Verify the Medico Competente lookup field exists
    const mcLookupField = dialog.locator('label:has-text("Medico Competente")')
    await expect(mcLookupField).toBeVisible()

    // 6. Test opening the advanced Lookup dialog via the PersonSearch icon button
    const lookupBtn = dialog.locator('button[aria-label="Cerca medico nella lookup"]')
    await expect(lookupBtn).toBeVisible()
    await lookupBtn.click()

    // 7. Verify the "Lookup Medico Competente" modal opened
    const lookupModal = page.locator('[role="dialog"]').filter({ hasText: 'Lookup Medico Competente' })
    await expect(lookupModal).toBeVisible({ timeout: 5000 })
    await expect(lookupModal.getByText('D.Lgs. 81/08 Art. 38')).toBeVisible()

    // 8. Select a doctor from the lookup table (pick the first available with "Seleziona" button)
    const targetRow = lookupModal.locator('table tbody tr:has(button:has-text("Seleziona"))').first()
    await expect(targetRow).toBeVisible()
    const chosenDoctorName = (await targetRow.locator('td').first().innerText()).trim()
    expect(chosenDoctorName).toBeTruthy()

    await targetRow.locator('button:has-text("Seleziona")').click()

    // 9. Lookup modal closes, and the doctor is now selected in the autocomplete field
    await expect(lookupModal).toHaveCount(0, { timeout: 5000 })
    const mcInput = dialog.locator('input[placeholder*="Cerca"]').first()
    const inputValue = await mcInput.inputValue()
    expect(inputValue.length).toBeGreaterThan(0)

    // 10. Save the company
    await dialog.locator('button:has-text("Salva")').click()

    // 11. Verify dialog closes and row in table displays the doctor
    await expect(dialog).toHaveCount(0, { timeout: 10000 })
    await page.waitForTimeout(1000)

    // Verify the first company row now displays the doctor's name
    const firstRowDoctorCell = page.locator('table tbody tr').first()
    await expect(firstRowDoctorCell).toContainText(chosenDoctorName)

    // 12. Re-open "Modifica" to verify persistence
    await editBtn.click()
    const reopenedDialog = page.locator('[role="dialog"]').filter({ hasText: 'Modifica azienda' })
    await expect(reopenedDialog).toBeVisible({ timeout: 5000 })

    const reopenedInput = reopenedDialog.locator('input[placeholder*="Cerca"]').first()
    const reopenedValue = await reopenedInput.inputValue()
    expect(reopenedValue).toContain(chosenDoctorName.replace('Dott. ', ''))

    // 13. Close dialog with Annulla
    await reopenedDialog.locator('button:has-text("Annulla")').click()
    await expect(reopenedDialog).toHaveCount(0, { timeout: 5000 })
  })
})
