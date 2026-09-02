import { test, expect, type Page } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page: Page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Debug: Companies grid edit flow', async ({ page }) => {
  const consoleLogs: string[] = []
  const consoleErrors: string[] = []
  const allRequests: any[] = []
  const putRequests: any[] = []

  page.on('console', (msg) => {
    const text = msg.text()
    consoleLogs.push(text)
    if (msg.type() === 'error') {
      consoleErrors.push(text)
    }
  })

  page.on('request', async (req) => {
    try {
      const info = {
        method: req.method(),
        url: req.url(),
        postData: undefined as string | undefined,
      }
      if (req.method() === 'PUT' || req.method() === 'POST') {
        try {
          info.postData = await req.postData()
        } catch {
          info.postData = '<unreadable>'
        }
      }
      allRequests.push(info)
      if (req.method() === 'PUT') {
        putRequests.push({
          url: req.url(),
          postData: info.postData,
        })
      }
    } catch {
      // ignore request inspection errors
    }
  })

  await loginAsAdmin(page)

  // Navigate to Gestione aziende -> Anagrafica
  console.log('[DEBUG] Clicking Gestione aziende...')
  await page.click('button:has-text("Gestione aziende")')
  console.log('[DEBUG] Clicking Anagrafica...')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
  console.log('[DEBUG] Anagrafica page loaded')

  // Wait for table to load
  console.log('[DEBUG] Waiting for table rows...')
  await page.waitForSelector('table tbody tr', { timeout: 15000 })
  const rowCount = await page.locator('table tbody tr').count()
  console.log(`[DEBUG] Table rows found: ${rowCount}`)

  // List all buttons in the first row
  const firstRow = page.locator('table tbody tr').first()
  const rowButtons = await firstRow.locator('button').all()
  const buttonTexts: string[] = []
  for (const btn of rowButtons) {
    const txt = await btn.textContent()
    buttonTexts.push(txt?.trim() || '')
  }
  console.log(`[DEBUG] Buttons in first row: ${JSON.stringify(buttonTexts)}`)

  // Click the first "Modifica" button
  console.log('[DEBUG] Clicking Modifica...')
  const modificaBtn = firstRow.locator('button:has-text("Modifica")').first()
  if (await modificaBtn.count() === 0) {
    console.log('[DEBUG] No Modifica button found')
  } else {
    await modificaBtn.click()
  }

  // Wait for dialog
  console.log('[DEBUG] Waiting for dialog...')
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  console.log('[DEBUG] Dialog opened')

  // List all text inputs in the dialog
  const dialog = page.locator('[role="dialog"]').first()
  const textInputs = await dialog.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]').all()
  const inputInfo: Array<{ placeholder?: string; ariaLabel?: string; name?: string; value?: string }> = []
  for (const input of textInputs) {
    const placeholder = await input.getAttribute('placeholder')
    const ariaLabel = await input.getAttribute('aria-label')
    const name = await input.getAttribute('name')
    const value = await input.inputValue()
    inputInfo.push({ placeholder, ariaLabel, name, value })
  }
  console.log(`[DEBUG] Text inputs in dialog: ${JSON.stringify(inputInfo, null, 2)}`)

  // Try to fill the "Nome Azienda" field
  console.log('[DEBUG] Attempting to fill Nome Azienda...')
  const nameInput = dialog.locator('label:has-text("Nome Azienda") >> xpath=../input').first()
  if (await nameInput.count() > 0) {
    await nameInput.fill('Test Company Debug')
    console.log('[DEBUG] Filled via label xpath')
  } else {
    const nameByLabel = page.getByLabel(/nome azienda/i).first()
    if (await nameByLabel.count() > 0) {
      await nameByLabel.fill('Test Company Debug')
      console.log('[DEBUG] Filled via getByLabel')
    } else {
      console.log('[DEBUG] Nome Azienda input NOT found')
    }
  }

  // List all buttons in the dialog
  const dialogButtons = await dialog.locator('button').all()
  const dialogButtonTexts: string[] = []
  for (const btn of dialogButtons) {
    const txt = await btn.textContent()
    dialogButtonTexts.push(txt?.trim() || '')
  }
  console.log(`[DEBUG] Buttons in dialog: ${JSON.stringify(dialogButtonTexts)}`)

  // Click "Salva" button
  console.log('[DEBUG] Clicking Salva...')
  const salvaBtn = dialog.locator('button:has-text("Salva")')
  if (await salvaBtn.count() > 0) {
    await salvaBtn.click()
  } else {
    console.log('[DEBUG] Salva button NOT found')
  }

  // Wait a bit for async operations
  await page.waitForTimeout(3000)

  // Print captured data
  console.log('\n[DEBUG] ===== CAPTURED PUT REQUESTS =====')
  console.log(`[DEBUG] Total PUT requests: ${putRequests.length}`)
  for (const req of putRequests) {
    console.log(`[DEBUG] PUT URL: ${req.url}`)
    console.log(`[DEBUG] PUT body: ${req.postData}`)
  }

  console.log('\n[DEBUG] ===== ALL CONSOLE LOGS =====')
  consoleLogs.forEach((log, i) => console.log(`[DEBUG] console[${i}]: ${log}`))

  console.log('\n[DEBUG] ===== CONSOLE ERRORS =====')
  consoleErrors.forEach((err, i) => console.log(`[DEBUG] error[${i}]: ${err}`))

  console.log('\n[DEBUG] ===== SAMPLE OF ALL REQUESTS =====')
  const uniqueUrls = [...new Set(allRequests.map(r => r.url))]
  uniqueUrls.forEach(url => {
    const reqs = allRequests.filter(r => r.url === url)
    console.log(`[DEBUG] ${reqs.length}x ${reqs[0].method} ${url}`)
  })
})
