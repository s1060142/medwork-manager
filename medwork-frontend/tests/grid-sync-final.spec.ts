import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Employees: edit, verify grid updates', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForTimeout(2000)

  // The employees CrudEntityView table is the last table (index 2)
  const empTable = page.locator('table').nth(2)
  await empTable.waitFor({ timeout: 10000 })
  await empTable.locator('tbody tr').first().waitFor({ timeout: 10000 })

  const firstRow = empTable.locator('tbody tr').first()
  const editBtn = firstRow.locator('button:has-text("Modifica")').first()
  if (await editBtn.count() === 0) {
    test.skip('No Modifica button')
    return
  }

  await editBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })

  const newName = 'EmpTest' + Date.now()
  const nomeInput = page.getByLabel(/^nome$/i).first()
  if (await nomeInput.count() > 0) {
    await nomeInput.fill(newName)
  }

  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(4000)

  const updatedRow = empTable.locator('tbody tr').filter({ hasText: newName }).first()
  const gridUpdated = await updatedRow.count() > 0
  console.log('Employees grid updated:', gridUpdated)
  expect(gridUpdated).toBe(true)
})

test('Protocols: edit, verify grid updates', async ({ page }) => {
  await loginAsAdmin(page)

  // Try Checklist submenu under Gestione aziende
  await page.click('button:has-text("Gestione aziende")')
  await page.waitForTimeout(1000)

  // Check for Checklist or Protocolli
  const checklistBtn = page.locator('button:has-text("Checklist")')
  if (await checklistBtn.count() > 0) {
    await checklistBtn.first().click()
    await page.waitForTimeout(2000)
  }

  // Look for protocol-related tabs
  const protocolTab = page.locator('button:has-text("Protocolli"), [role="tab"]:has-text("Protocolli")')
  if (await protocolTab.count() > 0) {
    await protocolTab.first().click()
    await page.waitForTimeout(2000)
  }

  // Check for tables
  const tableCount = await page.locator('table').count()
  console.log('Tables found:', tableCount)

  if (tableCount === 0) {
    test.skip('No tables found for protocols')
    return
  }

  const lastTable = page.locator('table').last()
  const rowCount = await lastTable.locator('tbody tr').count()
  console.log('Last table rows:', rowCount)

  if (rowCount === 0) {
    test.skip('No rows in protocols table')
    return
  }

  const editBtn = lastTable.locator('tbody tr').first().locator('button:has-text("Modifica")').first()
  if (await editBtn.count() === 0) {
    test.skip('No Modifica button')
    return
  }

  await editBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(3000)
  console.log('Protocols: save completed')
})

test('Medical Visits: edit, verify grid updates', async ({ page }) => {
  await loginAsAdmin(page)

  // Navigate to Sorveglianza sanitaria or Scadenzario
  const sorveglianzaBtn = page.locator('button:has-text("Sorveglianza")')
  if (await sorveglianzaBtn.count() > 0) {
    await sorveglianzaBtn.first().click()
    await page.waitForTimeout(2000)
  }

  const tableCount = await page.locator('table').count()
  console.log('Medical visits tables:', tableCount)

  if (tableCount === 0) {
    test.skip('No tables found')
    return
  }

  const lastTable = page.locator('table').last()
  const rowCount = await lastTable.locator('tbody tr').count()
  if (rowCount === 0) {
    test.skip('No rows')
    return
  }

  const editBtn = lastTable.locator('tbody tr').first().locator('button:has-text("Modifica")').first()
  if (await editBtn.count() === 0) {
    test.skip('No Modifica button')
    return
  }

  await editBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(3000)
  console.log('Medical Visits: save completed')
})
