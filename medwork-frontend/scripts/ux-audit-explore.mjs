/**
 * MedWork Frontend UX Audit — browser exploration harness
 * Outputs: screenshots + JSON observation report
 * Run: node scripts/ux-audit-explore.mjs
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'http://127.0.0.1:5173'
const OUT = 'c:/github/medwork-manager/screenshots/ux-audit'
const REPORT = `${OUT}/observations.json`

fs.mkdirSync(OUT, { recursive: true })
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  console: { errors: [], warnings: [] },
  login: {},
  areas: [],
  mobile: {},
  clickAudit: {},
  ctrlK: {},
  topbar: {},
}

async function login(page, user, pass) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('input[type="password"]', { timeout: 30000 })
  await page.getByLabel('Username').fill(user)
  await page.getByLabel('Password').fill(pass)
  await page.locator('button[type="submit"]').click()
  await page.waitForSelector('.legacy-sidebar', { timeout: 30000 })
  await page.waitForTimeout(1800)
}

async function logout(page) {
  const btn = page.locator('.legacy-toolbar-link')
  if (await btn.count()) {
    await btn.first().click()
    await page.waitForTimeout(1000)
  }
}

const snap = (page, name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

page.on('console', (msg) => {
  if (msg.type() === 'error') report.console.errors.push(msg.text().slice(0, 300))
  if (msg.type() === 'warning') report.console.warnings.push(msg.text().slice(0, 200))
})
page.on('pageerror', (err) => report.console.errors.push(`PAGEERROR: ${String(err).slice(0, 300)}`))

// ---------------------------------------------------------------- LOGIN SCREEN
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('input[type="password"]', { timeout: 30000 })
await page.waitForTimeout(1200)
await snap(page, '00-login')
report.login.screen = {
  headings: await page.locator('h1, h2, h3, h5, h6').allInnerTexts(),
  labels: await page.locator('label').allInnerTexts(),
  buttons: await page.locator('button:visible').allInnerTexts(),
  links: await page.locator('a:visible').allInnerTexts(),
  helpText: await page.locator('.legacy-login-card').innerText(),
}

// -------------------------------------------------- ADMIN: FULL AREA EXPLORATION
await login(page, 'admin', 'Admin123!')
await snap(page, '01-admin-landing')
report.login.adminLanding = {
  sidebar: await page.locator('.legacy-sidebar .legacy-side-item').allInnerTexts(),
  breadcrumb: await page.locator('.legacy-context-line').first().innerText(),
}

const areaLabels = await page.locator('.legacy-sidebar .legacy-side-item').allInnerTexts()

for (let a = 0; a < areaLabels.length; a++) {
  const areaName = areaLabels[a].trim()
  const areaRecord = { area: areaName, modules: [] }

  await page.locator('.legacy-sidebar .legacy-side-item').nth(a).click()
  await page.waitForTimeout(1500)
  areaRecord.landing = await page.locator('.legacy-context-line').first().innerText()
  await snap(page, `10-area-${slug(areaName)}-landing`)

  const chips = await page.locator('.legacy-module-chip').allInnerTexts()
  areaRecord.chips = chips

  for (let c = 0; c < chips.length; c++) {
    const chipName = chips[c].trim()
    await page.locator('.legacy-module-chip').nth(c).click()
    await page.waitForTimeout(1600)

    const unavailable = await page.locator('text=Modulo non disponibile per il ruolo corrente.').count()
    const buttons = (await page.locator('button:visible').allInnerTexts()).filter((b) => b.trim())

    areaRecord.modules.push({
      chip: chipName,
      breadcrumb: await page.locator('.legacy-context-line').first().innerText(),
      unavailableRoute: unavailable > 0,
      headings: (await page.locator('h1,h2,h3,h4,h5,h6').allInnerTexts()).slice(0, 6),
      visibleButtons: buttons.slice(0, 22),
      buttonCount: buttons.length,
      tableRows: await page.locator('tbody tr').count(),
      inputs: await page.locator('input:visible').count(),
      hScroll: await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    })
    await snap(page, `20-${slug(areaName)}-${slug(chipName)}`)
  }
  report.areas.push(areaRecord)
}

// ------------------------------------------------------------- CTRL+K / SEARCH
await page.keyboard.press('Control+KeyK')
await page.waitForTimeout(1000)
report.ctrlK = {
  dialogsOpen: await page.locator('.MuiDialog-root').count(),
  visibleText: (await page.locator('body').innerText()).slice(0, 300),
}
await snap(page, '30-ctrl-k-search')
await page.keyboard.press('Escape')
await page.waitForTimeout(500)

// ------------------------------------------------------------ TOPBAR INVENTORY
report.topbar = {
  items: (await page.locator('.legacy-topbar button, .legacy-topbar .MuiChip-root').allInnerTexts()).filter((t) => t.trim()),
  iconButtons: await page.locator('.legacy-topbar button.MuiIconButton-root').count(),
  companySelector: await page.locator('.legacy-topbar .MuiSelect-select').count(),
  titles: await page.locator('.legacy-topbar [title]').evaluateAll((els) => els.map((e) => e.getAttribute('title'))),
}

// ------------------------------------------- MOBILE (390px) RESPONSIVENESS
await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(1500)
await snap(page, '40-mobile-admin-landing')
report.mobile = {
  horizontalScroll: await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  ),
  scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
  clientWidth: await page.evaluate(() => document.documentElement.clientWidth),
  sidebarVisible: await page.locator('.legacy-sidebar').isVisible().catch(() => false),
  sidebarBox: await page.locator('.legacy-sidebar').boundingBox().catch(() => null),
  bodyText: (await page.locator('body').innerText()).slice(0, 400),
}
await page.setViewportSize({ width: 1440, height: 900 })
await page.waitForTimeout(600)

// --------------------------------------------------------- DOCTOR JOURNEY
await logout(page)
await page.waitForTimeout(1500)
await login(page, 'doctor', 'Doctor123!')
await snap(page, '50-doctor-landing')
report.login.doctorLanding = {
  sidebar: await page.locator('.legacy-sidebar .legacy-side-item').allInnerTexts(),
  breadcrumb: await page.locator('.legacy-context-line').first().innerText(),
  headings: await page.locator('h1,h2,h3,h4,h5,h6').allInnerTexts(),
  buttons: (await page.locator('button:visible').allInnerTexts()).filter((b) => b.trim()),
  bodyText: (await page.locator('.legacy-content-wrapper').innerText()).slice(0, 2000),
}

// CLICK AUDIT: landing -> "new visit" form
let clicks = 0
await page.locator('.legacy-sidebar .legacy-side-item').first().click()
clicks += 1
await page.waitForTimeout(1500)
const newVisitChip = page.locator('.legacy-module-chip:has-text("Nuova Visita")')
if (await newVisitChip.count()) {
  clicks += 1
  await newVisitChip.first().click()
  await page.waitForTimeout(2200)
  await snap(page, '51-doctor-new-visit-stepper')
  report.clickAudit.stepper = {
    headings: (await page.locator('h1,h2,h3,h4,h5,h6').allInnerTexts()).slice(0, 8),
    steps: await page.locator('.MuiStepLabel-label').allInnerTexts(),
    buttonCount: (await page.locator('button:visible').allInnerTexts()).filter((b) => b.trim()).length,
    buttons: (await page.locator('button:visible').allInnerTexts()).filter((b) => b.trim()).slice(0, 30),
    inputs: await page.locator('input:visible').count(),
    selects: await page.locator('.MuiSelect-select:visible').count(),
    bodySample: (await page.locator('.legacy-content-wrapper').innerText()).slice(0, 1500),
  }
}
report.clickAudit.clicksLandingToNewVisitForm = clicks

await browser.close()
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2))
console.log('=== AUDIT COMPLETE ===')
console.log('areas:', report.areas.map((a) => `${a.area}[${a.chips.length}]`).join(' | '))
console.log('console errors:', report.console.errors.length, report.console.errors.slice(0, 5))
console.log(
  'unavailable routes:',
  report.areas.flatMap((a) => a.modules.filter((m) => m.unavailableRoute).map((m) => `"${a.area} > ${m.chip}"`)).join(', ') || 'none',
)
console.log('clicks landing->new visit:', report.clickAudit.clicksLandingToNewVisitForm)
console.log('report:', REPORT)
