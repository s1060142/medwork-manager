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

test.describe('UI Persistence Verification', () => {
  test('Company: edit contactPhone via Profilo dialog, save, refresh, reopen and verify persistence', async ({ page }) => {
    const putBodies: any[] = []
    const putResponses: any[] = []
    let originalPhone = ''
    let updatedPhone = ''

    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/admin-data/companies/')) {
        try {
          putBodies.push({ url: req.url(), body: req.postDataJSON() })
        } catch {
          putBodies.push({ url: req.url(), body: req.postData() })
        }
      }
    })

    page.on('response', async (res) => {
      if (res.request().method() === 'PUT' && res.url().includes('/api/admin-data/companies/')) {
        try {
          putResponses.push({ url: res.url(), status: res.status(), body: await res.json() })
        } catch {
          putResponses.push({ url: res.url(), status: res.status() })
        }
      }
    })

    await loginAsAdmin(page)

    // Step 1: Navigate to Companies (Anagrafica)
    await page.click('button:has-text("Gestione aziende")')
    await page.locator('button:has-text("Anagrafica")').click()
    await page.waitForSelector('text=Anagrafica', { timeout: 5000 })

    // Step 2: Open first company profile via "Profilo" button
    const profiloBtn = page.locator('table tbody tr button:has-text("Profilo")').first()
    if (await profiloBtn.count() === 0) {
      test.skip('No companies found in table')
      return
    }

    await profiloBtn.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Step 3: Capture original phone value from the Telefono field
    const phoneInput = page.locator('[role="dialog"] input[placeholder*="Telefono" i], [role="dialog"] label:has-text("Telefono") >> xpath=../input').first()
    if (await phoneInput.count() > 0) {
      originalPhone = await phoneInput.inputValue()
    } else {
      const phoneByLabel = page.getByLabel(/telefono/i).first()
      if (await phoneByLabel.count() > 0) {
        originalPhone = await phoneByLabel.inputValue()
      }
    }

    // Step 4: Modify the phone field
    updatedPhone = '+39 999 ' + Math.floor(Math.random() * 900 + 100) + ' ' + Math.floor(Math.random() * 9000 + 1000)
    if (await phoneInput.count() > 0) {
      await phoneInput.fill(updatedPhone)
    } else {
      const phoneByLabel = page.getByLabel(/telefono/i).first()
      if (await phoneByLabel.count() > 0) {
        await phoneByLabel.fill(updatedPhone)
      }
    }

    // Step 5: Save
    await page.locator('[role="dialog"] button:has-text("Salva")').click()
    await page.waitForTimeout(3000)

    // Log evidence
    console.log('=== COMPANY PERSISTENCE TEST ===')
    console.log('PUT BODIES:', JSON.stringify(putBodies, null, 2))
    console.log('PUT RESPONSES:', JSON.stringify(putResponses, null, 2))
    console.log('Original Phone:', originalPhone)
    console.log('Updated Phone:', updatedPhone)

    // Assert PUT was sent and succeeded
    expect(putBodies.length).toBeGreaterThan(0)
    expect(putResponses.length).toBeGreaterThan(0)
    expect(putResponses[putResponses.length - 1].status).toBeLessThan(300)

    // Step 6: Refresh the page
    await page.reload()
    await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })

    // Step 7: Re-navigate and reopen the same company
    await page.click('button:has-text("Gestione aziende")')
    await page.locator('button:has-text("Anagrafica")').click()
    await page.waitForSelector('text=Anagrafica', { timeout: 5000 })

    const profiloBtn2 = page.locator('table tbody tr button:has-text("Profilo")').first()
    if (await profiloBtn2.count() > 0) {
      await profiloBtn2.click()
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

      // Step 8: Verify the modified phone is still present
      const phoneInput2 = page.locator('[role="dialog"] input[placeholder*="Telefono" i], [role="dialog"] label:has-text("Telefono") >> xpath=../input').first()
      if (await phoneInput2.count() === 0) {
        const phoneByLabel2 = page.getByLabel(/telefono/i).first()
        if (await phoneByLabel2.count() > 0) {
          const currentValue = await phoneByLabel2.inputValue()
          console.log('Phone after reopen:', currentValue)
          expect(currentValue).toBe(updatedPhone)
        }
      } else {
        const currentValue = await phoneInput2.inputValue()
        console.log('Phone after reopen:', currentValue)
        expect(currentValue).toBe(updatedPhone)
      }
    }
  })

  test('Employee: edit personalEmail via profile dialog, save, refresh, reopen and verify persistence', async ({ page }) => {
    const putBodies: any[] = []
    const putResponses: any[] = []
    let originalEmail = ''
    let updatedEmail = ''

    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/admin-data/employees/')) {
        try {
          putBodies.push({ url: req.url(), body: req.postDataJSON() })
        } catch {
          putBodies.push({ url: req.url(), body: req.postData() })
        }
      }
    })

    page.on('response', async (res) => {
      if (res.request().method() === 'PUT' && res.url().includes('/api/admin-data/employees/')) {
        try {
          putResponses.push({ url: res.url(), status: res.status(), body: await res.json() })
        } catch {
          putResponses.push({ url: res.url(), status: res.status() })
        }
      }
    })

    await loginAsAdmin(page)

    // Ensure a company is selected so workers list is populated
    const companyButton = page.locator("button:has-text('Acme Industria S.p.A.')")
    if (await companyButton.count() > 0) {
      await companyButton.first().click()
      await page.waitForTimeout(500)
    }

    // Step 1: Navigate to Gestione Lavoratori
    await page.click('button:has-text("Gestione lavoratori")')
    await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

    // Step 2: Wait for employee table and click Lista button on first employee row
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Find the employees table (second table on the page)
    const employeesTable = page.locator('table').nth(1)
    const firstEmployeeRow = employeesTable.locator('tbody tr').first()

    // Click the Lista button (clipboard icon) to open EmployeeProfileDialog
    const listButton = firstEmployeeRow.locator('button[aria-label="Lista"]')
    if (await listButton.count() === 0) {
      test.skip('No Lista button found in employee table')
      return
    }

    await listButton.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Step 3: Capture original email value from the E-mail field
    const emailInput = page.locator('[role="dialog"] input[placeholder*="E-mail" i], [role="dialog"] label:has-text("E-mail") >> xpath=../input').first()
    if (await emailInput.count() > 0) {
      originalEmail = await emailInput.inputValue()
    } else {
      const emailByLabel = page.getByLabel(/e-mail/i).first()
      if (await emailByLabel.count() > 0) {
        originalEmail = await emailByLabel.inputValue()
      }
    }

    // Step 4: Modify the personal email field
    updatedEmail = 'test-persist-' + Date.now() + '@audit.com'
    if (await emailInput.count() > 0) {
      await emailInput.fill(updatedEmail)
    } else {
      const emailByLabel = page.getByLabel(/e-mail/i).first()
      if (await emailByLabel.count() > 0) {
        await emailByLabel.fill(updatedEmail)
      }
    }

    // Step 5: Fill valid phone to avoid backend validation error
    const phoneInput = page.locator('[role="dialog"] input[placeholder*="Telefono" i], [role="dialog"] label:has-text("Telefono") >> xpath=../input').first()
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('+39 999 999 9999')
    } else {
      const phoneByLabel = page.getByLabel(/telefono/i).first()
      if (await phoneByLabel.count() > 0) {
        await phoneByLabel.fill('+39 999 999 9999')
      }
    }

    // Step 6: Save
    await page.locator('[role="dialog"] button:has-text("Salva")').click()
    await page.waitForTimeout(3000)

    // Log evidence
    console.log('=== EMPLOYEE PERSISTENCE TEST ===')
    console.log('PUT BODIES:', JSON.stringify(putBodies, null, 2))
    console.log('PUT RESPONSES:', JSON.stringify(putResponses, null, 2))
    console.log('Original PersonalEmail:', originalEmail)
    console.log('Updated PersonalEmail:', updatedEmail)

    // Assert PUT was sent and succeeded
    expect(putBodies.length).toBeGreaterThan(0)
    expect(putResponses.length).toBeGreaterThan(0)
    expect(putResponses[putResponses.length - 1].status).toBeLessThan(300)

    // Step 7: Refresh the page
    await page.reload()
    await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })

    // Step 8: Re-navigate and reopen the same employee
    await page.click('button:has-text("Gestione aziende")')
    const companyButton2 = page.locator("button:has-text('Acme Industria S.p.A.')")
    if (await companyButton2.count() > 0) {
      await companyButton2.first().click()
      await page.waitForTimeout(500)
    }
    await page.click('button:has-text("Gestione lavoratori")')
    await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

    const employeesTable2 = page.locator('table').nth(1)
    const firstEmployeeRow2 = employeesTable2.locator('tbody tr').first()
    const listButton2 = firstEmployeeRow2.locator('button[aria-label="Lista"]')
    if (await listButton2.count() > 0) {
      await listButton2.click()
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

      // Step 9: Verify the modified email is still present
      const emailInput2 = page.locator('[role="dialog"] input[placeholder*="E-mail" i], [role="dialog"] label:has-text("E-mail") >> xpath=../input').first()
      if (await emailInput2.count() === 0) {
        const emailByLabel2 = page.getByLabel(/e-mail/i).first()
        if (await emailByLabel2.count() > 0) {
          const currentValue = await emailByLabel2.inputValue()
          console.log('PersonalEmail after reopen:', currentValue)
          expect(currentValue).toBe(updatedEmail)
        }
      } else {
        const currentValue = await emailInput2.inputValue()
        console.log('PersonalEmail after reopen:', currentValue)
        expect(currentValue).toBe(updatedEmail)
      }
    }
  })
})
