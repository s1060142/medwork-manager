import { test, expect } from '@playwright/test'
import path from 'path'

test('open worker Cartella Sanitaria and view complete visit details', async ({ page }) => {
  const screenshotsDir = 'C:/Users/rober/.gemini/antigravity-ide/brain/64227543-d629-4f65-b5b9-d09e15e4b606'

  // Login
  await page.goto('http://127.0.0.1:5173')
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="text"]').fill('doctor')
  await page.locator('input[type="password"]').fill('Doctor123!')
  await page.getByRole('button', { name: 'Accedi' }).click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  // Navigate to Gestione Lavoratori
  const workersNavBtn = page.getByRole('button', { name: /Gestione Lavoratori/i })
  await workersNavBtn.click()
  await page.waitForTimeout(1000)

  // Double click worker Mario Rossi to open his Cartella Sanitaria
  const workerCell = page.getByText(/Rossi Mario/i).first()
  await workerCell.dblclick()
  await page.waitForTimeout(2000)

  // Screenshot Tab 0: Anamnesi di Base
  await page.screenshot({ path: path.join(screenshotsDir, '06_cartella_sanitaria_anamnesi_tab.png'), fullPage: true })

  // Switch to Tab 1: Storico & Dettaglio Visite Mediche
  const visitsTab = page.getByRole('tab', { name: /Storico & Dettaglio Visite/i })
  if (await visitsTab.isVisible()) {
    await visitsTab.click()
    await page.waitForTimeout(1500)
  }

  // Screenshot Tab 1: Scheda Clinica Completa Visita Medica
  await page.screenshot({ path: path.join(screenshotsDir, '07_cartella_sanitaria_visita_completa.png'), fullPage: true })
})
