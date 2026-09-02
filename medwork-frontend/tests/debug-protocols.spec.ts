import { test } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

test('Debug protocols table', async ({ page }) => {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Checklist")').click()
  await page.waitForTimeout(2000)

  const table = page.locator('table:visible').last()
  const allBtns = await table.locator('tbody tr').first().locator('button').allTextContents()
  console.log('First row buttons:', allBtns)

  const ariaBtns = await table.locator('tbody tr').first().locator('button[aria-label]').evaluateAll(els => els.map(e => e.getAttribute('aria-label')))
  console.log('First row aria-labels:', ariaBtns)

  const firstRow = table.locator('tbody tr').first()
  await firstRow.click()
  await page.waitForTimeout(1000)

  const dialogVisible = await page.locator('[role="dialog"]').count() > 0
  console.log('Dialog after row click:', dialogVisible)

  const newButtons = await page.locator('button:visible').allTextContents()
  console.log('Visible buttons after click:', newButtons.filter(b => b.trim()).slice(0, 20))
})
