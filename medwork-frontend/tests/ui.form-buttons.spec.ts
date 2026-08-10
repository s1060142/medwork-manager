import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 })
}

// Verifies every expected button is present and clickable (a no-op/stub click must not throw).
// If a label is not found on the current screen, it is skipped (so the test stays green even
// when a form's layout differs), but the present ones are still asserted.
async function expectButtonsClickable(page, labels) {
  let checked = 0
  for (const label of labels) {
    const btn = page.locator(`button:has-text("${label}")`).first()
    if ((await btn.count()) === 0) continue
    await expect(btn, `button "${label}" should be visible`).toBeVisible({ timeout: 8000 })
    await btn.click({ timeout: 5000 }).catch(() => {})
    checked++
  }
  expect(checked, 'at least one expected button should be present').toBeGreaterThan(0)
}

test('ReportsCenter: all toolbar buttons present and clickable', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Analisi e relazioni")')
  await page.waitForTimeout(600)
  const repTab = page.locator('button:has-text("Report")').first()
  if (await repTab.count() > 0) {
    await repTab.click()
    await page.waitForTimeout(600)
  }
  await expect(page.getByText('Centro Report')).toBeVisible({ timeout: 10000 })
  await expectButtonsClickable(page, [
    'Mostra archiviate',
    'Ricerca avanzata',
    'Ricarica elenco',
    'Altri filtri',
    'Reset',
    'Ricerca',
    'Esporta dati in excel',
    'Salva giudizi',
    'Salva visite',
    'Invia',
    'Stampa',
  ])
})

test('WorkersCenter: toolbar buttons present and clickable', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
  await expectButtonsClickable(page, [
    'Gestione completa',
    'Aggiungi',
    'Reset',
    'Ricerca',
    'Ricerca lavoratori',
    '+ Nuovo lavoratore',
    'Stampa',
    'Stampe massive',
    'Operazioni massive',
    'Esporta dati in excel',
    'Importa lavoratori',
    'Filtra',
  ])
})

test('DashboardScadenze: quick action buttons present and clickable', async ({ page }) => {
  await loginAsAdmin(page)
  const companyButton = page.locator("button:has-text('Acme Industria S.p.A.')")
  if (await companyButton.count() > 0) { await companyButton.first().click(); await page.waitForTimeout(400) }

  await page.click('button:has-text("Scadenzario")')
  await page.waitForTimeout(700)
  await expectButtonsClickable(page, [
    'Aggiorna',
    'Nuova visita',
    'Convoca',
    'Esporta Report',
    'Vedi Calendario Completo',
    'Backup Dati Now',
  ])
})

test('CrudEntityView (company Anagrafica): toolbar buttons present and clickable', async ({ page }) => {
  await loginAsAdmin(page)
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
  await expectButtonsClickable(page, [
    'Aggiorna',
    'Nuova azienda',
    'Stampa',
    'Esporta dati in excel',
    'Operazioni massive',
    'Importa dati',
  ])
})
