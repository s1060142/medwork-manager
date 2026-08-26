import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message))
const responses500 = []
page.on('response', r => { if (r.status() >= 500) responses500.push(`${r.status()} ${r.url()}`) })

await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' })
if (await page.locator('text=Accesso piattaforma').count()) {
  await page.getByLabel('Username').fill('admin')
  await page.getByLabel('Password').fill('Admin123!')
  await page.getByRole('button', { name: 'Accedi' }).click()
  await page.waitForTimeout(1000)
}

await page.getByRole('button', { name: 'Scadenzario', exact: true }).first().click()
await page.waitForTimeout(600)
await page.getByRole('button', { name: 'Agenda', exact: true }).first().click()
await page.waitForTimeout(800)

console.log('--- PRIMA: cerco bottone Convoca ---')
const convoca = page.getByRole('button', { name: /Convoca/i }).first()
const c = await convoca.count()
console.log('Count Convoca:', c)
if (c > 0) {
  const before = responses500.length
  await convoca.click()
  await page.waitForTimeout(2500)
  console.log('500 dopo click:', responses500.slice(before))
  console.log('dialog aperti:', await page.locator('[role=dialog]').count())
  // prova anche se appare un messaggio
  const ok = await page.locator('text=/convocazione|registrata|inviata/i').count()
  console.log('messaggi OK rilevati:', ok)
  await page.screenshot({ path: 'dogfood-output/fix-convoca.png', fullPage: false })
  console.log('errori console:', errs.length, errs.slice(-3))
}
await browser.close()
console.log('\nTUTTI I 500 visti nel run:', responses500.length)
responses500.forEach(r => console.log('  ', r))
