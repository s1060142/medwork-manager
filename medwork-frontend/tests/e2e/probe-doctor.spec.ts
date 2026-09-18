import { test, expect, chromium } from '@playwright/test'
const BASE = 'http://127.0.0.1:5173'
const API_URL = 'http://127.0.0.1:5279'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }

test('probe doctor-persistence', async ({ page }, testInfo) => {
  testInfo.timeout = 90000
  const logs = []
  page.on('console', msg => logs.push(`[console:${msg.type()}] ${msg.text()}`))
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`))
  page.on('response', res => {
    if (/api/.test(res.url())) logs.push(`[resp ${res.status()}] ${res.request().method()} ${res.url().split('?')[0]}`)
  })
  page.on('requestfailed', req => logs.push(`[reqfail] ${req.method()} ${req.url()} ${req.failure()?.errorText}`))

  const groupName = 'PROBE-DOC-' + Date.now()
  await page.goto(BASE)
  await page.fill('input[type="text"]', ADMIN_CRED.username)
  await page.fill('input[type="password"]', ADMIN_CRED.password)
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.click('button:has-text("Gestione aziende")')
  await page.click('button:has-text("Gruppi aziendali")')
  await page.waitForTimeout(1000)
  await page.click('button:has-text("Nuovo Gruppo")')
  await page.waitForSelector('[role="dialog"]')
  await page.getByLabel('Denominazione Gruppo *').fill(groupName)
  await page.getByLabel('Ragione Sociale Capogruppo *').fill(groupName + ' SRL')
  await page.click('[role="dialog"] button:has-text("Salva Gruppo")')
  await expect(page.locator('text=Gruppo aziendale creato con successo!').first()).toBeVisible({ timeout: 10000 })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await page.getByLabel('Gruppo Attivo').first().click()
  await page.waitForTimeout(500)
  await page.locator('[role="option"]').filter({ hasText: groupName }).first().click()
  await page.waitForTimeout(1000)
  await page.click('button:has-text("Governance & Struttura")')
  await page.waitForTimeout(1500)

  // Open Associa Medico dialog
  await page.click('button:has-text("Associa Medico")')
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  await page.waitForTimeout(1000)

  const html = await page.locator('[role="dialog"]').first().evaluate(el => el.innerHTML)
  await testInfo.attach('dialog-dom', { body: html })
  console.log('=== Dialog innerHTML ===\n' + html)

  console.log('combobox=' + await page.locator('[role="combobox"]').count())
  console.log('listbox=' + await page.locator('[role="listbox"]').count())
  console.log('option(role)=' + await page.locator('[role="option"]').count())
  console.log('select(native)=' + await page.locator('select').count())
  console.log('option(native)=' + await page.locator('select option').count())

  // Check master doctors via API
  const loginRes = await page.request.post(`${API_URL}/api/auth/login`, { data: { username: 'admin', password: 'Admin123!', tenantSlug: 'default' } })
  const token = (await loginRes.json()).accessToken
  const docsRes = await page.request.get(`${API_URL}/api/master-data/doctors`, { headers: { Authorization: `Bearer ${token}` } })
  console.log('=== master-data/doctors status=' + docsRes.status() + ' body=' + await docsRes.text())

  // Check group doctors payload
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.getByLabel('Gruppo Attivo').first().click()
  await page.waitForTimeout(500)
  await page.locator('[role="option"]').filter({ hasText: groupName }).first().click()
  await page.waitForTimeout(500)
  await page.click('button:has-text("Governance & Struttura")')
  await page.waitForTimeout(1500)
  const grpRes = await page.request.get(`${API_URL}/api/company-groups/` + (await page.locator('h5').filter({ hasText: groupName }).first().getAttribute('data-group-id') || ''), { headers: { Authorization: `Bearer ${token}` } })
  // simpler: list groups and find id
  const groupsRes = await page.request.get(`${API_URL}/api/company-groups`, { headers: { Authorization: `Bearer ${token}` } })
  const groups = await groupsRes.json()
  const myGroup = (groups.find(g => g.name === groupName) || {})
  console.log('=== myGroup id=' + myGroup.id)
  const grpDetail = await page.request.get(`${API_URL}/api/company-groups/${myGroup.id}`, { headers: { Authorization: `Bearer ${token}` } })
  console.log('=== group detail body=' + await grpDetail.text())

  console.log('=== ALL LOGS ===')
  console.log(logs.join('\n'))
})
