import { test, expect } from '@playwright/test'
import { mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE = 'http://127.0.0.1:5173'
const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-results', 'date-debug')

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

test.describe('Date Placeholder Debug', () => {
  test.beforeAll(() => {
    try {
      mkdirSync(SCREENSHOT_DIR, { recursive: true })
    } catch {
      // ignore
    }
  })

  test('Debug placeholder visibility in create form', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to employees
    const companyBtn = page.locator('button:has-text("Acme Industria S.p.A.")')
    if (await companyBtn.count() > 0) {
      await companyBtn.first().click()
    }
    await page.click('button:has-text("Gestione lavoratori")')
    await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

    // Click "+ Nuovo lavoratore"
    const newButton = page.locator('button:has-text("+ Nuovo lavoratore")')
    await newButton.click()
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Take screenshot of empty form
    await page.screenshot({ path: screenshotPath('1-empty-form.png'), fullPage: false })

    // Find the empty date input
    const emptyDateInput = page.locator('[role="dialog"]').getByLabel('Data di Nascita')
    
    // Check attributes
    const typeAttr = await emptyDateInput.getAttribute('type')
    const requiredAttr = await emptyDateInput.getAttribute('required')
    const valueAttr = await emptyDateInput.getAttribute('value')
    const dataHasValue = await emptyDateInput.getAttribute('data-has-value')
    console.log(`[DEBUG] type="${typeAttr}", required="${requiredAttr}", value="${valueAttr}", data-has-value="${dataHasValue}"`)

    // Take closeup of empty date field
    await emptyDateInput.screenshot({ path: screenshotPath('2-empty-date-field.png') })

    // Check computed styles for webkit pseudo-elements
    const styles = await emptyDateInput.evaluate((el) => {
      // Create a temporary style to check if CSS rules are applied
      const tempStyle = document.createElement('span')
      tempStyle.className = 'test-date-style'
      el.parentElement?.appendChild(tempStyle)
      const computedTemp = window.getComputedStyle(tempStyle)
      
      // Check if our CSS is loaded
      const styleSheets = Array.from(document.styleSheets)
      let hasDateRule = false
      try {
        for (const sheet of styleSheets) {
          try {
            const rules = Array.from(sheet.cssRules || [])
            for (const rule of rules) {
              if (rule.cssText && rule.cssText.includes('date')) {
                hasDateRule = true
                break
              }
            }
          } catch {
            // CORS issue with external stylesheets
          }
        }
      } catch {
        // ignore
      }
      
      el.parentElement?.removeChild(tempStyle)
      
      return {
        hasDateRuleInCSS: hasDateRule,
        inputValue: el.value,
        inputType: el.type,
        inputRequired: el.required,
      }
    })
    console.log(`[DEBUG] Style check:`, styles)

    // Fill the date
    await emptyDateInput.fill('1985-12-25')
    await page.waitForTimeout(500)
    
    // Take screenshot of filled date
    await emptyDateInput.screenshot({ path: screenshotPath('3-date-filled.png') })

    const filledValue = await emptyDateInput.inputValue()
    console.log(`[DEBUG] Filled date input value: "${filledValue}"`)

    // Click away to lose focus
    const nameInput = page.locator('[role="dialog"]').getByLabel('Nome', { exact: true })
    await nameInput.click()
    await page.waitForTimeout(500)
    
    // Take screenshot of date when not focused
    await emptyDateInput.screenshot({ path: screenshotPath('4-date-unfocused.png') })

    // Click back on date
    await emptyDateInput.click()
    await page.waitForTimeout(500)
    await emptyDateInput.screenshot({ path: screenshotPath('5-date-focused-again.png') })

    // Take full dialog screenshot
    await page.screenshot({ path: screenshotPath('6-full-dialog.png'), fullPage: false })

    console.log('[TEST COMPLETE] Check screenshots in test-results/date-debug/')
  })

  test('Debug placeholder in profile dialog', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to employees
    const companyBtn = page.locator('button:has-text("Acme Industria S.p.A.")')
    if (await companyBtn.count() > 0) {
      await companyBtn.first().click()
    }
    await page.click('button:has-text("Gestione lavoratori")')
    await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

    // Search for any employee with birth date
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
    await page.screenshot({ path: screenshotPath('7-profile-dialog.png'), fullPage: false })

    // Find the date input
    const birthDateInput = page.locator('[role="dialog"]').getByLabel('Data nascita*')
    const dateValue = await birthDateInput.inputValue()
    console.log(`[DEBUG] Profile date value: "${dateValue}"`)

    // Take closeup of date field
    await birthDateInput.screenshot({ path: screenshotPath('8-profile-date-field.png') })

    // Click on another field
    const nameInput = page.locator('[role="dialog"]').getByLabel('Nome*', { exact: true })
    await nameInput.click()
    await page.waitForTimeout(500)
    
    // Take screenshot when not focused
    await birthDateInput.screenshot({ path: screenshotPath('9-profile-date-unfocused.png') })

    console.log('[TEST COMPLETE] Check screenshots in test-results/date-debug/')
  })
})
