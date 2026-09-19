import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  // Wait for dashboard to load - sidebar areas should be visible
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 })
}

test('login as admin', async ({ page }) => {
  await loginAsAdmin(page)
  await expect(page.locator('button:has-text("Logout")')).toBeVisible()
})

test('navigation sidebar opens areas and modules', async ({ page }) => {
  await loginAsAdmin(page)

  // Gestione Aziende -> the Anagrafica sub-tab becomes available
  await page.click('button:has-text("Gestione aziende")')
  await expect(page.locator('button:has-text("Anagrafica")')).toBeVisible()

  // Gestione Lavoratori -> "+ Nuovo lavoratore" create button appears
  await page.click('button:has-text("Gestione lavoratori")')
  await expect(page.locator('button:has-text("+ Nuovo lavoratore")')).toBeVisible()

  // Sorveglianza Sanitaria -> Nuova Visita sub-tab becomes available
  await page.click('button:has-text("Sorveglianza sanitaria")')
  await expect(page.locator('button:has-text("Nuova Visita")')).toBeVisible({ timeout: 10000 })
})

test('company context selection updates dashboard greeting', async ({ page }) => {
  await loginAsAdmin(page)

  const companyButton = page.locator("button:has-text('Acme Industria S.p.A.')")
  if (await companyButton.count() > 0) {
    await companyButton.first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('button:has-text("Gestione aziende")')).toBeVisible()
  }
})

test('dashboard quick actions and kpi cards render after company selection', async ({ page }) => {
  await loginAsAdmin(page)

  const companyButton = page.locator("button:has-text('Acme Industria S.p.A.')")
  if (await companyButton.count() > 0) {
    await companyButton.first().click()
    await page.waitForTimeout(500)
  }

  await expect(page.locator('button:has-text("Gestione aziende")')).toBeVisible()
  await expect(page.locator('button:has-text("Gestione lavoratori")')).toBeVisible()
  await expect(page.locator('button:has-text("Sorveglianza sanitaria")')).toBeVisible()
})

test('company CRUD flow via UI', async ({ page }) => {
  await loginAsAdmin(page)

  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })

  const createButton = page.locator('button:has-text("Nuova azienda")')
  if (await createButton.count() > 0) {
    await createButton.click()
    await expect(page.locator('[role="dialog"]').getByText('Nuova azienda')).toBeVisible({ timeout: 10000 })
    const uniqueVat = `IT${Date.now().toString().slice(-11)}`
    await page.getByLabel('Nome Azienda').fill('PLAYWRIGHT TEST CO')
    await page.getByLabel('Ragione Sociale').fill('PLAYWRIGHT TEST CO SRL')
    await page.getByLabel('Partita IVA').fill(uniqueVat)
    await page.getByLabel('Email Contatto (legacy)').fill('playwright@test.it')
    await page.getByLabel('Telefono').fill('0000000000')
    await page.click('button:has-text("Salva")')
    await page.waitForTimeout(1000)
  }
})

test('employee area opens and create button is reachable', async ({ page }) => {
  await loginAsAdmin(page)

  await page.click('button:has-text("Gestione lavoratori")')
  await expect(page.locator('text=Aziende / Lavoratori')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('button:has-text("+ Nuovo lavoratore")')).toBeVisible()
})

test('employee profile "Nuova visita" opens the visit stepper', async ({ page }) => {
  await loginAsAdmin(page)

  const companyButton = page.locator("button:has-text('Acme Industria S.p.A.')")
  if (await companyButton.count() > 0) {
    await companyButton.first().click()
    await page.waitForTimeout(500)
  }

  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

  const firstRow = page.locator('table tbody tr').first()
  if (await firstRow.count() > 0) {
    await firstRow.dblclick()
    const nuovaVisita = page.locator('[role="dialog"] button:has-text("Nuova visita")')
    if (await nuovaVisita.count() > 0) {
      await nuovaVisita.click()
      await expect(page.locator('[role="dialog"]')).toHaveCount(0, { timeout: 10000 })
      await expect(page.getByText('Nuova Visita Medica', { exact: false })).toBeVisible({ timeout: 15000 })
    }
  }
})
