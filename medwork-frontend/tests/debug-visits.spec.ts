import { test } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

test('Debug medical visits', async ({ page }) => {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  
  const sorvBtn = page.locator('button:has-text("Sorveglianza")')
  console.log('Sorveglianza count:', await sorvBtn.count())
  
  if (await sorvBtn.count() > 0) {
    await sorvBtn.first().click()
    await page.waitForTimeout(2000)
    
    const btns = await page.locator('button:visible').allTextContents()
    console.log('Visible buttons after Sorveglianza click:', btns.filter((b: string) => b.trim()).slice(0, 30))
    
    const submenuBtns = await page.locator('button:has-text("Scadenzario"), button:has-text("Visite"), button:has-text("Cartella")').allTextContents()
    console.log('Submenu items:', submenuBtns)
  }
  
  const scadBtn = page.locator('button:has-text("Scadenzario")')
  if (await scadBtn.count() > 0) {
    await scadBtn.first().click()
    await page.waitForTimeout(2000)
    
    const btns = await page.locator('button:visible').allTextContents()
    console.log('Visible buttons after Scadenzario click:', btns.filter((b: string) => b.trim()).slice(0, 30))
  }
})
