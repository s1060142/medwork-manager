import { test, expect } from '@playwright/test'
import { mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE = 'http://127.0.0.1:5173'
const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-results', 'date-final-check')

function screenshotPath(filename: string): string {
  return path.join(SCREENSHOT_DIR, filename)
}

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

test.describe('Final Date Check', () => {
  test.beforeAll(() => {
    try {
      mkdirSync(SCREENSHOT_DIR, { recursive: true })
    } catch {
      // ignore
    }
  })

  test('Check date display in profile dialog', async ({ page }) => {
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
    await page.waitForTimeout(500)

    // Take screenshot of profile dialog
    await page.screenshot({ path: screenshotPath('1-profile-dialog.png'), fullPage: false })

    // Find the date input and check its state
    const birthDateInput = page.locator('[role="dialog"]').getByLabel('Data nascita*')
    const dateValue = await birthDateInput.inputValue()
    console.log(`[RESULT] Date value: "${dateValue}"`)

    // Get all attributes of the input
    const inputInfo = await birthDateInput.evaluate((el) => {
      return {
        value: el.value,
        type: el.type,
        placeholder: el.placeholder,
        hasValue: el.value !== '',
        computedStyle: {
          color: window.getComputedStyle(el).color,
        },
        // Check if there's any overlay or pseudo-element
        parentHTML: el.parentElement?.innerHTML.substring(0, 500),
      }
    })
    console.log(`[RESULT] Input info:`, JSON.stringify(inputInfo, null, 2))

    // Take closeup of date field
    await birthDateInput.screenshot({ path: screenshotPath('2-date-field-closeup.png') })

    // Click on another field and check again
    const nameInput = page.locator('[role="dialog"]').getByLabel('Nome*', { exact: true })
    await nameInput.click()
    await page.waitForTimeout(500)

    // Take screenshot after focus change
    await page.screenshot({ path: screenshotPath('3-after-focus-change.png'), fullPage: false })

    const dateAfterFocus = await birthDateInput.inputValue()
    console.log(`[RESULT] Date after focus change: "${dateAfterFocus}"`)

    // Check if placeholder is visible
    const placeholderCheck = await birthDateInput.evaluate((el) => {
      // Check computed style for placeholder
      const placeholderStyle = window.getComputedStyle(el, '::placeholder')
      return {
        placeholderText: el.placeholder,
        placeholderColor: placeholderStyle?.color || 'not accessible',
        placeholderOpacity: placeholderStyle?.opacity || 'not accessible',
        // Check if value is actually displayed
        displayValue: el.value,
      }
    })
    console.log(`[RESULT] Placeholder check:`, placeholderCheck)

    // Final assertion
    expect(dateValue).toBe('12/02/1985')
    expect(dateAfterFocus).toBe('12/02/1985')

    console.log('[TEST COMPLETE] Date display is working correctly')
  })
})
