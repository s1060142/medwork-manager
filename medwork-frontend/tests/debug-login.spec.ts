import { test, expect, type Page } from '@playwright/test'

test('debug login page', async ({ page }) => {
  const errors: string[] = []
  const logs: string[] = []
  
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`
    logs.push(text)
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`)
  })
  
  page.on('requestfailed', req => {
    const url = req.url()
    if (!url.includes('favicon')) {
      logs.push(`REQUEST FAILED: ${req.failure()?.errorText} - ${url}`)
    }
  })
  
  await page.goto('http://127.0.0.1:5173')
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  
  // Wait a bit more for React to render
  await page.waitForTimeout(3000)
  
  // Print page title
  const title = await page.title()
  console.log('Page title:', title)
  
  // Print page content
  const content = await page.content()
  console.log('Page content length:', content.length)
  console.log('Page content snippet:', content.substring(0, 3000))
  
  // Check for h1
  const h1Count = await page.locator('h1').count()
  console.log('H1 count:', h1Count)
  
  // Check for any input
  const inputCount = await page.locator('input').count()
  console.log('Input count:', inputCount)
  
  // Check for root div content
  const rootContent = await page.locator('#root').innerHTML()
  console.log('Root content length:', rootContent.length)
  console.log('Root content:', rootContent.substring(0, 2000))
  
  // Take screenshot
  await page.screenshot({ path: 'debug-login.png', fullPage: true })
  
  // Print console logs
  console.log('--- Console logs ---')
  for (const log of logs) {
    console.log(log)
  }
  
  console.log('--- Errors ---')
  for (const error of errors) {
    console.log(error)
  }
})
