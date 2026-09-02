import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

const REPARTO_TEST = 'REPARTO_PERSIST_TEST_XXX'
const LUOGO_TEST = 'LUOGO_PERSIST_TEST_XXX'
const PERIODICITA_TEST = 'Annuale'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test.describe('Employee field persistence: reparto, luogoDiLavoro, periodicita', () => {
  test('Reparto, Luogo di lavoro, Periodicitá persist after save + refresh', async ({ page }) => {
    const putBodies: any[] = []
    const putResponses: any[] = []

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

    // Step 2: Navigate to Gestione lavoratori
    await page.click('button:has-text("Gestione lavoratori")')
    await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })

    // Wait for employee table (second table on the page, as per existing test patterns)
    const empTable = page.locator('table').nth(1)
    await empTable.locator('tbody tr').first().waitFor({ timeout: 10000 })

    // Step 3: Capture identifying info from first employee row so we can relocate after refresh
    const firstRow = empTable.locator('tbody tr').first()

    // Identify employee by name (first meaningful alphabetic cell)
    const cells = await firstRow.locator('td').allTextContents()
    let employeeNameText = ''
    for (const c of cells) {
      const trimmed = c.trim()
      if (trimmed.length > 2 && /[A-Za-z]/.test(trimmed) && !trimmed.match(/^[\d\-\/]+$/)) {
        employeeNameText = trimmed
        break
      }
    }
    console.log('=== EMPLOYEE PERSISTENCE TEST ===')
    console.log('Identified employee name:', employeeNameText)

    // Click Lista (clipboard icon) to open EmployeeProfileDialog
    const listButton = firstRow.locator('button[aria-label="Lista"]')
    if (await listButton.count() === 0) {
      test.skip('No Lista button found in employee table')
      return
    }

    await listButton.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(1000)

    // Step 4: Fill the three fields
    const dialog = page.locator('[role="dialog"]')

    // Reparto
    let repartoField = dialog.getByLabel(/^reparto$/i).first()
    let luogoField = dialog.getByLabel(/luogo di lavoro/i).first()
    let periodicitaField = dialog.getByLabel(/periodicità/i).first()

    // Fallbacks for different label patterns
    if (await repartoField.count() === 0) {
      repartoField = dialog.locator('input[placeholder*="Reparto" i], input[aria-label*="Reparto" i]').first()
    }
    if (await luogoField.count() === 0) {
      luogoField = dialog.locator('input[placeholder*="Luogo" i], input[aria-label*="Luogo" i]').first()
    }
    if (await periodicitaField.count() === 0) {
      periodicitaField = dialog.locator('select').filter({ hasText: /periodicità/i }).first()
      if (await periodicitaField.count() === 0) {
        periodicitaField = dialog.locator('text=Periodicitá, text=Periodicità').first()
      }
    }

    console.log('Reparto field found:', await repartoField.count())
    console.log('Luogo di lavoro field found:', await luogoField.count())
    console.log('Periodicità field found:', await periodicitaField.count())

    // Fill Reparto
    if (await repartoField.count() > 0) {
      await repartoField.fill(REPARTO_TEST)
      console.log('Filled Reparto with:', REPARTO_TEST)
    }

    // Fill Luogo di lavoro
    if (await luogoField.count() > 0) {
      await luogoField.fill(LUOGO_TEST)
      console.log('Filled Luogo di lavoro with:', LUOGO_TEST)
    }

    // Select Periodicità = "Annuale"
    if (await periodicitaField.count() > 0) {
      const isSelect = await periodicitaField.evaluate((el) => el.tagName.toLowerCase())
      if (isSelect === 'select') {
        await periodicitaField.selectOption({ label: PERIODICITA_TEST })
        console.log('Selected Periodicitá via selectOption:', PERIODICITA_TEST)
      } else {
        await periodicitaField.click()
        await page.waitForTimeout(500)
        const option = page.locator('li:has-text("Annuale")').first()
        if (await option.count() > 0) {
          await option.click()
          console.log('Selected Periodicitá via dropdown:', PERIODICITA_TEST)
        } else {
          console.log('Annuale option not found in dropdown')
        }
      }
    }

    // Step 5: Save
    await dialog.locator('button:has-text("Salva")').click()
    console.log('Clicked Salva button')

    // Step 6: Wait 3 seconds
    await page.waitForTimeout(3000)

    // Log PUT request/response evidence
    console.log('PUT bodies count:', putBodies.length)
    console.log('PUT responses count:', putResponses.length)
    if (putBodies.length > 0) {
      const lastBody = putBodies[putBodies.length - 1].body
      console.log('--- Last PUT body ---')
      console.log(JSON.stringify(lastBody, null, 2))
      console.log('reparto in PUT body:', lastBody.reparto)
      console.log('luogoDiLavoro in PUT body:', lastBody.luogoDiLavoro)
      console.log('periodicita in PUT body:', lastBody.periodicita)
    }
    if (putResponses.length > 0) {
      const lastRes = putResponses[putResponses.length - 1]
      console.log('--- Last PUT response ---')
      console.log('status:', lastRes.status)
      console.log('body:', JSON.stringify(lastRes.body, null, 2))
    }

    // Step 7: Close dialog
    const closeBtn = dialog.locator('button:has-text("Chiudi")')
    if (await closeBtn.count() > 0) {
      await closeBtn.click()
      console.log('Clicked Chiudi button')
    } else {
      await page.keyboard.press('Escape')
      console.log('Pressed Escape to close dialog')
    }
    await page.waitForTimeout(1000)

    // Confirm dialog closed
    const dialogGone = await page.locator('[role="dialog"]').count()
    console.log('Dialog open count after close:', dialogGone)

    // Step 8: Refresh the page (F5)
    console.log('=== Refreshing page (F5) ===')
    await page.keyboard.press('F5')

    // Step 9: Wait for table to reload
    await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
    await page.click('button:has-text("Gestione lavoratori")')
    await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
    await empTable.locator('tbody tr').first().waitFor({ timeout: 10000 })
    await page.waitForTimeout(1000)

    console.log('Page refreshed, table reloaded. Looking for same employee:', employeeNameText)

    // Step 10: Click Lista on the same employee
    const empTable2 = page.locator('table').nth(1)

    let listButton2
    if (employeeNameText && employeeNameText.length > 0) {
      // Find row matching the employee name
      const targetRow = empTable2.locator('tbody tr').filter({ hasText: employeeNameText })
      if (await targetRow.count() > 0) {
        listButton2 = targetRow.locator('button[aria-label="Lista"]').first()
        console.log('Found same employee row by name, clicking Lista')
      } else {
        console.log('Could not locate row by name, using first row')
        listButton2 = empTable2.locator('tbody tr').first().locator('button[aria-label="Lista"]')
      }
    } else {
      listButton2 = empTable2.locator('tbody tr').first().locator('button[aria-label="Lista"]')
    }

    if (await listButton2.count() === 0) {
      test.skip('No Lista button found after refresh')
      return
    }

    await listButton2.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(1000)

    // Step 11: Check if Reparto, Luogo di lavoro, and Periodicità show the saved values
    const dialog2 = page.locator('[role="dialog"]')

    // Re-acquire field locators (post-refresh)
    let repartoField2 = dialog2.getByLabel(/^reparto$/i).first()
    let luogoField2 = dialog2.getByLabel(/luogo di lavoro/i).first()
    let periodicitaField2 = dialog2.getByLabel(/periodicità/i).first()

    if (await repartoField2.count() === 0) {
      repartoField2 = dialog2.locator('input[placeholder*="Reparto" i], input[aria-label*="Reparto" i]').first()
    }
    if (await luogoField2.count() === 0) {
      luogoField2 = dialog2.locator('input[placeholder*="Luogo" i], input[aria-label*="Luogo" i]').first()
    }
    if (await periodicitaField2.count() === 0) {
      periodicitaField2 = dialog2.locator('select').filter({ hasText: /periodicità/i }).first()
    }

    let repartoVal = ''
    let luogoVal = ''
    let periodicitaVal = ''

    // Read Reparto
    if (await repartoField2.count() > 0) {
      const tag = await repartoField2.evaluate((el) => el.tagName.toLowerCase())
      if (tag === 'input') {
        repartoVal = await repartoField2.inputValue()
      } else {
        repartoVal = (await repartoField2.textContent()).trim()
      }
    }
    console.log('Reparto after reopen:', repartoVal)

    // Read Luogo di lavoro
    if (await luogoField2.count() > 0) {
      const tag = await luogoField2.evaluate((el) => el.tagName.toLowerCase())
      if (tag === 'input') {
        luogoVal = await luogoField2.inputValue()
      } else {
        luogoVal = (await luogoField2.textContent()).trim()
      }
    }
    console.log('Luogo di lavoro after reopen:', luogoVal)

    // Read Periodicità — could be select or displayed text
    if (await periodicitaField2.count() > 0) {
      const tag = await periodicitaField2.evaluate((el) => el.tagName.toLowerCase())
      if (tag === 'select') {
        periodicitaVal = await periodicitaField2.inputValue()
        // If value is empty, try selected option text
        if (!periodicitaVal) {
          const selectedOpt = await periodicitaField2.locator('option:checked').first().textContent()
          periodicitaVal = (selectedOpt || '').trim()
        }
      } else {
        // MUI select displays value as text content
        periodicitaVal = (await periodicitaField2.textContent()).trim()
      }
    }
    console.log('Periodicitá after reopen:', periodicitaVal)

    // Also try getByLabel fallback for Periodicità display text
    if (!periodicitaVal) {
      const periodicitaByText = await dialog2.locator('text=' + PERIODICITA_TEST).count()
      console.log('Periodicitá display text "Annuale" found in dialog:', periodicitaByText > 0)
      if (periodicitaByText > 0) periodicitaVal = PERIODICITA_TEST
    }

    const repartoPersisted = repartoVal === REPARTO_TEST
    const luogoPersisted = luogoVal === LUOGO_TEST
    const periodicitaPersisted = periodicitaVal === PERIODICITA_TEST

    console.log('')
    console.log('=== PERSISTENCE RESULTS ===')
    console.log('Reparto persisted:', repartoPersisted, '(expected:', REPARTO_TEST + ', got:', repartoVal + ')')
    console.log('Luogo di lavoro persisted:', luogoPersisted, '(expected:', LUOGO_TEST + ', got:', luogoVal + ')')
    console.log('Periodicitá persisted:', periodicitaPersisted, '(expected:', PERIODICITA_TEST + ', got:', periodicitaVal + ')')
    console.log('PUT sent:', putBodies.length > 0)
    if (putBodies.length > 0) {
      console.log('PUT body contains reparto:', putBodies[putBodies.length-1].body.reparto === REPARTO_TEST)
      console.log('PUT body contains luogoDiLavoro:', putBodies[putBodies.length-1].body.luogoDiLavoro === LUOGO_TEST)
      console.log('PUT body contains periodicita:', putBodies[putBodies.length-1].body.periodicita === PERIODICITA_TEST)
    }
    console.log('PUT response status:', putResponses.length > 0 ? putResponses[putResponses.length-1].status : 'N/A')

    // Assertions
    expect(repartoPersisted, 'Reparto value did not persist after refresh').toBe(true)
    expect(luogoPersisted, 'Luogo di lavoro value did not persist after refresh').toBe(true)
    expect(periodicitaPersisted, 'Periodicitá value did not persist after refresh').toBe(true)

    // Close dialog at the end
    const closeBtn2 = dialog2.locator('button:has-text("Chiudi")')
    if (await closeBtn2.count() > 0) {
      await closeBtn2.click()
    }
  })
})
