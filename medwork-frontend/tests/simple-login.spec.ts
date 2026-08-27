import { test, expect } from '@playwright/test'
import { TestFixtures } from './fixtures/test-fixtures'

test('simple login check', async ({ page, request, context }) => {
  const fixtures = new TestFixtures(page, request, context)
  
  // Just navigate and check if page loads
  await page.goto('http://127.0.0.1:5173')
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  
  // Take screenshot
  await page.screenshot({ path: 'simple-login.png', fullPage: true })
  
  // Check what's on the page
  const title = await page.title()
  console.log('Title:', title)
  
  const bodyText = await page.locator('body').textContent()
  console.log('Body text:', bodyText?.substring(0, 500))
  
  // Try to find any input
  const inputs = await page.locator('input').all()
  console.log('Inputs found:', inputs.length)
  for (const input of inputs) {
    const placeholder = await input.getAttribute('placeholder')
    const id = await input.getAttribute('id')
    const type = await input.getAttribute('type')
    console.log(`Input: type=${type}, placeholder=${placeholder}, id=${id}`)
  }
  
  // Try the exact selector from LoginPage
  const usernameInput = page.locator('input[placeholder="Username"], input[id*="username"], input[id*="user"]')
  const count = await usernameInput.count()
  console.log('Username locator count:', count)
  
  if (count > 0) {
    await usernameInput.fill('admin')
    console.log('Filled username successfully')
  }
})
