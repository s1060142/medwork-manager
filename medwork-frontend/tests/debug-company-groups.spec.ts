import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 })
}

test('debug company groups navigation', async ({ page }) => {
  await loginAsAdmin(page)
  
  // Click Gestione aziende
  await page.click('button:has-text("Gestione aziende")')
  await page.waitForTimeout(1000)
  
  // Click Gruppi aziendali
  await page.click('button:has-text("Gruppi aziendali")')
  await page.waitForTimeout(2000)
  
  // Take screenshot to see what's on the page
  await page.screenshot({ path: 'test-results/debug-company-groups.png', fullPage: true })
  
  // Get all text on page
  const bodyText = await page.locator('body').textContent()
  console.log('Page text:', bodyText.substring(0, 2000))
  
  // Check for specific elements
  const allTexts = await page.locator('*').allTextContents()
  console.log('All texts:', allTexts.filter(t => t.includes('Gruppo') || t.includes('Workspace') || t.includes('Aziendale')))
})
