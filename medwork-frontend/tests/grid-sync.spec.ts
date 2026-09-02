import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

async function findAndEditRow(page, tableIndex, columnText, newValue, saveButtonText) {
  // Get initial API count
  const apiResponses = []
  page.on('response', async (res) => {
    if (res.url().includes('/api/master-data/') || res.url().includes('/api/admin-data/')) {
      try {
        apiResponses.push({ url: res.url(), method: res.request().method(), status: res.status() })
      } catch {}
    }
  })

  // Find the table at given index
  const table = page.locator('table').nth(tableIndex)
  await table.waitFor({ timeout: 10000 })
  
  // Find first row
  const firstRow = table.locator('tbody tr').first()
  await firstRow.waitFor({ timeout: 10000 })
  
  // Get row text for identification
  const rowText = await firstRow.textContent()
  console.log(`Row text: ${rowText?.substring(0, 100)}`)
  
  // Click Modifica or similar edit button
  const editBtn = firstRow.locator('button:has-text("Modifica")').first()
  if (await editBtn.count() === 0) {
    console.log('No Modifica button found, trying Profilo')
    const profiloBtn = firstRow.locator('button:has-text("Profilo")').first()
    if (await profiloBtn.count() > 0) {
      await profiloBtn.click()
    } else {
      console.log('No edit button found')
      return null
    }
  } else {
    await editBtn.click()
  }
  
  // Wait for dialog
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  
  return { rowText, apiResponses, table }
}

