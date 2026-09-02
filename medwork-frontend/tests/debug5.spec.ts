import { test, expect } from '@playwright/test'
const BASE = 'http://127.0.0.1:5173'
async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('dbg medical visits stepper', async ({ page }) => {
  test.setTimeout(150000)
  const postReqs = []
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().includes('/api/doctor-data/medical-visits')) postReqs.push(req.url())
  })
  page.on('response', (res) => {
    if (res.request().method() === 'POST' && res.url().includes('/api/doctor-data/medical-visits')) {
      console.log('MV POST status:', res.status())
    }
    if (res.status() >= 400) console.log('ERROR RESP:', res.status(), res.url())
  })
  await loginAsAdmin(page)
  await page.click('button:has-text("Sorveglianza")')
  await page.waitForTimeout(2000)
  await page.getByLabel('Lavoratore *').click()
  await page.waitForTimeout(800)
  const opts = page.getByRole('option')
  if ((await opts.count()) > 0) await opts.first().click()
  await page.waitForTimeout(1000)
  const docSelect = page.getByLabel('Medico *')
  if (await docSelect.count() > 0) {
    await docSelect.click()
    await page.waitForTimeout(600)
    const dopts = page.getByRole('option')
    if ((await dopts.count()) > 0) await dopts.first().click()
    await page.waitForTimeout(500)
  }
  await page.locator('button:has-text("Avanti")').first().click()
  await page.waitForTimeout(1500)
  await page.getByLabel('Organi bersaglio *').fill('Polmoni')
  await page.locator('button:has-text("Avanti")').first().click()
  await page.waitForTimeout(1500)
  await page.getByLabel(/giudizio di idone/i).fill('Idoneo con prescrizioni')
  const dl = page.getByLabel('Prossima scadenza *')
  console.log('deadline count:', await dl.count())
  try { await dl.fill('31/12/2030'); console.log('deadline filled') } catch (e) { console.log('deadline fail:', e.message.slice(0,80)) }
  await page.waitForTimeout(1000)
  await page.locator('button:has-text("Salva Visita")').first().click()
  await page.waitForTimeout(5000)
  console.log('POST count:', postReqs.length)
  console.log('tables now:', await page.locator('table').count())
  console.log('Modifica buttons:', await page.locator('button:has-text("Modifica")').count())
  // if grid landed, try one edit to confirm self-update
  const modBtn = page.locator('button:has-text("Modifica")]')
  // fix selector below
})
