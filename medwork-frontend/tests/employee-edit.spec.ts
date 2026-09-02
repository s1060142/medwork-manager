import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
}

test('Employee EDIT flow: open existing employee, change one field, save (regression test for 400 on missing BranchId/CompanyId/BirthCityCode)', async ({ page }) => {
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
  await page.click('button:has-text("Gestione lavoratori")')
  await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
  // Wait for table to be populated
  await page.waitForSelector('table tbody tr', { timeout: 10000 })

  // Click first "Modifica" / edit button in the table
  const editBtn = page.locator('table tbody tr button:has-text("Modifica")').first()
  await editBtn.scrollIntoViewIfNeeded()
  await editBtn.click({ timeout: 10000 })

  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

  // Change a single field — e.g. add a note
  const noteField = page.locator('[role="dialog"] textarea').first()
  if (await noteField.count()) {
    await noteField.fill('Test edit ' + Date.now())
  } else {
    // fallback: change jobRole
    const jobRole = page.locator('[role="dialog"] input').first()
    await jobRole.fill('Operatore test')
  }

  // Click Salva
  await page.locator('[role="dialog"] button:has-text("Salva")').click()

  // Wait for dialog to close OR for an error
  await page.waitForTimeout(2500)

  console.log('---PUT BODIES---')
  console.log(JSON.stringify(putBodies, null, 2))
  console.log('---PUT RESPONSES---')
  console.log(JSON.stringify(putResponses, null, 2))

  // ASSERTION: at least one PUT must have been sent, and must include companyId, branchId, birthCityCode
  expect(putBodies.length).toBeGreaterThan(0)
  const last = putBodies[putBodies.length - 1]
  expect(last.body, 'PUT body must contain companyId').toHaveProperty('companyId')
  expect(last.body.companyId, 'companyId must be > 0').toBeGreaterThan(0)
  expect(last.body, 'PUT body must contain branchId').toHaveProperty('branchId')
  expect(last.body.branchId, 'branchId must be > 0').toBeGreaterThan(0)
  expect(last.body, 'PUT body must contain birthCityCode').toHaveProperty('birthCityCode')
  expect(last.body.birthCityCode, 'birthCityCode must be non-empty').toBeTruthy()

  // And the response must be 2xx
  expect(putResponses.length).toBeGreaterThan(0)
  const lastRes = putResponses[putResponses.length - 1]
  expect(lastRes.status, 'PUT response must be 2xx').toBeLessThan(300)
})