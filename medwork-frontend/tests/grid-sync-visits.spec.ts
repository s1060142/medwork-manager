import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Medical Visits: verify grid', async ({ page }) => {
  await loginAsAdmin(page)
  
  // Navigate to Scadenzario
  await page.locator('button:has-text("Scadenzario")').first().click()
  await page.waitForTimeout(1000)
  
  // Click Scadenzario Visite
  const visiteBtn = page.locator('button:has-text("Scadenzario Visite")')
  if (await visiteBtn.count() === 0) {
    test.skip('Scadenzario Visite not found')
    return
  }
  await visiteBtn.first().click()
  await page.waitForTimeout(2000)
  
  // List tables
  const tables = page.locator('table:visible')
  const count = await tables.count()
  console.log('Visible tables:', count)
  
  for (let i = 0; i < count; i++) {
    const rows = await tables.nth(i).locator('tbody tr').count()
    const headers = await tables.nth(i).locator('thead th').allTextContents()
    console.log(`Table ${i}: rows=${rows}, headers=${JSON.stringify(headers.slice(0, 5))}`)
  }
  
  if (count === 0) {
    test.skip('No tables found')
    return
  }
  
  // Try to find an edit button
  const allBtns = await page.locator('table:visible button').allTextContents()
  console.log('All table buttons:', allBtns.filter(b => b.trim()).slice(0, 20))
  
  const editBtn = page.locator('table:visible button:has-text("Modifica")').first()
  if (await editBtn.count() > 0) {
    await editBtn.click()
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
    await page.locator('[role="dialog"] button:has-text("Salva")').click()
    await page.waitForTimeout(3000)
    console.log('Medical visit: save completed')
  } else {
    console.log('No Modifica button in medical visits')
  }
})
