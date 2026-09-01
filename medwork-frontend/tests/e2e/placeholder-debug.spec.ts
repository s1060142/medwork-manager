import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page: any) {
  await page.goto(BASE)
  await page.evaluate(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('role')
    localStorage.removeItem('medwork.runtime.settings')
  })
  await page.reload()
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await page.waitForTimeout(1000)

  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Debug placeholder visibility', async ({ page }) => {
  test.setTimeout(60000)
  await loginAsAdmin(page)

  // Navigate to employees
  const companyBtn = page.locator('button:has-text("Acme Industria S.p.A.")')
  if (await companyBtn.count() > 0) {
    await companyBtn.first().click()
  }
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

  // Search for Colombo
  const searchInput = page.locator('input[placeholder="Cerca lavoratore..."]')
  if (await searchInput.count() > 0) {
    await searchInput.fill('Colombo')
    await page.waitForTimeout(1000)
  }

  // Find the employee row and double-click
  const employeeRow = page.locator('table tbody tr', { hasText: 'Colombo' }).first()
  await employeeRow.waitFor({ state: 'visible', timeout: 10000 })
  await employeeRow.dblclick()

  // Wait for profile dialog
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  await page.waitForTimeout(1000)

  // Get the page snapshot
  const snapshot = await page.locator('[role="dialog"]').innerHTML()
  console.log('[SNAPSHOT]', snapshot.substring(0, 2000))

  // Check the date input specifically
  const birthDateInput = page.locator('[role="dialog"]').getByLabel('Data nascita*')
  
  // Get detailed info about the input
  const inputDetails = await birthDateInput.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    const style = window.getComputedStyle(el)
    
    // Check for any overlay elements
    const parent = el.parentElement
    const siblings = parent ? Array.from(parent.children).map(c => ({
      tag: c.tagName,
      class: c.className,
      text: c.textContent?.substring(0, 100),
    })) : []
    
    return {
      value: el.value,
      type: el.type,
      placeholder: el.placeholder,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      style: {
        color: style.color,
        backgroundColor: style.backgroundColor,
        opacity: style.opacity,
        position: style.position,
      },
      parentTag: parent?.tagName,
      parentClass: parent?.className,
      siblings: siblings,
      // Check for pseudo-elements
      beforeContent: window.getComputedStyle(el, '::before').content,
      afterContent: window.getComputedStyle(el, '::after').content,
      placeholderColor: window.getComputedStyle(el, '::placeholder').color,
    }
  })
  
  console.log('[INPUT DETAILS]', JSON.stringify(inputDetails, null, 2))

  // Take screenshot and save to test-results
  await birthDateInput.screenshot({ path: 'test-results/placeholder-check.png' })
  
  console.log('[TEST COMPLETE] Check test-results/placeholder-check.png')
})
