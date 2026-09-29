import { test, expect } from '@playwright/test'
import path from 'path'

test('unified agenda and planning center validation', async ({ page }) => {
  const screenshotsDir = 'C:/Users/rober/.gemini/antigravity-ide/brain/745169d6-ac5b-45fd-a175-008c4b862a3c'

  // Step 1: Login
  await page.goto('http://127.0.0.1:5173')
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="text"]').fill('doctor')
  await page.locator('input[type="password"]').fill('Doctor123!')
  await page.getByRole('button', { name: 'Accedi' }).click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  // Step 2: Navigate to Sorveglianza Sanitaria -> Agenda & Pianificazione
  const sorvNav = page.getByRole('button', { name: /Sorveglianza Sanitaria/i })
  await sorvNav.click()
  await page.waitForTimeout(1000)

  const agendaChip = page.getByRole('button', { name: /Agenda & Pianificazione/i })
  await expect(agendaChip).toBeVisible()
  await agendaChip.click()
  await page.waitForTimeout(1500)

  // Verify unified hub header
  await expect(page.getByText('Agenda & Pianificazione Visite')).toBeVisible()

  // Step 3: Test Calendar Tab: Click "Nuovo Appuntamento / Visita"
  const newAppBtn = page.getByRole('button', { name: /Nuovo Appuntamento \/ Visita/i })
  await expect(newAppBtn).toBeVisible()
  await newAppBtn.click()
  await page.waitForTimeout(800)

  // Verify appointment dialog is open
  const dialogTitle = page.getByText(/Nuovo Appuntamento \/ Visita Medica/i)
  await expect(dialogTitle).toBeVisible()
  await page.screenshot({ path: path.join(screenshotsDir, '01_agenda_calendar_dialog.png'), fullPage: true })

  // Close dialog
  const cancelBtn = page.getByRole('button', { name: 'Annulla' })
  await cancelBtn.click()
  await page.waitForTimeout(600)

  // Step 4: Test double-click on a calendar day
  const dayCell = page.locator('div[title="Doppio click per registrare un nuovo appuntamento"]').nth(15)
  await expect(dayCell).toBeVisible()
  await dayCell.dblclick()
  await page.waitForTimeout(800)
  await expect(dialogTitle).toBeVisible()
  await cancelBtn.click()
  await page.waitForTimeout(600)

  // Step 5: Switch to Scadenzario & Batch Planner Tab
  const planningTab = page.getByRole('tab', { name: /Scadenzario Normativo & Sessioni Massive/i })
  await expect(planningTab).toBeVisible()
  await planningTab.click()
  await page.waitForTimeout(1200)

  // Verify Batch Session Planner elements are visible
  await expect(page.getByText(/Pianificazione Visite & Batch Session Planner/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Pianifica Sessione Massiva/i })).toBeVisible()
  await page.screenshot({ path: path.join(screenshotsDir, '02_agenda_batch_planning_tab.png'), fullPage: true })
})
