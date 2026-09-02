import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 })
}

test.describe('Employee creation form', () => {
  test('should create an employee with valid data', async ({ page }) => {
    await loginAsAdmin(page)

    // Go to workers management
    await page.click('button:has-text("Gestione lavoratori")')
    await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

    // Click new employee button
    await page.click('button:has-text("Nuovo lavoratore")')
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[role="dialog"] getByText("Nuovo lavoratore")')).toBeVisible()

    // Select a company (we assume there is at least one company)
    const companySelect = page.locator('text="Azienda"').locator('xpath=..').locator('select')
    await expect(companySelect).toBeVisible()
    await companySelect.selectOption({ index: 1 }) // skip the first empty option

    // Wait for branches to load
    await page.waitForTimeout(1000)

    // Select a branch
    const branchSelect = page.locator('text="Sede"').locator('xpath=..').locator('select')
    await expect(branchSelect).toBeVisible()
    await branchSelect.selectOption({ index: 1 }) // skip the first empty option

    // Fill in the required fields
    await page.fill('input[placeholder="Es. Mario"]', 'Test')
    await page.fill('input[placeholder="Es. Rossi"]', 'Employee')
    await page.fill('input[placeholder="Es. 1990-01-01"]', '1990-01-01')
    await page.selectOption('select[name="gender"]', 'M')
    await page.fill('input[placeholder="Es. Milano"]', 'Milano')
    // The birthCityCode is hidden, but we hope it gets filled automatically by our fix
    // We'll fill the taxCode manually (we know a valid one for testing)
    await page.fill('input[placeholder="Es. RSSMRA80A01F205X"]', 'RSSMRA80A01F205X')
    await page.fill('input[placeholder="Es. Operatore linea"]', 'Test Job')

    // Save
    await page.click('button:has-text("Salva")')

    // Wait for success message or check that the dialog closes
    await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 5000 })
    // Optionally, check for a success snackbar
    await expect(page.getByText("Elemento creato correttamente.")).toBeVisible({ timeout: 5000 })
  })
})
