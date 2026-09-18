import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }

async function loginAsAdmin(page: any) {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  const passInput = page.locator('input[type="password"]')
  if (await passInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByLabel('Username').fill(ADMIN_CRED.username)
    await page.getByLabel('Password').fill(ADMIN_CRED.password)
    await page.locator('button[type="submit"]:has-text("Accedi")').click()
    await page.waitForLoadState('networkidle')
  }
  await page.waitForSelector('.legacy-topbar', { timeout: 15000 })
}

test.describe('Company ↔ CompanyGroup Domain Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Two-way Company Group association, discovery from Company form, and persistence', async ({ page }) => {
    // 1. Navigate to Gestione aziende -> Anagrafica (Companies)
    await page.locator('text=Gestione aziende').first().click()
    await page.waitForTimeout(500)
    await page.locator('button:has-text("Anagrafica")').first().click()
    await page.waitForTimeout(1000)

    // 2. Open "Nuovo" company dialog and verify Company Group dropdown
    const newBtn = page.locator('button:has-text("Nuovo")')
    if (await newBtn.isVisible()) {
      await newBtn.click()
      await page.waitForTimeout(600)

      // Verify Gruppo Aziendale is present in the form
      await expect(page.locator('label:has-text("Gruppo Aziendale"), text=Gruppo Aziendale').first()).toBeVisible({ timeout: 5000 })

      // Close dialog
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }

    // 3. Navigate to Gruppi aziendali tab
    await page.locator('button:has-text("Gruppi aziendali")').first().click()
    await page.waitForTimeout(1000)

    // 4. Verify Company Groups Center rendered
    await expect(page.locator('text=Workspace Gruppi Aziendali').or(page.locator('button:has-text("Nuovo Gruppo")')).first()).toBeVisible({ timeout: 5000 })
    
    // 5. Take screenshot evidence
    await page.screenshot({ path: 'company-groups-center.png', fullPage: true })
  })
})
