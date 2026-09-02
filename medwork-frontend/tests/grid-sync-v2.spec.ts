import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Companies: edit existing company, verify grid updates', async ({ page }) => {
  await loginAsAdmin(page)
  
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
  await page.waitForSelector('table tbody tr', { timeout: 10000 })
  
  // Get the first company row
  const firstRow = page.locator('table tbody tr').first()
  const originalName = await firstRow.locator('td').nth(1).textContent()
  console.log('Original name:', originalName)
  
  // Click Modifica
  const editBtn = firstRow.locator('button:has-text("Modifica")').first()
  await editBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  
  // The dialog should be pre-filled with existing data. Just modify the name field.
  const newName = 'Modified ' + Date.now()
  const nameInput = page.getByLabel(/nome azienda/i).first()
  await nameInput.fill(newName)
  
  // Track PUT requests
  const putRequests: any[] = []
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().includes('/api/admin-data/companies/')) {
      try {
        putRequests.push({ url: req.url(), body: req.postDataJSON() })
      } catch {
        putRequests.push({ url: req.url(), body: req.postData() })
      }
    }
  })
  
  // Click Salva
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(4000)
  const dialogClosed = (await page.locator('[role="dialog"]').count()) === 0
  console.log('Dialog closed:', dialogClosed)

  // Check PUT was made
  console.log('PUT requests count:', putRequests.length)
  if (putRequests.length > 0) {
    console.log('PUT body keys:', Object.keys(putRequests[0].body))
  }

  // Check if grid updated without manual refresh
  const updatedRow = page.locator('table tbody tr').filter({ hasText: newName }).first()
  const gridUpdated = await updatedRow.count() > 0
  console.log('Grid updated without refresh:', gridUpdated)
  
  expect(putRequests.length).toBeGreaterThan(0)
  expect(gridUpdated).toBe(true)
})

test('Employees: edit existing employee, verify grid updates', async ({ page }) => {
  await loginAsAdmin(page)
  
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
  
  // Wait for employees table (second table on page)
  const employeesTable = page.locator('table').nth(1)
  await employeesTable.waitFor({ timeout: 10000 })
  await employeesTable.locator('tbody tr').first().waitFor({ timeout: 10000 })
  
  const firstRow = employeesTable.locator('tbody tr').first()
  const originalName = await firstRow.locator('td').nth(1).textContent()
  console.log('Original employee:', originalName)
  
  // Click Modifica
  const editBtn = firstRow.locator('button:has-text("Modifica")').first()
  if (await editBtn.count() === 0) {
    console.log('No Modifica button')
    test.skip()
    return
  }
  await editBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  
  // Modify the Nome field (should be pre-filled)
  const newName = 'TestMod' + Date.now()
  const nomeInput = page.getByLabel(/^nome$/i).first()
  if (await nomeInput.count() > 0) {
    await nomeInput.fill(newName)
  }
  
  // Track PUT requests
  const putRequests: any[] = []
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().includes('/api/admin-data/employees/')) {
      try {
        putRequests.push({ url: req.url(), body: req.postDataJSON() })
      } catch {
        putRequests.push({ url: req.url(), body: req.postData() })
      }
    }
  })
  
  // Click Salva
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(3000)
  
  console.log('PUT requests count:', putRequests.length)
  if (putRequests.length > 0) {
    console.log('PUT body keys:', Object.keys(putRequests[0].body))
  }
  
  // Check if grid updated
  const updatedRow = employeesTable.locator('tbody tr').filter({ hasText: newName }).first()
  const gridUpdated = await updatedRow.count() > 0
  console.log('Grid updated:', gridUpdated)
  
  expect(putRequests.length).toBeGreaterThan(0)
  expect(gridUpdated).toBe(true)
})
