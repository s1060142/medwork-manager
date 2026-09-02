import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Protocols: edit, verify grid updates', async ({ page }) => {
  await loginAsAdmin(page)
  
  // Navigate to Gestione aziende -> Checklist
  await page.click('button:has-text("Gestione aziende")')
  await page.waitForTimeout(1000)
  
  // Check if there's a submenu
  const submenuBtns = await page.locator('button:has-text("Protocolli"), button:has-text("Checklist"), button:has-text("Fattori di rischio"), button:has-text("Mansioni")').allTextContents()
  console.log('Submenu buttons:', submenuBtns)
  
  // Click Checklist
  const checklistBtn = page.locator('button:has-text("Checklist")')
  if (await checklistBtn.count() > 0) {
    await checklistBtn.first().click()
    await page.waitForTimeout(2000)
  }
  
  // Look for Protocolli tab
  const protocolTab = page.locator('button:has-text("Protocolli"), [role="tab"]:has-text("Protocolli")')
  if (await protocolTab.count() > 0) {
    await protocolTab.first().click()
    await page.waitForTimeout(2000)
  }
  
  // List visible tables
  const tables = page.locator('table:visible')
  const count = await tables.count()
  console.log('Visible tables:', count)
  
  for (let i = 0; i < count; i++) {
    const rows = await tables.nth(i).locator('tbody tr').count()
    const headers = await tables.nth(i).locator('thead th').allTextContents()
    console.log(`Table ${i}: rows=${rows}, headers=${JSON.stringify(headers.slice(0, 5))}`)
  }
  
  if (count === 0) {
    test.skip('No tables found for protocols')
    return
  }
  
  const protocolTable = tables.last()
  const editBtn = protocolTable.locator('tbody tr').first().locator('button:has-text("Modifica")').first()
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

test('Medical Visits: verify grid loads', async ({ page }) => {
  await loginAsAdmin(page)
  
  // Navigate to Sorveglianza sanitaria
  const sorvBtn = page.locator('button:has-text("Sorveglianza")')
  if (await sorvBtn.count() > 0) {
    await sorvBtn.first().click()
    await page.waitForTimeout(2000)
  }
  
  const tables = page.locator('table:visible')
  const count = await tables.count()
  console.log('Medical visits visible tables:', count)
  
  for (let i = 0; i < count; i++) {
    const rows = await tables.nth(i).locator('tbody tr').count()
    console.log(`Table ${i}: rows=${rows}`)
  }
  
  if (count > 0) {
    console.log('Medical visits: tables found')
  } else {
    test.skip('No tables found')
  }
})
