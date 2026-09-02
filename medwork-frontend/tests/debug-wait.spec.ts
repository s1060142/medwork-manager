import { test } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

test('Debug: wait 6 seconds after save', async ({ page }) => {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
  await page.waitForSelector('table tbody tr', { timeout: 10000 })
  
  const firstRow = page.locator('table tbody tr').first()
  await firstRow.locator('button:has-text("Modifica")').first().click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  
  const newName = 'WAIT_TEST_' + Date.now()
  await page.getByLabel(/nome azienda/i).first().fill(newName)
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  
  // Wait 6 seconds
  await page.waitForTimeout(6000)
  
  const dialogCount = await page.locator('[role="dialog"]').count()
  const names = await page.locator('table tbody tr td:nth-child(2)').allTextContents()
  console.log('After 6s - Dialog count:', dialogCount)
  console.log('After 6s - Names:', names)
  console.log('Has new name:', names.some(n => n.includes(newName)))
})
