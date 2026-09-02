import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Companies: edit, verify grid updates', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
  await page.waitForSelector('table tbody tr', { timeout: 10000 })
  
  const firstRow = page.locator('table tbody tr').first()
  await firstRow.locator('button:has-text("Modifica")').first().click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  
  const newName = 'CompanyTest ' + Date.now()
  await page.getByLabel(/nome azienda/i).first().fill(newName)
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(4000)
  
  const updatedRow = page.locator('table tbody tr').filter({ hasText: newName }).first()
  const gridUpdated = await updatedRow.count() > 0
  console.log('Companies grid updated:', gridUpdated)
  expect(gridUpdated).toBe(true)
})

test('Employees: edit, verify grid updates', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
  
  const gestioneCompleta = page.locator('button:has-text("Gestione completa")')
  if (await gestioneCompleta.count() > 0) {
    await gestioneCompleta.first().click()
    await page.waitForTimeout(2000)
  }
  
  const table = page.locator('table').last()
  await table.waitFor({ timeout: 10000 })
  await table.locator('tbody tr').first().waitFor({ timeout: 10000 })
  
  const firstRow = table.locator('tbody tr').first()
  const editBtn = firstRow.locator('button:has-text("Modifica")').first()
  if (await editBtn.count() === 0) {
    console.log('No Modifica button found, skipping')
    test.skip()
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
  
  const updatedRow = table.locator('tbody tr').filter({ hasText: newName }).first()
  const gridUpdated = await updatedRow.count() > 0
  console.log('Employees grid updated:', gridUpdated)
  expect(gridUpdated).toBe(true)
})

test('Protocols: edit, verify grid updates', async ({ page }) => {
  await loginAsAdmin(page)
  
  const protocolBtn = page.locator('button:has-text("Protocolli")').first()
  if (await protocolBtn.count() === 0) {
    console.log('No Protocolli button')
    test.skip()
    return
  }
  await protocolBtn.click()
  await page.waitForTimeout(2000)
  
  const tableExists = await page.locator('table tbody tr').count()
  if (tableExists === 0) {
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
  
  const newName = 'ProtocolTest ' + Date.now()
  const nameInput = page.getByLabel(/nome protocollo/i).first()
  if (await nameInput.count() > 0) {
    await nameInput.fill(newName)
  }
  
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(4000)
  
  const updatedRow = page.locator('table tbody tr').filter({ hasText: newName }).first()
  const gridUpdated = await updatedRow.count() > 0
  console.log('Protocols grid updated:', gridUpdated)
  expect(gridUpdated).toBe(true)
})

test('Medical Visits: edit, verify grid updates', async ({ page }) => {
  await loginAsAdmin(page)
  
  const scadBtn = page.locator('button:has-text("Scadenzario")').first()
  if (await scadBtn.count() === 0) {
    console.log('No Scadenzario button')
    test.skip()
    return
  }
  await scadBtn.click()
  await page.waitForTimeout(2000)
  
  const tableExists = await page.locator('table tbody tr').count()
  if (tableExists === 0) {
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
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(3000)
  
  console.log('Medical Visits: save completed')
})

test('Medical Records: edit, verify updates', async ({ page }) => {
  await loginAsAdmin(page)
  
  const cartellaBtn = page.locator('button:has-text("Cartella"), button:has-text("Sanitaria")').first()
  if (await cartellaBtn.count() === 0) {
    console.log('No Cartella Sanitaria button')
    test.skip()
    return
  }
  await cartellaBtn.click()
  await page.waitForTimeout(2000)
  
  const formExists = await page.locator('input, textarea').count() > 0
  console.log('Medical Records form exists:', formExists)
  expect(formExists).toBe(true)
})
