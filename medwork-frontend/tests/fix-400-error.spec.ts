import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Employee 400 fix: no more 400 on employee save', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForTimeout(3000)

  // The employees table with Lista buttons is the 2nd visible table (index 1)
  const empTable = page.locator('table:visible').nth(1)
  await empTable.locator('tbody tr').first().waitFor({ timeout: 10000 })

  // Get first employee name
  const firstRow = empTable.locator('tbody tr').first()
  const employeeName = await firstRow.locator('td').nth(1).textContent()
  console.log('First employee:', employeeName)

  // Open the employee profile via Lista button
  const listBtn = firstRow.locator('button[aria-label="Lista"]')
  await listBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  await page.waitForTimeout(1000)

  // Track all PUT requests and responses
  const putRequests: any[] = []
  const putResponses: any[] = []
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().includes('/api/admin-data/employees/')) {
      try { putRequests.push({ url: req.url(), body: req.postDataJSON() }) } catch {}
    }
  })
  page.on('response', async (res) => {
    if (res.request().method() === 'PUT' && res.url().includes('/api/admin-data/employees/')) {
      try { putResponses.push({ url: res.url(), status: res.status(), body: await res.text() }) } catch {}
    }
  })

  // Modify a field (reparto) and save
  const timestamp = Date.now()
  const repartoValue = `Reparto_${timestamp}`
  const repartoField = page.getByLabel(/^reparto$/i).first()
  await repartoField.fill(repartoValue)

  // Save
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(3000)

  console.log('PUT requests count:', putRequests.length)
  if (putRequests.length > 0) {
    const body = putRequests[0].body
    console.log('PUT body companyId:', body.companyId, '(type:', typeof body.companyId, ')')
    console.log('PUT body branchId:', body.branchId, '(type:', typeof body.branchId, ')')
    console.log('PUT body has reparto:', body.reparto)
  }

  console.log('PUT responses count:', putResponses.length)
  if (putResponses.length > 0) {
    console.log('PUT response status:', putResponses[0].status)
    console.log('PUT response body:', putResponses[0].body?.substring(0, 300))
  }

  // Assert no 400 error
  const has400 = putResponses.some(r => r.status === 400)
  expect(has400).toBe(false)
})
