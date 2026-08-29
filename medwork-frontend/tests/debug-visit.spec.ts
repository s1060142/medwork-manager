import { test, expect } from '@playwright/test'
import { TestFixtures, USERS, API_URL } from '../fixtures/test-fixtures'

test('check visit page labels after login', async ({ page, request, context }) => {
  const fixtures = new TestFixtures(page, request, context, expect)
  
  // Login as admin
  await fixtures.loginAsAdmin()
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await page.waitForTimeout(2000)
  
  // Navigate to medical visits
  await page.click('button:has-text("Sorveglianza sanitaria")')
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await page.waitForTimeout(2000)
  
  // Check labels
  const labels = await page.locator('label').all()
  console.log('All labels on medical visit page:')
  for (const label of labels) {
    const text = await label.textContent()
    if (text && text.trim()) {
      console.log('-', text.trim())
    }
  }
  
  // Check inputs
  const inputs = await page.locator('input').all()
  console.log('\nAll inputs on medical visit page:')
  for (const input of inputs) {
    const type = await input.getAttribute('type')
    const id = await input.getAttribute('id')
    const placeholder = await input.getAttribute('placeholder')
    const ariaLabel = await input.getAttribute('aria-label')
    console.log(`Input: type=${type}, id=${id}, placeholder=${placeholder}, aria-label=${ariaLabel}`)
  }
  
  // Try to find specific labels
  const prossima = page.getByLabel('Prossima scadenza *')
  console.log('\nProssima scadenza * visible:', await prossima.isVisible())
  
  const dataVisita = page.getByLabel('Data visita *')
  console.log('Data visita * visible:', await dataVisita.isVisible())
  
  const tipoVisita = page.getByLabel('Tipo visita')
  console.log('Tipo visita visible:', await tipoVisita.isVisible())
})