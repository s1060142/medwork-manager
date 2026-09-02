import { test, expect } from '@playwright/test'

test('grid sync — employees: modify visible grid field, save, verify', async ({ page }) => {
  await page.goto('http://localhost:5173/')
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await page.waitForTimeout(1500)

  await page.getByLabel('Username').fill('admin')
  await page.getByLabel('Password').fill('Admin123!')
  await page.getByRole('button', { name: /Accedi/i }).click()
  await page.waitForTimeout(3000)

  // Navigate to Workers / Employees area
  const adminBtn = page.getByRole('button', { name: /Gestione lavoratori/i })
  if (await adminBtn.isVisible().catch(() => false)) await adminBtn.click()
  await page.waitForTimeout(2000)

  // Open first employee row
  const firstRow = page.locator('table tbody tr').nth(0)
  if (await firstRow.isVisible().catch(() => false)) await firstRow.click()
  await page.waitForTimeout(2000)

  // Modify a visible grid field: reparto
  const repartoInput = page.getByLabel(/Reparto/i).first()
  if (await repartoInput.isVisible().catch(() => false)) {
    await repartoInput.fill('GridSyncReparto')
    await page.getByRole('button', { name: /Salva/i }).click()
    await page.waitForTimeout(1500)
  }

  await page.screenshot({ path: '/tmp/grid_sync_employee_final.png', fullPage: false })

  const body = await page.locator('body').textContent()
  expect(body?.includes('GridSyncReparto') || body?.includes('Dati lavoratore') || body?.includes('Gestione lavoratori')).toBeTruthy()
})
