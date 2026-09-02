import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('debug tables', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForTimeout(3000)

  const info = await page.evaluate(() => {
    const tables = document.querySelectorAll('table')
    return Array.from(tables).map((t, i) => {
      const rect = t.getBoundingClientRect()
      const style = window.getComputedStyle(t)
      return {
        index: i,
        rows: t.querySelectorAll('tbody tr').length,
        visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
        display: style.display,
        visibility: style.visibility,
        offsetParentNull: t.offsetParent === null,
        textPreview: (t.querySelector('tbody')?.textContent || '').slice(0, 100).replace(/\s+/g, ' '),
      }
    })
  })
  console.log('TABLES:', JSON.stringify(info, null, 2))
})
