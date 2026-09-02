import { test } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

test('Debug grid refresh after company save', async ({ page }) => {
  // Login
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  
  // Navigate to Companies
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
  await page.waitForSelector('table tbody tr', { timeout: 10000 })
  
  // Get all company names from the table
  const initialNames = await page.locator('table tbody tr td:nth-child(2)').allTextContents()
  console.log('Initial names:', initialNames)
  
  // Track all API requests
  const requests: any[] = []
  page.on('request', (req) => {
    if (req.url().includes('/api/master-data/companies') || req.url().includes('/api/admin-data/companies')) {
      requests.push({ method: req.method(), url: req.url() })
    }
  })
  
  // Click Modifica on first company
  const firstRow = page.locator('table tbody tr').first()
  const editBtn = firstRow.locator('button:has-text("Modifica")').first()
  await editBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  
  // Modify the name
  const newName = 'GRID_REFRESH_TEST_' + Date.now()
  const nameInput = page.getByLabel(/nome azienda/i).first()
  await nameInput.fill(newName)
  
  // Save
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  
  // Wait 5 seconds for grid to refresh
  await page.waitForTimeout(5000)
  
  // Get all company names after save
  const afterNames = await page.locator('table tbody tr td:nth-child(2)').allTextContents()
  console.log('After names:', afterNames)
  
  // Check if the new name appears anywhere on the page
  const pageContent = await page.content()
  const nameAppears = pageContent.includes(newName)
  console.log('New name appears in page:', nameAppears)
  
  // Print all API requests
  console.log('API requests:', JSON.stringify(requests, null, 2))
  
  // Check if dialog is still open
  const dialogOpen = await page.locator('[role="dialog"]').count() > 0
  console.log('Dialog still open:', dialogOpen)
})
