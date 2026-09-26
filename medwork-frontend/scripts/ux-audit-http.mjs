/** MedWork UX audit — request failure collector (no screenshots, fast) */
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://127.0.0.1:5173'
const failures = []
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()

page.on('response', (res) => {
  if (res.status() >= 400) failures.push({ status: res.status(), url: res.url() })
})

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('input[type="password"]', { timeout: 30000 })
await page.getByLabel('Username').fill('admin')
await page.getByLabel('Password').fill('Admin123!')
await page.locator('button[type="submit"]').click()
await page.waitForSelector('.legacy-sidebar', { timeout: 30000 })
await page.waitForTimeout(2500)

const areas = await page.locator('.legacy-sidebar .legacy-side-item').allInnerTexts()
for (let a = 0; a < areas.length; a++) {
  await page.locator('.legacy-sidebar .legacy-side-item').nth(a).click()
  await page.waitForTimeout(1200)
  const chips = await page.locator('.legacy-module-chip').allInnerTexts()
  for (let c = 0; c < chips.length; c++) {
    await page.locator('.legacy-module-chip').nth(c).click()
    await page.waitForTimeout(1400)
  }
}

await browser.close()
fs.writeFileSync(
  'c:/github/medwork-manager/screenshots/ux-audit/http-failures.json',
  JSON.stringify(failures, null, 2),
)
console.log('HTTP FAILURES:', failures.length)
for (const f of failures) console.log(`${f.status} ${f.url}`)
