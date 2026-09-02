import { test, type Page } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const TEST_NAME = 'GRID_TEST_' + Date.now()

async function loginAsAdmin(page: Page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Debug grid update after save', async ({ page }) => {
  const consoleLogs: string[] = []
  const consoleErrors: string[] = []
  const allRequests: Array<{ method: string; url: string; postData?: string }> = []
  const putRequests: Array<{ method: string; url: string; postData?: string; responseStatus?: number; responseBody?: string }> = []
  const getCompanyRequests: Array<{ method: string; url: string; timestamp: number }> = []
  const startTime = Date.now()

  page.on('console', (msg) => {
    const text = msg.text()
    consoleLogs.push(text)
    if (msg.type() === 'error') consoleErrors.push(text)
  })

  page.on('request', async (req) => {
    try {
      const info: { method: string; url: string; postData?: string } = { method: req.method(), url: req.url() }
      if (req.method() === 'PUT' || req.method() === 'POST') {
        try { info.postData = (await req.postData()) || undefined } catch { info.postData = '<unreadable>' }
      }
      allRequests.push(info)
      if (req.method() === 'PUT') putRequests.push(info)
      if (req.method() === 'GET' && req.url().toLowerCase().includes('compani')) {
        getCompanyRequests.push({ method: req.method(), url: req.url(), timestamp: Date.now() - startTime })
      }
    } catch {}
  })

  page.on('response', async (res) => {
    try {
      const req = res.request()
      if (req.method() === 'PUT') {
        const entry = putRequests.find((p) => p.url === req.url() && p.responseStatus === undefined)
        if (entry) {
          entry.responseStatus = res.status()
          try { entry.responseBody = await res.text() } catch { entry.responseBody = '<unreadable>' }
        }
      }
    } catch {}
  })

  console.log('\n[STEP 1] Logging in as admin...')
  await loginAsAdmin(page)
  console.log('[STEP 1] Logged in')

  console.log('\n[STEP 2] Navigating to Gestione aziende -> Anagrafica...')
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 10000 })

  console.log('\n[STEP 3] Waiting for table to load...')
  await page.waitForSelector('table tbody tr', { timeout: 15000 })
  const initialRowCount = await page.locator('table tbody tr').count()
  console.log('[STEP 3] Table loaded with ' + initialRowCount + ' rows')

  console.log('\n[STEP 4] Capturing first row text...')
  const firstRow = page.locator('table tbody tr').first()
  const beforeText = (await firstRow.textContent())?.trim() || ''
  console.log('[STEP 4] First row BEFORE edit: "' + beforeText + '"')

  console.log('\n[STEP 5] Clicking Modifica on first row...')
  const modificaBtn = firstRow.locator('button:has-text("Modifica")').first()
  if ((await modificaBtn.count()) === 0) console.log('[STEP 5] ERROR: No Modifica button found')
  else await modificaBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  console.log('[STEP 5] Dialog opened')

  console.log('\n[STEP 6] Filling Nome Azienda with "' + TEST_NAME + '"...')
  const nameInput = page.getByLabel(/nome azienda/i).first()
  if ((await nameInput.count()) === 0) console.log('[STEP 6] ERROR: Nome Azienda input not found')
  else { await nameInput.fill(TEST_NAME); console.log('[STEP 6] Filled Nome Azienda') }

  const getCountBeforeSave = getCompanyRequests.length
  console.log('[STEP 6] GET /companies count BEFORE save: ' + getCountBeforeSave)
  const putCountBeforeSave = putRequests.length
  console.log('[STEP 6] PUT count BEFORE save: ' + putCountBeforeSave)

  console.log('\n[STEP 7] PUT requests so far: ' + putRequests.length)

  console.log('\n[STEP 9] Clicking Salva...')
  const salvaBtn = page.locator('[role="dialog"] button:has-text("Salva")')
  if ((await salvaBtn.count()) === 0) console.log('[STEP 9] ERROR: Salva button not found')
  else { await salvaBtn.click(); console.log('[STEP 9] Clicked Salva') }

  console.log('\n[STEP 10] Waiting 3 seconds...')
  await page.waitForTimeout(3000)

  console.log('\n[STEP 11] Capturing first row text AFTER save...')
  const firstRowAfter = page.locator('table tbody tr').first()
  const afterText = (await firstRowAfter.textContent())?.trim() || ''
  console.log('[STEP 11] First row AFTER edit: "' + afterText + '"')

  console.log('\n[STEP 12] Searching for "' + TEST_NAME + '" in page...')
  const pageContent = await page.content()
  const occurrences = pageContent.split(TEST_NAME).length - 1
  console.log('[STEP 12] Occurrences in page HTML: ' + occurrences)
  const tableContent = await page.locator('table').first().textContent()
  const inTable = (tableContent || '').includes(TEST_NAME)
  console.log('[STEP 12] Present in table: ' + inTable)
  const matchingRows = await page.locator('table tbody tr', { hasText: TEST_NAME }).count()
  console.log('[STEP 12] Rows containing it: ' + matchingRows)

  console.log('\n========================================')
  console.log('==========  FINAL RESULTS  ==========')
  console.log('========================================\n')
  console.log('[RESULT] Test name used: ' + TEST_NAME)
  console.log('[RESULT] Initial row count: ' + initialRowCount)
  console.log('[RESULT] BEFORE first row: "' + beforeText + '"')
  console.log('[RESULT] AFTER  first row: "' + afterText + '"')
  console.log('[RESULT] Row changed after save: ' + (beforeText !== afterText))
  console.log('[RESULT] "' + TEST_NAME + '" found in page: ' + (occurrences > 0))
  console.log('[RESULT] "' + TEST_NAME + '" found in table: ' + inTable)
  console.log('[RESULT] Rows with "' + TEST_NAME + '": ' + matchingRows)

  console.log('\n--- ALL PUT REQUESTS (count: ' + putRequests.length + ') ---')
  for (let i = 0; i < putRequests.length; i++) {
    const p = putRequests[i]
    console.log('PUT[' + i + '] ' + p.method + ' ' + p.url)
    console.log('  body: ' + p.postData)
    console.log('  responseStatus: ' + p.responseStatus)
    console.log('  responseBody: ' + p.responseBody)
  }

  console.log('\n--- ALL GET /companies REQUESTS (count: ' + getCompanyRequests.length + ') ---')
  for (let i = 0; i < getCompanyRequests.length; i++) {
    const g = getCompanyRequests[i]
    console.log('GET[' + i + '] @+' + g.timestamp + 'ms ' + g.method + ' ' + g.url)
  }
  const getsAfterSave = getCompanyRequests.length - getCountBeforeSave
  console.log('[RESULT] GET /companies requests AFTER save: ' + getsAfterSave)

  console.log('\n--- ALL REQUESTS BY URL (summary) ---')
  const uniqueUrls = [...new Set(allRequests.map((r) => r.method + ' ' + r.url))]
  for (const u of uniqueUrls) {
    const n = allRequests.filter((r) => (r.method + ' ' + r.url) === u).length
    console.log('  ' + n + 'x ' + u)
  }

  console.log('\n--- CONSOLE ERRORS (' + consoleErrors.length + ') ---')
  for (let i = 0; i < consoleErrors.length; i++) console.log('error[' + i + ']: ' + consoleErrors[i])

  console.log('\n--- LAST 30 CONSOLE LOGS ---')
  const start = Math.max(0, consoleLogs.length - 30)
  for (let i = start; i < consoleLogs.length; i++) console.log('log[' + i + ']: ' + consoleLogs[i])
})
