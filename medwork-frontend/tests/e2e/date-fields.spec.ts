import { test, expect } from '@playwright/test'
import { mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE = 'http://127.0.0.1:5173'
const API_URL = 'http://127.0.0.1:5279'
const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-results', 'date-tests')

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
  const unique = `DATETEST-${Date.now()}`
  const response = await request.post(`${API_URL}/api/admin-data/employees`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: {
      companyId: 1,
      branchId: 1,
      firstName: 'DateTest',
      lastName: unique,
      birthDate: '1990-05-15',
      gender: 'M',
      birthCity: 'Milano',
      birthCityCode: 'F205',
      taxCode: `DTE${Date.now().toString().slice(-9)}F205X`.slice(0, 16),
      jobRole: 'Operaio',
    },
  })
  return response.json()
}

test.describe('Date Field Tests', () => {
  test.beforeAll(() => {
    try {
      mkdirSync(SCREENSHOT_DIR, { recursive: true })
    } catch {
      // ignore
    }
  })

  test('Verify date field shows correct value in profile dialog', async ({ page, request }) => {
    // Create employee via API first
    const token = await getAuthToken(request)
    const employee = await createTestEmployeeViaAPI(request, token)
    console.log(`[DEBUG] Created employee: ${employee.firstName} ${employee.lastName} (ID: ${employee.id})`)
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
      await searchInput.fill('DateTest')
      await page.waitForTimeout(1000)
    }

    // Take screenshot showing employee in list
    await page.screenshot({ path: screenshotPath('1-employee-in-list.png'), fullPage: false })

    // Find the employee row and verify date is displayed correctly in the list
    const employeeRow = page.locator('table tbody tr', { hasText: 'DateTest' }).first()
    await employeeRow.waitFor({ state: 'visible', timeout: 10000 })

    // Check the date column (dd/MM/yyyy format)
    const dateCell = employeeRow.locator('td').nth(2) // Data nascita column
    const dateText = await dateCell.textContent()
    console.log(`[DEBUG] Date in employee list: "${dateText}"`)

    // Take screenshot of date in list
    await dateCell.screenshot({ path: screenshotPath('2-date-in-list.png') })

    // The date should be displayed in Italian format: 15/05/1990
    expect(dateText).toContain('15/05/1990')

    // Double-click on the row to open profile dialog
    await employeeRow.dblclick()
    await page.waitForTimeout(1000)

    // Take screenshot of profile dialog
    await page.screenshot({ path: screenshotPath('3-profile-dialog.png'), fullPage: false })

    // Check the birth date field in profile dialog
    // The label is "Data nascita*" in the profile dialog
    const birthDateInput = page.locator('[role="dialog"]').getByLabel('Data nascita*')
    const birthDateValue = await birthDateInput.inputValue()
    console.log(`[DEBUG] Birth date in profile dialog: "${birthDateValue}"`)

    // Take closeup of date field
    await birthDateInput.screenshot({ path: screenshotPath('4-profile-date-field.png') })

    // The date should be visible in dd/MM/yyyy format (Italian)
    expect(birthDateValue).toBe('15/05/1990')

    console.log('[TEST PASSED] Profile dialog shows correct birth date in Italian format')
  })

  test('Verify date field when creating new employee', async ({ page }) => {
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

    // Find the date input for "Data di Nascita"
    const dateInput = page.locator('[role="dialog"]').getByLabel('Data di Nascita')

    // Fill the date
    const testDate = '1985-12-25'
    await dateInput.fill(testDate)

    // Take screenshot after filling date
    await page.screenshot({ path: screenshotPath('6-date-filled.png'), fullPage: false })

    // Verify the date input has the correct value
    const dateValue = await dateInput.inputValue()
    console.log(`[DEBUG] Date input value after fill: "${dateValue}"`)

    // Take closeup of date field
    await dateInput.screenshot({ path: screenshotPath('7-date-field-closeup.png') })

    // The date should be visible
    expect(dateValue).toBe(testDate)

    console.log('[TEST PASSED] Date field accepts and shows date when creating new employee')
  })
})
