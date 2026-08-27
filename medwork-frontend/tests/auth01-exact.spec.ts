import { test, expect } from '@playwright/test'

test('AUTH-01 exact setup', async ({ page, request, context }) => {
  // Navigate and wait
  await page.goto('http://127.0.0.1:5173')
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await page.waitForTimeout(2000)
  
  // Use getByLabel
  const usernameInput = page.getByLabel('Username')
  const passwordInput = page.getByLabel('Password')
  
  console.log('Username visible:', await usernameInput.isVisible())
  console.log('Password visible:', await passwordInput.isVisible())
  
  await usernameInput.fill('admin')
  await passwordInput.fill('Admin123!')
  await page.getByRole('button', { name: 'Accedi' }).click()
  
  // Wait for navigation/dashboard
  await page.waitForTimeout(3000)
  
  // Check if dashboard loaded
  const bodyText = await page.locator('body').textContent()
  console.log('After login body:', bodyText?.substring(0, 300))
  
  // Check for administration button
  const adminBtn = page.getByRole('button', { name: /Amministrazione|Administration/i })
  console.log('Admin button visible:', await adminBtn.isVisible())
})