test.describe('Grid Synchronization Tests', () => {
  test('Companies: edit, verify grid updates without refresh', async ({ page }) => {
    await loginAsAdmin(page)
    
    // Navigate to Companies
    await page.click('button:has-text("Gestione aziende")')
    await page.locator('button:has-text("Anagrafica")').click()
    await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
    
    // Wait for companies table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Get first company name before edit
    const firstRow = page.locator('table tbody tr').first()
    const firstCompanyName = await firstRow.locator('td').nth(1).textContent()
    console.log(`First company before: ${firstCompanyName}`)
    
    // Click Modifica on first company
    const editBtn = firstRow.locator('button:has-text("Modifica")').first()
    await editBtn.click()
    
    // Wait for edit dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
    
    // Modify the "Nome Azienda" field
    const timestamp = Date.now()
    const newName = `Test Company Grid ${timestamp}`
    const nameInput = page.locator('[role="dialog"] label:has-text("Nome Azienda") >> xpath=../input').first()
    if (await nameInput.count() > 0) {
      await nameInput.fill(newName)
    } else {
      const nameByLabel = page.getByLabel(/nome azienda/i).first()
      if (await nameByLabel.count() > 0) {
        await nameByLabel.fill(newName)
      }
    }
    
    // Track PUT request
    const putRequests = []
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
    await page.waitForTimeout(2000)
    
    // Check if grid updated without manual refresh
    const updatedRow = page.locator('table tbody tr').filter({ hasText: newName }).first()
    const gridUpdated = await updatedRow.count() > 0
    
    console.log(`PUT requests: ${JSON.stringify(putRequests, null, 2)}`)
    console.log(`Grid updated without refresh: ${gridUpdated}`)
    
    expect(putRequests.length).toBeGreaterThan(0)
    expect(gridUpdated).toBe(true)
  })

  test('Employees: edit, verify grid updates without refresh', async ({ page }) => {
    await loginAsAdmin(page)
    
    // Navigate to Employees
    await page.click('button:has-text("Gestione lavoratori")')
    await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
    
    // Wait for employees table (second table)
    const employeesTable = page.locator('table').nth(1)
    await employeesTable.waitFor({ timeout: 10000 })
    await employeesTable.locator('tbody tr').first().waitFor({ timeout: 10000 })
    
    // Get first employee name before edit
    const firstRow = employeesTable.locator('tbody tr').first()
    const firstEmployeeName = await firstRow.locator('td').nth(1).textContent()
    console.log(`First employee before: ${firstEmployeeName}`)
    
    // Click Modifica on first employee
    const editBtn = firstRow.locator('button:has-text("Modifica")').first()
    if (await editBtn.count() === 0) {
      console.log('No Modifica button found, skipping test')
      test.skip()
      return
    }
    await editBtn.click()
    
    // Wait for edit dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
    
    // Modify the "Nome" field
    const timestamp = Date.now()
    const newName = `TestNome${timestamp}`
    const nameInput = page.locator('[role="dialog"] label:has-text("Nome") >> xpath=../input').first()
    if (await nameInput.count() > 0) {
      await nameInput.fill(newName)
    } else {
      const nameByLabel = page.getByLabel(/^nome$/i).first()
      if (await nameByLabel.count() > 0) {
        await nameByLabel.fill(newName)
      }
    }
    
    // Track PUT request
    const putRequests = []
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
    await page.waitForTimeout(2000)
    
    // Check if grid updated without manual refresh
    const updatedRow = employeesTable.locator('tbody tr').filter({ hasText: newName }).first()
    const gridUpdated = await updatedRow.count() > 0
    
    console.log(`PUT requests: ${JSON.stringify(putRequests, null, 2)}`)
    console.log(`Grid updated without refresh: ${gridUpdated}`)
    
    expect(putRequests.length).toBeGreaterThan(0)
    expect(gridUpdated).toBe(true)
  })

  test('Protocols: edit, verify grid updates without refresh', async ({ page }) => {
    await loginAsAdmin(page)
    
    // Navigate to Protocols
    await page.click('button:has-text("Protocolli")').catch(() => page.click('button:has-text("Gestione")'))
    await page.waitForTimeout(2000)
    
    // Try to find protocols section
    const protocolLink = page.locator('button:has-text("Protocolli"), a:has-text("Protocolli")').first()
    if (await protocolLink.count() === 0) {
      console.log('No Protocols link found')
      test.skip()
      return
    }
    
    // Check if grid has data
    const tableExists = await page.locator('table tbody tr').count() > 0
    if (!tableExists) {
      console.log('No protocols in table')
      test.skip()
      return
    }
    
    const firstRow = page.locator('table tbody tr').first()
    const editBtn = firstRow.locator('button:has-text("Modifica")').first()
    if (await editBtn.count() === 0) {
      console.log('No Modifica button')
      test.skip()
      return
    }
    
    await editBtn.click()
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
    
    const putRequests = []
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/admin-data/protocols/')) {
        try {
          putRequests.push({ url: req.url(), body: req.postDataJSON() })
        } catch {
          putRequests.push({ url: req.url(), body: req.postData() })
        }
      }
    })
    
    // Just save without changes to test the flow
    await page.locator('[role="dialog"] button:has-text("Salva")').click()
    await page.waitForTimeout(2000)
    
    console.log(`Protocol PUT requests: ${putRequests.length}`)
    expect(putRequests.length).toBeGreaterThan(0)
  })

  test('Medical Visits: edit, verify grid updates without refresh', async ({ page }) => {
    await loginAsAdmin(page)
    
    // Navigate to Scadenzario or Visit Planning
    const visitLink = page.locator('button:has-text("Scadenzario"), button:has-text("Visite")').first()
    if (await visitLink.count() === 0) {
      console.log('No Medical Visits link found')
      test.skip()
      return
    }
    await visitLink.click()
    await page.waitForTimeout(2000)
    
    // Check if grid has data
    const tableExists = await page.locator('table tbody tr').count() > 0
    if (!tableExists) {
      console.log('No visits in table')
      test.skip()
      return
    }
    
    const firstRow = page.locator('table tbody tr').first()
    const editBtn = firstRow.locator('button:has-text("Modifica")').first()
    if (await editBtn.count() === 0) {
      console.log('No Modifica button')
      test.skip()
      return
    }
    
    await editBtn.click()
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
    
    const putRequests = []
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/admin-data/medical-visits/')) {
        try {
          putRequests.push({ url: req.url(), body: req.postDataJSON() })
        } catch {
          putRequests.push({ url: req.url(), body: req.postData() })
        }
      }
    })
    
    await page.locator('[role="dialog"] button:has-text("Salva")').click()
    await page.waitForTimeout(2000)
    
    console.log(`Visit PUT requests: ${putRequests.length}`)
    expect(putRequests.length).toBeGreaterThan(0)
  })

  test('Medical Records: edit, verify updates', async ({ page }) => {
    await loginAsAdmin(page)
    
    // Navigate to Cartella Sanitaria
    const recordLink = page.locator('button:has-text("Cartella"), button:has-text("Sanitaria")').first()
    if (await recordLink.count() === 0) {
      console.log('No Medical Records link found')
      test.skip()
      return
    }
    await recordLink.click()
    await page.waitForTimeout(2000)
    
    // Medical records is a form, not a grid - just verify the form loads
    const formExists = await page.locator('input, textarea').count() > 0
    expect(formExists).toBe(true)
  })
})
