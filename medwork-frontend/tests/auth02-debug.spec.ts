import { test, expect } from '@playwright/test'

test('AUTH-02 debug', async ({ page }) => {
  // Navigate first
  await page.goto('http://127.0.0.1:5173')
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  
  // Clear any auth state
  await page.evaluate(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('role')
    localStorage.removeItem('medwork.runtime.settings')
  })
  
  // Reload to see login page
  await page.reload()
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await page.waitForTimeout(2000)
  
  // Check what's visible
  const bodyText = await page.locator('body').textContent()
  console.log('Body text:', bodyText?.substring(0, 300))
  
  // Try getByLabel
  const usernameByLabel = page.getByLabel('Username')
  console.log('Username by label visible:', await usernameByLabel.isVisible())
  
  // Try all inputs
  const inputs = await page.locator('input').all()
  console.log('Input count:', inputs.length)
  for (const input of inputs) {
    const label = await input.evaluate(el => {
      const label = document.querySelector(`label[for="${el.id}"]`)
      return label?.textContent || 'no label'
    })
    console.log('Input label:', label)
  }
  
  // Try filling
  try {
    await usernameByLabel.fill('doctor')
    console.log('Fill succeeded')
  } catch (e) {
    console.log('Fill failed:', e)
  }
})
