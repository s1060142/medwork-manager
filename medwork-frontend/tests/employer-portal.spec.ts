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

test.describe('Employer / RSPP Portal - Feature 3 Verification', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Navigate to Employer/RSPP Portal and verify compliance dashboard, worker registry and actions', async ({ page }) => {
    // 1. Go to Gestione aziende -> Portale RSPP/DdL
    await page.locator('text=Gestione aziende').first().click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Portale RSPP/DdL")').first().click()
    await page.waitForTimeout(800)

    // 2. Verify Header and Compliance Cards
    await expect(page.locator('text=Portale Datore di Lavoro & RSPP (D.Lgs. 81/08)')).toBeVisible()
    await expect(page.getByText('ORGANICO SORVEGLIANZA', { exact: true })).toBeVisible()
    await expect(page.getByText('COMPLIANCE SORVEGLIANZA', { exact: true })).toBeVisible()
    await expect(page.getByText('IN SCADENZA (60 GG)', { exact: true })).toBeVisible()

    // 3. Verify ZIP Bulk Download button
    const zipBtn = page.locator('button:has-text("Scarica Tutti i Giudizi (ZIP)")')
    await expect(zipBtn).toBeVisible()

    // 4. Verify "Segnala Lavoratore" action dialog
    const reportBtn = page.locator('button:has-text("Segnala Lavoratore")')
    await expect(reportBtn).toBeVisible()
    await reportBtn.click()
    await page.waitForTimeout(400)

    await expect(page.locator('text=Segnalazione Lavoratore / Assunzione / Cambio Mansione')).toBeVisible()
    await page.locator('button:has-text("Annulla")').click()
    await page.waitForTimeout(300)

    // 5. Verify Table and GDPR safety text
    await expect(page.locator('text=Garanzia di conformità GDPR: visualizzazione limitata alle sole conclusioni legali')).toBeVisible()
    await page.screenshot({ path: 'tests/test-results/evidence/employer-portal.png', fullPage: true })
  })
})
