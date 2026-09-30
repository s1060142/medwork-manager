import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

test('Verifica assenza effetto selezione al click singolo e apertura con doppio click', async ({ page }) => {
  // 1. Login
  await page.goto(BASE)
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await expect(page.locator('button:has-text("Logout")')).toBeVisible({ timeout: 15000 })

  // 2. Navigate to Aziende
  await page.goto(`${BASE}/#/company-management/companies`)
  await page.waitForSelector('table tbody tr', { timeout: 10000 })

  const firstRow = page.locator('table tbody tr').first()
  await expect(firstRow).toBeVisible()

  // 3. Single click on entity row
  await firstRow.click()
  await page.waitForTimeout(300)

  // Verify NO Mui-selected class and no blue outline or focus background
  const hasSelectedClass = await firstRow.evaluate((el) => el.classList.contains('Mui-selected'))
  expect(hasSelectedClass).toBe(false)

  // Verify background is not blue / selected
  const computedBg = await firstRow.evaluate((el) => window.getComputedStyle(el).backgroundColor)
  expect(computedBg).not.toContain('rgba(59, 130, 246')

  // 4. Double click on entity row
  await firstRow.dblclick()
  await page.waitForTimeout(600)

  // Verify dialog opens on double-click
  const dialog = page.locator('[role="dialog"]').first()
  await expect(dialog).toBeVisible({ timeout: 5000 })
})
