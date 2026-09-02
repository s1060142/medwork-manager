import { test, expect } from '@playwright/test'
const BASE = 'http://127.0.0.1:5173'
async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('dbg employees refresh', async ({ page }) => {
  const putUrls = []
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().includes('/api/admin-data/employees/')) putUrls.push(req.url())
  })
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForTimeout(2000)
  await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
  const empTable = page.locator('table').nth(1)
  await empTable.locator('tbody tr').first().waitFor({ timeout: 10000 })
  const firstRow = empTable.locator('tbody tr').first()
  await firstRow.locator('button[aria-label="Lista"]').first().click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  const newName = 'EmpTest' + Date.now()
  await page.getByLabel(/^Nome\*/i).first().fill(newName)
  await page.locator('[role="dialog"] button:has-text("Salva")').first().click()
  await page.waitForTimeout(3000)
  console.log('PUT count:', putUrls.length)
  await page.locator('[role="dialog"] button:has-text("Chiudi")').first().click()
  await page.waitForTimeout(1000)
  const filtraBtn = page.locator('button:has-text("Filtra")')
  console.log('Filtra btn count:', await filtraBtn.count())
  if (await filtraBtn.count() > 0) {
    await filtraBtn.first().click()
  } else {
    await page.locator('button:has-text("Ricerca")').first().click()
  }
  await page.waitForTimeout(2000)
  const updatedRow = empTable.locator('tbody tr').filter({ hasText: newName }).first()
  console.log('grid has newName after refresh:', await updatedRow.count())
  console.log('first row after refresh:', (await firstRow.textContent()).slice(0, 80))
})
