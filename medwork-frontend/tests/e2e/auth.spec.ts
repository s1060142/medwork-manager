import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }
const DOCTOR_CRED = { username: 'doctor', password: 'Doctor123!' }

test.describe('E2E - Autenticazione e Ruoli', () => {
  test('Login e logout Admin', async ({ page }) => {
    await page.goto(BASE)
    await page.fill('input[type="text"]', ADMIN_CRED.username)
    await page.fill('input[type="password"]', ADMIN_CRED.password)
    
    // Test bottone Accedi
    await page.click('button:has-text("Accedi")')
    
    // Verifica accesso
    await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
    await expect(page.locator('button:has-text("Gestione aziende")')).toBeVisible()
    await expect(page.locator('button:has-text("Amministrazione")')).toBeVisible() // Solo admin
    
    // Test bottone Logout
    await page.click('button:has-text("Logout")')
    await expect(page.locator('text=Gestionale Medicina del Lavoro')).toBeVisible()
  })

  test('Login Medico - restrizioni di visibilità', async ({ page }) => {
    await page.goto(BASE)
    await page.fill('input[type="text"]', DOCTOR_CRED.username)
    await page.fill('input[type="password"]', DOCTOR_CRED.password)
    
    await page.click('button:has-text("Accedi")')
    
    await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
    
    // Medico non dovrebbe vedere Amministrazione
    await expect(page.locator('button:has-text("Amministrazione")')).not.toBeVisible()
    
    await page.click('button:has-text("Logout")')
  })
})
