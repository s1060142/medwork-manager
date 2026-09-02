import { test } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

test('Debug Salva button', async ({ page }) => {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
  await page.waitForSelector('table tbody tr', { timeout: 10000 })
  
  // Track ALL requests
  const allRequests: any[] = []
  page.on('request', (req) => {
    if (req.url().includes('companies')) {
      allRequests.push({ method: req.method(), url: req.url() })
    }
  })
  
  // Click Modifica
  const firstRow = page.locator('table tbody tr').first()
  await firstRow.locator('button:has-text("Modifica")').first().click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  
  // List all buttons in the dialog
  const allButtons = await page.locator('[role="dialog"] button').allTextContents()
  console.log('All buttons in dialog:', allButtons)
  
  // Find the Salva button specifically
  const salvaButtons = page.locator('[role="dialog"] button:has-text("Salva")')
  const salvaCount = await salvaButtons.count()
  console.log('Salva button count:', salvaCount)
  
  // Fill the name field
  const newName = 'DEBUG_SAVE_' + Date.now()
  await page.getByLabel(/nome azienda/i).first().fill(newName)
  
  // Click the Salva button
  await salvaButtons.first().click()
  await page.waitForTimeout(3000)
  
  // Check requests
  console.log('All requests:', JSON.stringify(allRequests, null, 2))
  
  // Check dialog state
  const dialogCount = await page.locator('[role="dialog"]').count()
  console.log('Dialog count after save:', dialogCount)
  
  // Check for error messages
  const errors = await page.locator('[role="dialog"] .MuiAlert-root, [role="dialog"] [class*="error"]').allTextContents()
  console.log('Errors in dialog:', errors)
})
