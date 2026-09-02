import { test } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

test('Final debug: grid after save', async ({ page }) => {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
  await page.waitForSelector('table tbody tr', { timeout: 10000 })
  const getRequests = []
  page.on('response', (res) => {
    if (res.url().includes('/api/master-data/companies') && res.request().method() === 'GET') {
      getRequests.push(res.url())
    }
  })
  const firstRow = page.locator('table tbody tr').first()
  await firstRow.locator('button:has-text("Modifica")').first().click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  const newName = 'FINAL_TEST_' + Date.now()
  await page.getByLabel(/nome azienda/i).first().fill(newName)
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  for (const wait of [500, 1500, 3000, 5000]) {
    await page.waitForTimeout(wait === 500 ? 500 : wait - (wait - 500))
    const dialogCount = await page.locator('[role="dialog"]').count()
    const names = await page.locator('table tbody tr td:nth-child(2)').allTextContents()
    const hasNewName = names.some(n => n.includes(newName))
    console.log("At " + wait + "ms: dialog=" + dialogCount + ", names=" + JSON.stringify(names) + ", hasNewName=" + hasNewName)
  }
  console.log('GET requests for companies:', getRequests)
  console.log('Expected name:', newName)
})
