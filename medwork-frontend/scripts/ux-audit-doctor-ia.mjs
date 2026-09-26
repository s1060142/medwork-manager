/** Physician IA inventory: areas + module chips visible to the Doctor role */
import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:5173'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('input[type="password"]', { timeout: 30000 })
await page.getByLabel('Username').fill('doctor')
await page.getByLabel('Password').fill('Doctor123!')
await page.locator('button[type="submit"]').click()
await page.waitForSelector('.legacy-sidebar', { timeout: 30000 })
await page.waitForTimeout(2500)

const areas = await page.locator('.legacy-sidebar .legacy-side-item').allInnerTexts()
console.log('DOCTOR AREAS:', areas.map((a) => a.trim()).join(' | '))

for (let i = 0; i < areas.length; i++) {
  await page.locator('.legacy-sidebar .legacy-side-item').nth(i).click()
  await page.waitForTimeout(1200)
  const chips = await page.locator('.legacy-module-chip').allInnerTexts()
  console.log(`- ${areas[i].trim()} [${chips.length}]: ${chips.map((c) => c.trim()).join(', ')}`)
}

// chip strip overflow measurement
await page.locator('.legacy-sidebar .legacy-side-item').first().click()
await page.waitForTimeout(1200)
const strip = page.locator('.legacy-module-strip')
console.log(
  'CHIP STRIP:',
  JSON.stringify(
    await strip.evaluate((el) => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      clippedPx: el.scrollWidth - el.clientWidth,
      overflowX: getComputedStyle(el).overflowX,
    })),
  ),
)
await browser.close()
