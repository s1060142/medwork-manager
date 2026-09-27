import { test, expect } from '@playwright/test'
import path from 'path'

test('calendar appointment modal on button click and day double-click', async ({ page }) => {
  const screenshotsDir = 'C:/Users/rober/.gemini/antigravity-ide/brain/64227543-d629-4f65-b5b9-d09e15e4b606'

  // Step 1: Login
  await page.goto('http://127.0.0.1:5173')
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="text"]').fill('doctor')
  await page.locator('input[type="password"]').fill('Doctor123!')
  await page.getByRole('button', { name: 'Accedi' }).click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  // Step 2: Navigate to Sorveglianza Sanitaria -> Calendario & Appuntamenti
  const sorvNav = page.getByRole('button', { name: /Sorveglianza Sanitaria/i })
  await sorvNav.click()
  await page.waitForTimeout(1000)

  const calChip = page.getByRole('button', { name: /Calendario & Appuntamenti/i })
  await calChip.click()
  await page.waitForTimeout(1500)

  // Step 3: Click "Nuovo Appuntamento / Visita"
  const newAppBtn = page.getByRole('button', { name: /Nuovo Appuntamento \/ Visita/i })
  await expect(newAppBtn).toBeVisible()
  await newAppBtn.click()
  await page.waitForTimeout(800)

  // Verify dialog is open
  const dialogTitle = page.getByText(/Nuovo Appuntamento \/ Visita Medica/i)
  await expect(dialogTitle).toBeVisible()
  await page.screenshot({ path: path.join(screenshotsDir, '09_calendar_new_appointment_button.png'), fullPage: true })

  // Close dialog
  const cancelBtn = page.getByRole('button', { name: 'Annulla' })
  await cancelBtn.click()
  await page.waitForTimeout(600)

  // Step 4: Test double-click on a calendar day
  const dayCell = page.locator('div[title="Doppio click per registrare un nuovo appuntamento"]').nth(15)
  await expect(dayCell).toBeVisible()
  await dayCell.dblclick()
  await page.waitForTimeout(800)

  // Verify dialog reopens on double-click
  await expect(dialogTitle).toBeVisible()
  await page.screenshot({ path: path.join(screenshotsDir, '10_calendar_double_click_dialog.png'), fullPage: true })
})
