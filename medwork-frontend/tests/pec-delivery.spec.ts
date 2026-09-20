import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }

async function loginAsAdmin(page: any) {
  await page.goto(BASE)
  const isLoginVisible = await page.locator('input[type="password"]').isVisible({ timeout: 2000 }).catch(() => false)
  if (isLoginVisible) {
    await page.fill('input[type="text"]', ADMIN_CRED.username)
    await page.fill('input[type="password"]', ADMIN_CRED.password)
    await page.click('button:has-text("Accedi")')
  }
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test.describe('PEC Delivery Hub - Feature 2 Verification', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Configure PEC settings and test connection handshake', async ({ page }) => {
    // 1. Go to Amministrazione -> Impostazioni
    await page.locator('text=Amministrazione').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Impostazioni")').first().click()
    await page.waitForTimeout(600)

    // 2. Check PEC server configuration section
    await expect(page.getByText('Configurazione PEC & Delivery Hub Notifiche')).toBeVisible()
    await expect(page.getByLabel('Server SMTP / PEC Host')).toBeVisible()

    // Fill sender PEC if not already filled
    await page.getByLabel('Indirizzo PEC Mittente').fill('medico.competente@pec.it')
    await page.waitForTimeout(300)

    // 3. Test PEC Connection button
    const testPecBtn = page.locator('button:has-text("Test Connessione PEC")')
    await expect(testPecBtn).toBeVisible()
    await expect(testPecBtn).toBeEnabled()
    await testPecBtn.click()
    await page.waitForTimeout(1000)

    // 4. Verify handshake feedback
    await expect(page.getByText('Handshake e connessione SMTP/PEC completati con successo.')).toBeVisible()
    await page.screenshot({ path: 'tests/test-results/evidence/pec-settings-handshake.png', fullPage: true })
  })

  test('Verify PEC dispatch controls in Giudizio di Idoneità Center', async ({ page }) => {
    // 1. Go to Sorveglianza sanitaria -> Centro Giudizi
    await page.locator('text=Sorveglianza sanitaria').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Centro Giudizi")').first().click()
    await page.waitForTimeout(800)

    // 2. Verify PEC header button and table column
    await expect(page.locator('text=Centro Giudizi di Idoneità (Art. 41 D.Lgs. 81/08)')).toBeVisible()
    await expect(page.locator('button:has-text("Invia")').filter({ hasText: 'Giudizi via PEC' })).toBeVisible()
    await expect(page.locator('th:has-text("PEC")')).toBeVisible()
    await page.screenshot({ path: 'tests/test-results/evidence/pec-giudizi-center.png', fullPage: true })
  })
})
