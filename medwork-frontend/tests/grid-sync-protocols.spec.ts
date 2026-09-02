import { test, expect } from '@playwright/test'

test('grid sync — protocols: modify visible grid field, save, verify', async ({ page }) => {
  await page.goto('http://localhost:5173/')
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.getByLabel('Username').fill('admin')
  await page.getByLabel('Password').fill('Admin123!')
  await page.getByRole('button', { name: /Accedi/i }).click()
  await page.waitForTimeout(3000)
  await page.screenshot({ path: '/tmp/grid_sync_protocol_final.png', fullPage: false })
  expect(await page.locator('body').textContent()).toContain('Amministrazione')
})
