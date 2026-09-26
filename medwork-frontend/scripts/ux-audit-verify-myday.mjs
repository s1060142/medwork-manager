/** Verifies the restored "Il Mio Giorno" workspace (doctor landing + live action targets) */
import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:5173'
const OUT = 'c:/github/medwork-manager/screenshots/ux-audit'
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} :: ${name}${detail ? ` :: ${detail}` : ''}`)
}

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errors = []
page.on('response', (r) => {
  if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
})

async function login(user, pass) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('input[type="password"]', { timeout: 30000 })
  await page.getByLabel('Username').fill(user)
  await page.getByLabel('Password').fill(pass)
  await page.locator('button[type="submit"]').click()
  await page.waitForSelector('.legacy-sidebar', { timeout: 30000 })
  await page.waitForTimeout(2500)
}

// ---- DOCTOR: "Il Mio Giorno" must be the landing
await login('doctor', 'Doctor123!')
const breadcrumb = await page.locator('.legacy-context-line').first().innerText()
check('Doctor lands on "Il Mio Giorno"', breadcrumb.includes('Il Mio Giorno'), breadcrumb.replace(/\n/g, ' '))

const chips = await page.locator('.legacy-module-chip').allInnerTexts()
check('Chip strip contains "Il Mio Giorno"', chips.some((c) => c.includes('Il Mio Giorno')), chips.join(' | '))

const body = await page.locator('.legacy-content-wrapper').innerText()
for (const kpi of ['Il Mio Giorno', 'VISITE IN PROGRAMMA OGGI', 'GIUDIZI DA FIRMARE', 'COMPLIANCE D.LGS. 81/08', 'Agenda Pazienti']) {
  check(`My Day renders "${kpi}"`, body.includes(kpi))
}
check('My Day loads without error alert', !body.includes('Errore nel caricamento della dashboard'), body.slice(0, 200))
await page.screenshot({ path: `${OUT}/60-myday-restored-doctor.png` })

// ---- KPI drill-down must not dead-end
const drill = async (cardText, label) => {
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.legacy-sidebar', { timeout: 30000 })
  await page.waitForTimeout(2000)
  const card = page.locator(`.MuiCard-root:has-text("${cardText}")`).first()
  if (!(await card.count())) return check(`${label}: card present`, false)
  await card.click()
  await page.waitForTimeout(1500)
  const txt = await page.locator('.legacy-content-wrapper').innerText()
  check(`${label} → live route (no dead route)`, !txt.includes('Modulo non disponibile per il ruolo corrente.'), txt.split('\n').slice(0, 4).join(' / '))
}

await drill('GIUDIZI DA FIRMARE', 'KPI "Giudizi da firmare"')
await drill('SCADENZE VISITE (7 GG)', 'KPI "Scadenze visite"')
await drill('COMPLIANCE D.LGS. 81/08', 'KPI "Compliance"')

// quick shortcut
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.legacy-sidebar', { timeout: 30000 })
await page.waitForTimeout(2000)
const shortcut = page.locator('text=Smart Protocol Generator').first()
if (await shortcut.count()) {
  await shortcut.click()
  await page.waitForTimeout(1500)
  const txt = await page.locator('.legacy-content-wrapper').innerText()
  check('Shortcut "Smart Protocol Generator" → live route', !txt.includes('Modulo non disponibile'), txt.split('\n').slice(0, 3).join(' / '))
}
await page.screenshot({ path: `${OUT}/61-myday-shortcut.png` })

// ---- "+ Nuova Visita Medica" → stepper
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.legacy-sidebar', { timeout: 30000 })
await page.waitForTimeout(2000)
await page.locator('button:has-text("+ Nuova Visita Medica")').first().click()
await page.waitForTimeout(2000)
const stepper = await page.locator('.legacy-content-wrapper').innerText()
check('"+ Nuova Visita Medica" opens the stepper', stepper.includes('Nuova Visita Medica & Sorveglianza Sanitaria'))

// ---- ADMIN: chip available
await page.locator('.legacy-toolbar-link').first().click()
await page.waitForTimeout(1000)
await login('admin', 'Admin123!')
await page.locator('.legacy-side-item:has-text("Sorveglianza Sanitaria")').first().click()
await page.waitForTimeout(1200)
await page.locator('.legacy-module-chip:has-text("Il Mio Giorno")').first().click()
await page.waitForTimeout(2000)
const adminBody = await page.locator('.legacy-content-wrapper').innerText()
check('Admin can open "Il Mio Giorno"', adminBody.includes('GIUDIZI DA FIRMARE'))
await page.screenshot({ path: `${OUT}/62-myday-restored-admin.png` })

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\nRESULT: ${results.length - failed.length}/${results.length} checks passed`)
console.log('HTTP>=400:', errors.join(' ; ') || 'none')
console.log('FAILED:', failed.map((f) => f.name).join(' | ') || 'none')
