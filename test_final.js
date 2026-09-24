const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true, timeout: 15000 })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 15000 })
  console.log('Title:', await page.title())
  await page.screenshot({ path: '/tmp/modern_login_final.png', fullPage: false })
  console.log('Login screenshot saved to /tmp/modern_login_final.png')

  // Fill using labels (MUI TextField)
  await page.fill('label:has-text("Username") + div input', 'doctor')
  await page.fill('label:has-text("Password") + div input', 'Doctor123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForTimeout(4000)
  console.log('After login URL:', page.url())
  await page.screenshot({ path: '/tmp/modern_after_final.png', fullPage: true })
  console.log('After login screenshot saved to /tmp/modern_after_final.png')

  // Check if sidebar visible
  const sidebarVisible = await page.locator('nav[aria-label="sidebar"]').isVisible().catch(() => false)
  console.log('Sidebar visible:', sidebarVisible)

  await browser.close()
})()
