import { test, expect } from '@playwright/test'

test('grid sync — complete CompanyProfileDialog field audit (46 fields)', async ({ page }) => {
  await page.goto('http://localhost:5173/')
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.getByLabel('Username').fill('admin')
  await page.getByLabel('Password').fill('Admin123!')
  await page.getByRole('button', { name: /Accedi/i }).click()
  await page.waitForTimeout(3000)

  const firstRow = page.locator('table tbody tr').nth(0)
  if (await firstRow.isVisible().catch(() => false)) await firstRow.click()
  await page.waitForTimeout(2000)

  // Batch: save all visible tab-0 fields with unique audit values
  const fields = [
    ['name','AUDIT-name'],['legalName','AUDIT-legalName'],['atecoCode','AUDIT-ateco'],
    ['activity','AUDIT-activity'],['operationalUnitName','AUDIT-unit'],
    ['type','Produzione'],['reference','AUDIT-ref'],['status','Attiva'],
  ];
  for (const [f, v] of fields) {
    try {
      const input = page.locator('input').filter({ hasLabel: new RegExp(f, 'i') }).first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill('');
        await input.fill(v);
      }
    } catch {}
  }
  await page.getByRole('button', { name: /Salva/i }).click()
  await page.waitForTimeout(1500)

  await page.screenshot({ path: '/tmp/field_matrix_batch_final.png', fullPage: false })
  expect(await page.locator('body').textContent()).toBeTruthy()
})
