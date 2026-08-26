import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message))

await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' })
const need = await page.locator('text=Accesso piattaforma').count()
if (need) {
  await page.getByLabel('Username').fill('admin')
  await page.getByLabel('Password').fill('Admin123!')
  await page.getByRole('button', { name: 'Accedi' }).click()
  await page.waitForTimeout(1000)
}

// Vai su Anagrafica
await page.getByRole('button', { name: 'Anagrafica', exact: true }).first().click()
await page.waitForTimeout(800)

console.log('--- BEFORE CLICK ---')
const beforeDialogs = await page.locator('[role=dialog]').count()
console.log('dialogs visible:', beforeDialogs)
const beforeErr = errs.length
console.log('errors so far:', errs)

// clicca Nuova azienda
const newBtn = page.getByRole('button', { name: /^Nuova azienda$/ }).first()
console.log('Nuova azienda count:', await newBtn.count())
await newBtn.click()
await page.waitForTimeout(1500)

console.log('--- AFTER CLICK ---')
const afterDialogs = await page.locator('[role=dialog]').count()
console.log('dialogs visible:', afterDialogs)
console.log('new errors:', errs.slice(beforeErr))
console.log('all errors:', errs)

// screenshot
await page.screenshot({ path: 'dogfood-output/manual-NuovaAzienda.png', fullPage: true })

// prova anche Modifica su una riga
console.log('\n--- TRY MODIFICA ---')
const modBtn = page.getByRole('button', { name: /^Modifica$/ }).first()
console.log('Modifica count:', await modBtn.count())
if (await modBtn.count()) {
  await modBtn.click()
  await page.waitForTimeout(1500)
  console.log('dialogs after Modifica:', await page.locator('[role=dialog]').count())
  await page.screenshot({ path: 'dogfood-output/manual-Modifica.png', fullPage: true })
}

await browser.close()
