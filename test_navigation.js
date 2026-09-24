import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  // 1. Open frontend
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  console.log('Step 1: Frontend loaded - title:', await page.title())
  await page.screenshot({ path: '/tmp/01_frontend_loaded.png', fullPage: true })

  // 2. Try login as doctor
  await page.fill('input[name="username"]', 'doctor')
  await page.fill('input[name="password"]', 'Doctor123!')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2000)
  console.log('Step 2: Login attempted')
  await page.screenshot({ path: '/tmp/02_after_login.png', fullPage: true })

  // 3. Check for sidebar / navigation elements
  const hasSidebar = await page.locator('nav, [aria-label="sidebar"]').isVisible().catch(() => false)
  console.log('Step 3: Sidebar visible:', hasSidebar)

  await browser.close()
}

run().catch(console.error)
