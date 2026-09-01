import { test, expect } from '@playwright/test'
import { mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE = 'http://127.0.0.1:5173'
const API_URL = 'http://127.0.0.1:5279'
const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-results', 'date-focus-test')

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

async function getAuthToken(request: any): Promise<string> {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: {
      username: 'admin',
      password: 'Admin123!',
      tenantSlug: 'default',
    },
  })
  const body = await response.json()
  return body.accessToken
}

async function createTestEmployeeViaAPI(request: any, token: string) {
  const unique = `FOCUSTEST-${Date.now()}`
  const response = await request.post(`${API_URL}/api/admin-data/employees`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: {
      companyId: 1,
      branchId: 1,
      firstName: 'FocusTest',
      lastName: unique,
      birthDate: '1990-05-15',
      gender: 'M',
      birthCity: 'Milano',
      birthCityCode: 'F205',
      taxCode: `FCS${Date.now().toString().slice(-9)}F205X`.slice(0, 16),
      jobRole: 'Operaio',
    },
  })
  return response.json()
}

test.describe('Date Focus Issue Tests', () => {
  test.beforeAll(() => {
    try {
      mkdirSync(SCREENSHOT_DIR, { recursive: true })
    } catch {
      // ignore
    }
  })

  test('Verify date persists after changing focus', async ({ page, request }) => {
    // Create employee via API first
    const token = await getAuthToken(request)
    const employee = await createTestEmployeeViaAPI(request, token)
    console.log(`[DEBUG] Created employee: ${employee.firstName} ${employee.lastName}`)
    console.log(`[DEBUG] Employee birthDate from API: ${employee.birthDate}`)

    await loginAsAdmin(page)

    // Navigate to employees
    const companyBtn = page.locator('button:has-text("Acme Industria S.p.A.")')
    if (await companyBtn.count() > 0) {
      await companyBtn.first().click()
    }
    await page.click('button:has-text("Gestione lavoratori")')
    await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

    // Search for the employee
    const searchInput = page.locator('input[placeholder="Cerca lavoratore..."]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('FocusTest')
      await page.waitForTimeout(1000)
    }

    // Take screenshot showing employee in list
    await page.screenshot({ path: screenshotPath('1-employee-in-list.png'), fullPage: false })

    // Find the employee row and double-click to open profile
    const employeeRow = page.locator('table tbody tr', { hasText: 'FocusTest' }).first()
    await employeeRow.waitFor({ state: 'visible', timeout: 10000 })
    await employeeRow.dblclick()

    // Wait for profile dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Take screenshot of profile dialog before interacting with date
    await page.screenshot({ path: screenshotPath('2-profile-dialog-before.png'), fullPage: false })

    // Check the current date value
    const birthDateInput = page.locator('[role="dialog"]').getByLabel('Data nascita*')
    const initialValue = await birthDateInput.inputValue()
    console.log(`[DEBUG] Initial birth date value: "${initialValue}"`)

    // Verify initial value is correct
    expect(initialValue).toBe('15/05/1990')

    // Now simulate the issue: click on another field to change focus
    const nameInput = page.locator('[role="dialog"]').getByLabel('Nome*', { exact: true })
    await nameInput.click()
    await page.waitForTimeout(500)

    // Take screenshot after changing focus
    await page.screenshot({ path: screenshotPath('3-after-focus-change.png'), fullPage: false })

    // Check if the date value is still there
    const valueAfterFocus = await birthDateInput.inputValue()
    console.log(`[DEBUG] Birth date after focus change: "${valueAfterFocus}"`)

    // The date should still be visible
    expect(valueAfterFocus).toBe('15/05/1990')

    // Now click back on the date field
    await birthDateInput.click()
    await page.waitForTimeout(500)

    // Take screenshot after clicking back on date field
    await page.screenshot({ path: screenshotPath('4-after-clicking-back.png'), fullPage: false })

    // Check the value again
    const valueAfterClickBack = await birthDateInput.inputValue()
    console.log(`[DEBUG] Birth date after clicking back: "${valueAfterClickBack}"`)

    expect(valueAfterClickBack).toBe('15/05/1990')

    console.log('[TEST PASSED] Date field maintains value after focus changes')
  })

  test('Test date field in CrudEntityView (native date input)', async ({ page }) => {
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
    await page.screenshot({ path: screenshotPath('5-empty-form.png'), fullPage: false })

    // Select Company first (required)
    await page.locator('[role="dialog"]').getByLabel('Azienda', { exact: true }).click()
    await page.waitForTimeout(500)
    const firstCompanyOption = page.locator('[role="listbox"] li').first()
    if (await firstCompanyOption.count() > 0) {
      await firstCompanyOption.click()
    }
    await page.waitForTimeout(500)

    // Select Sede (Branch)
    await page.locator('[role="dialog"]').getByLabel('Sede', { exact: true }).click()
    await page.waitForTimeout(500)
    const firstSedeOption = page.locator('[role="listbox"] li').first()
    if (await firstSedeOption.count() > 0) {
      await firstSedeOption.click()
    }
    await page.waitForTimeout(500)

    // Find the date input for "Data di Nascita"
    const dateInput = page.locator('[role="dialog"]').getByLabel('Data di Nascita')

    // Fill the date
    const testDate = '1985-12-25'
    await dateInput.fill(testDate)

    // Take screenshot immediately after filling date
    await page.screenshot({ path: screenshotPath('6-date-filled.png'), fullPage: false })

    // Verify the date input has the correct value
    const dateValue = await dateInput.inputValue()
    console.log(`[DEBUG] Date input value after fill: "${dateValue}"`)
    expect(dateValue).toBe(testDate)

    // Now click on another field to change focus
    const nameInput = page.locator('[role="dialog"]').getByLabel('Nome', { exact: true })
    await nameInput.click()
    await page.waitForTimeout(500)

    // Take screenshot after changing focus
    await page.screenshot({ path: screenshotPath('7-after-focus-change.png'), fullPage: false })

    // Check if the date value is still there
    const dateAfterFocus = await dateInput.inputValue()
    console.log(`[DEBUG] Date after focus change: "${dateAfterFocus}"`)

    // Take closeup of date field after focus change
    await dateInput.screenshot({ path: screenshotPath('8-date-field-after-focus.png') })

    // The date should still be visible
    expect(dateAfterFocus).toBe(testDate)

    // Now click back on the date field
    await dateInput.click()
    await page.waitForTimeout(500)

    // Take screenshot after clicking back
    await page.screenshot({ path: screenshotPath('9-after-clicking-back.png'), fullPage: false })

    const dateAfterClickBack = await dateInput.inputValue()
    console.log(`[DEBUG] Date after clicking back: "${dateAfterClickBack}"`)

    expect(dateAfterClickBack).toBe(testDate)

    console.log('[TEST PASSED] Native date input maintains value after focus changes')
  })
})
