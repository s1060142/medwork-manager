import { test } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

test('Debug: capture all API responses after save', async ({ page }) => {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
  await page.waitForSelector('table tbody tr', { timeout: 10000 })

  const responses: any[] = []
  page.on('response', async (res) => {
    if (res.url().includes('localhost:5279')) {
      try {
        const body = await res.text()
        responses.push({
          method: res.request().method(),
          url: res.url(),
          status: res.status(),
          body: body.substring(0, 500)
        })
      } catch {}
    }
  })

  const firstRow = page.locator('table tbody tr').first()
  await firstRow.locator('button:has-text("Modifica")').first().click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })

  const newName = 'RESP_TEST_' + Date.now()
  await page.getByLabel(/nome azienda/i).first().fill(newName)
  await page.locator('[role="dialog"] button:has-text("Salva")').click()

  await page.waitForTimeout(5000)

  const putPosts = responses.filter(r => r.method === 'PUT' || r.method === 'POST')
  console.log('PUT/POST responses:', JSON.stringify(putPosts, null, 2))

  const alerts = await page.locator('[role="dialog"] .MuiAlert-root').allTextContents()
  console.log('Alerts in dialog:', alerts)
})
