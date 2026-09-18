import { test, expect } from '@playwright/test'
const BASE = 'http://127.0.0.1:5173'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }
const log = (...a) => console.log(...a)

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', ADMIN_CRED.username)
  await page.fill('input[type="password"]', ADMIN_CRED.password)
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}
async function openGroup(page, name) {
  await page.click('button:has-text("Gestione aziende")')
  await page.click('button:has-text("Gruppi aziendali")')
  await page.waitForTimeout(1000)
  await page.click('button:has-text("Nuovo Gruppo")')
  await page.waitForSelector('[role="dialog"]')
  await page.getByLabel('Denominazione Gruppo *').fill(name)
  await page.getByLabel('Ragione Sociale Capogruppo *').fill(name + ' SRL')
  await page.click('[role="dialog"] button:has-text("Salva Gruppo")')
  await expect(page.locator('text=Gruppo aziendale creato con successo!').first()).toBeVisible({ timeout: 10000 })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
}
async function selectCreatedGroup(page, name) {
  await page.click('button:has-text("Gruppi aziendali")')
  await page.waitForTimeout(500)
  await page.getByLabel('Gruppo Attivo').first().click()
  await page.waitForTimeout(500)
  await page.locator('[role="option"]').filter({ hasText: name }).first().click()
  await page.waitForTimeout(500)
}

test('repro doctor-persistence', { timeout: 150000 }, async ({ page }) => {
  const logs = []
  page.on('console', msg => logs.push(`[console:${msg.type()}] ${msg.text()}`))
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`))
  page.on('response', res => {
    if (/company-groups|master-data\/doctors/.test(res.url())) logs.push(`[resp ${res.status()}] ${res.request().method()} ${res.url().split('?')[0]}`)
  })
  page.on('requestfailed', req => logs.push(`[reqfail] ${req.method()} ${req.url()} ${req.failure()?.errorText}`))

  const groupName = 'REPRO-DOC-' + Date.now()
  await loginAsAdmin(page)
  await openGroup(page, groupName)
  await selectCreatedGroup(page, groupName)
  await page.click('button:has-text("Governance & Struttura")')
  await page.waitForTimeout(1500)

  await page.click('button:has-text("Associa Medico")')
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  await page.waitForTimeout(800)
  log('open dialog OK; combobox in dialog:', await page.locator('[role="dialog"] [role="combobox"]').count())

  await page.locator('[role="dialog"] [role="combobox"]').nth(0).click({ force: true })
  await page.waitForTimeout(600)
  log('after open doc cb - listbox:', await page.locator('[role="listbox"]').count(), 'option:', await page.locator('[role="listbox"] [role="option"]').count())
  const docOpts = await page.locator('[role="listbox"] [role="option"]').allTextContents()
  log('doc options text:', docOpts)
  try { await page.locator('[role="listbox"] [role="option"]').nth(1).click({ force: true }); log('clicked doc nth(1) OK') } catch (e) { log('ERR doc click:', e.message) }

  await page.locator('[role="dialog"] [role="combobox"]').nth(1).click({ force: true })
  await page.waitForTimeout(600)
  log('after open role cb - listbox:', await page.locator('[role="listbox"]').count(), 'option:', await page.locator('[role="listbox"] [role="option"]').count())
  try { await page.locator('[role="listbox"] [role="option"]').first().click({ force: true }); log('clicked role first OK') } catch (e) { log('ERR role click:', e.message) }
  await page.waitForTimeout(500)
  log('Associa btn whole-page count:', await page.locator('button:has-text("Associa")').count())
  log('Associa btn dialog count:', await page.locator('[role="dialog"] button:has-text("Associa")').count())
  log('Associa enabled?', await page.locator('[role="dialog"] button:has-text("Associa")').first().isEnabled())

  try {
    await page.click('button:has-text("Associa")')
    log('page.click(Associa) OK')
  } catch (e) { log('ERR page.click(Associa):', e.message) }
  await page.waitForTimeout(2500)
  log('toast Medico associato?', await page.locator('text=Medico associato al gruppo!').first().isVisible())

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await selectCreatedGroup(page, groupName)
  await page.click('button:has-text("Governance & Struttura")')
  await page.waitForTimeout(1500)
  log('Team Medico visible?', await page.locator('text=Team Medico del Gruppo').first().isVisible())
  const teamTable = page.locator('text=Team Medico del Gruppo').first().locator('..').locator('..').locator('table tbody tr')
  log('doctor rowCountBefore:', await teamTable.count())
  try {
    const html = await page.locator('text=Team Medico del Gruppo').first().locator('..').locator('..').locator('table').first().evaluate(el => el.innerHTML)
    log('=== team table innerHTML ===\n' + html)
  } catch (e) { log('ERR table dump:', e.message) }
  log('=== ALL LOGS ===')
  log(logs.join('\n'))
})
