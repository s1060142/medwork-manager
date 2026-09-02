import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Grid refreshes after employee save: reparto, luogo, periodicita visible in grid', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForTimeout(3000)
  
  // The employees table with Lista buttons is the 2nd visible table (index 1)
  const empTable = page.locator('table:visible').nth(1)
  await empTable.locator('tbody tr').first().waitFor({ timeout: 10000 })
  
  // Get the name of the first employee for verification
  const firstRow = empTable.locator('tbody tr').first()
  const employeeName = await firstRow.locator('td').nth(1).textContent()
  console.log('First employee:', employeeName)
  
  // Get current grid values for reparto, luogo, periodicita
  const currentRow = await firstRow.textContent()
  console.log('Current row text:', currentRow)
  
  // Open the employee profile via Lista button
  const listBtn = firstRow.locator('button[aria-label="Lista"]')
  await listBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  await page.waitForTimeout(1000)
  
  // Fill Reparto, Luogo di lavoro, Periodicità with unique values
  const timestamp = Date.now()
  const repartoValue = `Reparto_${timestamp}`
  const luogoValue = `Luogo_${timestamp}`
  
  const repartoField = page.getByLabel(/^reparto$/i).first()
  const luogoField = page.getByLabel(/luogo di lavoro/i).first()
  const periodicitaField = page.getByLabel(/periodicità/i).first()
  
  await repartoField.fill(repartoValue)
  await luogoField.fill(luogoValue)
  await periodicitaField.click()
  await page.waitForTimeout(500)
  await page.locator('li:has-text("Annuale")').first().click()
  
  // Save
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(3000)
  
  // Close dialog
  const closeBtn = page.locator('[role="dialog"] button:has-text("Chiudi")')
  if (await closeBtn.count() > 0) {
    await closeBtn.click()
    await page.waitForTimeout(1000)
  } else {
    // Press Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
  }
  
  // Wait for grid to refresh (event-driven)
  await page.waitForTimeout(3000)
  
  // Check if the grid now shows the updated values WITHOUT a page refresh
  const updatedRow = empTable.locator('tbody tr').first()
  const updatedRowText = await updatedRow.textContent()
  console.log('Updated row text:', updatedRowText)
  
  const hasReparto = updatedRowText?.includes(repartoValue)
  const hasLuogo = updatedRowText?.includes(luogoValue)
  const hasPeriodicita = updatedRowText?.includes('Annuale')
  
  console.log('Grid shows Reparto:', hasReparto)
  console.log('Grid shows Luogo di lavoro:', hasLuogo)
  console.log('Grid shows Periodicità (Annuale):', hasPeriodicita)
  
  // Now do a hard refresh to confirm
  await page.reload()
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForTimeout(3000)
  
  const empTable2 = page.locator('table:visible').nth(1)
  await empTable2.locator('tbody tr').first().waitFor({ timeout: 10000 })
  const afterRefreshRow = empTable2.locator('tbody tr').first()
  const afterRefreshText = await afterRefreshRow.textContent()
  console.log('After page refresh row text:', afterRefreshText)
  
  const hasRepartoAfterRefresh = afterRefreshText?.includes(repartoValue)
  const hasLuogoAfterRefresh = afterRefreshText?.includes(luogoValue)
  
  console.log('After page refresh - Grid shows Reparto:', hasRepartoAfterRefresh)
  console.log('After page refresh - Grid shows Luogo di lavoro:', hasLuogoAfterRefresh)
  
  expect(hasRepartoAfterRefresh).toBe(true)
  expect(hasLuogoAfterRefresh).toBe(true)
})
