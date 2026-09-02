import { test } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

test('Debug nav', async ({ page }) => {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  
  // List all buttons
  const allButtons = await page.locator('button').allTextContents()
  console.log('All buttons:', allButtons.filter(b => b.trim().length > 0).slice(0, 50))
  
  // Navigate to Gestione lavoratori
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForTimeout(2000)
  
  // Check tables
  const tableCount = await page.locator('table').count()
  console.log('Table count:', tableCount)
  
  for (let i = 0; i < tableCount; i++) {
    const rows = await page.locator('table').nth(i).locator('tbody tr').count()
    const headers = await page.locator('table').nth(i).locator('thead th').allTextContents()
    console.log(`Table ${i}: rows=${rows}, headers=${JSON.stringify(headers)}`)
  }
})
