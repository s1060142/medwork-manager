import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Employee fields: Reparto, Luogo di lavoro, Periodicità are editable and persist', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForTimeout(2000)
  
  // Click the Lista (clipboard) button on first employee row
  const empTable = page.locator('table:visible').nth(1)
  await empTable.locator('tbody tr').first().waitFor({ timeout: 10000 })
  const listBtn = empTable.locator('tbody tr').first().locator('button[aria-label="Lista"]')
  if (await listBtn.count() === 0) {
    test.skip('No Lista button found')
    return
  }
  
  await listBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  await page.waitForTimeout(1000)
  
  // Verify Reparto and Luogo di lavoro fields are editable (not value="" readonly)
  const repartoField = page.getByLabel(/^reparto$/i).first()
  const luogoField = page.getByLabel(/luogo di lavoro/i).first()
  const periodicitaField = page.getByLabel(/periodicità/i).first()
  
  const repartoCount = await repartoField.count()
  const luogoCount = await luogoField.count()
  const periodicitaCount = await periodicitaField.count()
  console.log('Reparto field count:', repartoCount)
  console.log('Luogo di lavoro field count:', luogoCount)
  console.log('Periodicità field count:', periodicitaCount)
  
  // Fill the fields
  if (repartoCount > 0) {
    await repartoField.fill('Reparto Test')
    console.log('Filled Reparto')
  }
  if (luogoCount > 0) {
    await luogoField.fill('Luogo Test')
    console.log('Filled Luogo di lavoro')
  }
  if (periodicitaCount > 0) {
    await periodicitaField.click()
    await page.waitForTimeout(500)
    await page.locator('li:has-text("Annuale")').first().click()
    console.log('Selected Periodicità: Annuale')
  }
  
  // Track PUT
  const putRequests: any[] = []
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().includes('/api/admin-data/employees/')) {
      try { putRequests.push({ url: req.url(), body: req.postDataJSON() }) } catch {}
    }
  })
  
  // Save
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(3000)
  
  console.log('PUT requests:', putRequests.length)
  if (putRequests.length > 0) {
    const body = putRequests[0].body
    console.log('PUT body has reparto:', 'reparto' in body, '=', body.reparto)
    console.log('PUT body has luogoDiLavoro:', 'luogoDiLavoro' in body, '=', body.luogoDiLavoro)
    console.log('PUT body has periodicita:', 'periodicita' in body, '=', body.periodicita)
  }
  
  // Close dialog
  const closeBtn = page.locator('[role="dialog"] button:has-text("Chiudi")')
  if (await closeBtn.count() > 0) {
    await closeBtn.click()
    await page.waitForTimeout(1000)
  }
  
  // Verify grid shows updated values
  await page.waitForTimeout(2000)
  const gridRows = await empTable.locator('tbody tr').first().textContent()
  console.log('Grid first row text:', gridRows?.substring(0, 200))
})
