import { test, expect } from '@playwright/test'
const BASE = 'http://127.0.0.1:5173'
async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('dbg employees edit flow', async ({ page }) => {
  const putUrls = []
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().includes('/api/admin-data/employees/')) {
      putUrls.push({ url: req.url(), body: req.postData() })
    }
  })
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForTimeout(3000)
  await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

  const empTable = page.locator('table').nth(1)
  await empTable.locator('tbody tr').first().waitFor({ timeout: 10000 })

  const firstRow = empTable.locator('tbody tr').first()
  const beforeText = await firstRow.textContent()
  const nomeMatch = beforeText.match(/(\S+)\s+(\S+)/)
  console.log('FIRST ROW TEXT:', (beforeText || '').slice(0, 120))

  // Open profile via Lista icon button
  const listaBtn = firstRow.locator('button[aria-label="Lista"]')
  if (await listaBtn.count() === 0) {
    const alt = firstRow.locator('button[title*="cartella"]')
    console.log('Lista button count:', await listaBtn.count(), 'alt:', await alt.count())
  } else {
    await listaBtn.first().click()
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
    console.log('dialog open:', await page.locator('[role="dialog"]').count())
    const labels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role="dialog"] label')).map(l => (l.textContent||'').trim())
    })
    console.log('DIALOG FIELD LABELS:', labels)

    const newName = 'DbgNome' + Date.now()
    // firstName field has label "Nome*"
    const nomeField = page.locator('[role="dialog"] label')
      .filter({ hasText: /^Nome\*$/ })
      .locator('xpath=..')
    // MUI label is sibling; use getByLabel approach instead
    const nomeInput = page.getByLabel(/^Nome\*/i).first()
    console.log('nomeInput count:', await nomeInput.count())
    if (await nomeInput.count() > 0) {
      await nomeInput.fill(newName)
    }
    await page.locator('[role="dialog"] button:has-text("Salva")').click()
    await page.waitForTimeout(3000)
    console.log('PUT urls after save:', JSON.stringify(putUrls, null, 2))
    const headerName = await page.locator('[role="dialog"] h6').first().textContent().catch(() => '')
    console.log('dialog header after save:', headerName)
    // grid still has dialog open; check grid row text
    const gridUpdated = await firstRow.evaluate((el) => el.textContent).then(t => (t||'').includes(newName))
    console.log('grid row includes newName (no reload):', gridUpdated)

    // close dialog via Chiudi
    await page.locator('[role="dialog"] button:has-text("Chiudi")]').click().catch(()=>{})
    await page.waitForTimeout(1500)
  }
})
