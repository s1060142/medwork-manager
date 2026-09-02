import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Employees: edit and verify grid', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForTimeout(2000)
  
  // List all visible tables and their row counts
  const tables = page.locator('table:visible')
  const count = await tables.count()
  console.log('Visible tables:', count)
  
  for (let i = 0; i < count; i++) {
    const rows = await tables.nth(i).locator('tbody tr').count()
    const firstCell = await tables.nth(i).locator('tbody tr').first().locator('td').first().textContent()
    console.log(`Table ${i}: rows=${rows}, first cell text length=${firstCell?.length}`)
  }
  
  // The last visible table should be the CrudEntityView for employees
  const empTable = tables.last()
  await empTable.locator('tbody tr').first().waitFor({ timeout: 10000 })
  
  const firstRow = empTable.locator('tbody tr').first()
  const editBtn = firstRow.locator('button:has-text("Modifica")').first()
  if (await editBtn.count() === 0) {
    console.log('No Modifica button')
    test.skip()
    return
  }
  
  await editBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  
  const newName = 'EmpTest' + Date.now()
  const nomeInput = page.locator('[role="dialog"]').getByLabel(/^nome$/i).first()
  if (await nomeInput.count() > 0) {
    await nomeInput.fill(newName)
  } else {
    console.log('No Nome field found')
  }
  
  // Track PUT
  const putRequests: any[] = []
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().includes('/api/admin-data/employees/')) {
      try { putRequests.push({ url: req.url(), body: req.postDataJSON() }) } catch {}
    }
  })
  
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(4000)
  
  console.log('PUT requests:', putRequests.length)
  if (putRequests.length > 0) {
    console.log('PUT body keys:', Object.keys(putRequests[0].body))
  }
  
  const updatedRow = empTable.locator('tbody tr').filter({ hasText: newName }).first()
  const gridUpdated = await updatedRow.count() > 0
  console.log('Employees grid updated:', gridUpdated)
  expect(gridUpdated).toBe(true)
})
