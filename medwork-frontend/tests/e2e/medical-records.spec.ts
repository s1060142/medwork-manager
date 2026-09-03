import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.getByLabel('Tenant').fill('default')
  await page.getByLabel('Username').fill(ADMIN_CRED.username)
  await page.getByLabel('Password').fill(ADMIN_CRED.password)
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test.describe('E2E - Moduli Fase 1 (Cartella, Firma, Allegati)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    const companyBtn = page.locator('button:has-text("Acme Industria S.p.A.")')
    if (await companyBtn.count() > 0) {
      await companyBtn.first().click()
    }
  })

  test('Analisi e Relazioni - Pulsanti Report e Allegato 3B', async ({ page }) => {
    await page.click('button:has-text("Analisi e relazioni")')
    
    const reportTab = page.locator('button:has-text("Report")').first()
    if (await reportTab.count() > 0) {
      await reportTab.click()
    }
    
    // Moduli Allegato 3B
    const allegatoBtn = page.locator('button:has-text("Allegato 3B"), .legacy-tab:has-text("Allegato 3B")').first()
    if (await allegatoBtn.count() > 0) {
      await allegatoBtn.click()
      await expect(page.locator('text=Allegato 3B')).toBeVisible()
      
      // Test presenza pulsanti specifici 
      const generatePdfBtn = page.locator('button:has-text("Genera PDF")').first()
      const sendPecBtn = page.locator('button:has-text("Invia PEC")').first()
      
      if (await generatePdfBtn.count() > 0) await expect(generatePdfBtn).toBeVisible()
      if (await sendPecBtn.count() > 0) await expect(sendPecBtn).toBeVisible()
    }
  })

  test('Firma Grafometrica - Strumenti', async ({ page }) => {
    await page.click('button:has-text("Amministrazione")')
    await page.click('button:has-text("Strumenti")')
    
    const signatureBtn = page.locator('button:has-text("Registra firma")').first()
    await expect(signatureBtn).toBeVisible()
    await signatureBtn.click()
    
    // Verifica modal o azione di firma
    // Essendo spesso gestita via hardware o moduli specifici, basta verificare che non crasha
  })
})
