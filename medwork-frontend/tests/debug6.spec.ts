import { test, expect } from '@playwright/test'
const BASE = 'http://127.0.0.1:5173'
async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

async function createVisit(page) {
  await page.click('button:has-text("Sorveglianza")')
  await page.waitForTimeout(2000)
  await page.getByLabel('Lavoratore *').click()
  await page.waitForTimeout(800)
  const opts = page.getByRole('option')
  if ((await opts.count()) > 0) await opts.first().click()
  await page.waitForTimeout(800)
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
  await page.getByLabel('Prossima scadenza *').fill('31/12/2030')
  await page.waitForTimeout(1000)
  await page.locator('button:has-text("Salva Visita")').first().click()
  await page.waitForTimeout(5000)
}

test('dbg medical visits edit self-update', async ({ page }) => {
  test.setTimeout(150000)
  const putStatus = []
  page.on('response', (res) => {
    if (res.request().method() === 'PUT' && res.url().includes('/api/doctor-data/medical-visits/')) {
      putStatus.push(res.status())
    }
  })
  await loginAsAdmin(page)
  await createVisit(page)
  console.log('tables:', await page.locator('table').count())
  const table = page.locator('table').last()
  await table.locator('tbody tr').first().waitFor({ timeout: 10000 })
  const firstRow = table.locator('tbody tr').first()
  console.log('MV row before:', (await firstRow.textContent()).slice(0, 120))
  const modBtn = firstRow.locator('button:has-text("Modifica")')
  console.log('modifica in first row:', await modBtn.count())
  if ((await modBtn.count()) === 0) { console.log('no Modifica, skipping'); return }
  await modBtn.first().click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  const newOutcome = 'MvEdit' + Date.now()
  await page.getByLabel('Esito').first().fill(newOutcome)
  await page.locator('[role="dialog"] button:has-text("Salva")').first().click()
  await page.waitForTimeout(4000)
  console.log('PUT status:', JSON.stringify(putStatus))
  const updated = table.locator('tbody tr').filter({ hasText: newOutcome }).first()
  console.log('grid row has new outcome:', await updated.count())
})
