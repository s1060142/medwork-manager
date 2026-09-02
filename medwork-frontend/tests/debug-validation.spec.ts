import { test } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

test('Debug: check form validation errors', async ({ page }) => {
  // Login
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  
  // Navigate to Companies
  await page.click('button:has-text("Gestione aziende")')
  await page.locator('button:has-text("Anagrafica")').click()
  await page.waitForSelector('text=Anagrafica', { timeout: 5000 })
  await page.waitForSelector('table tbody tr', { timeout: 10000 })
  
  // Click Modifica on first company
  const firstRow = page.locator('table tbody tr').first()
  const editBtn = firstRow.locator('button:has-text("Modifica")').first()
  await editBtn.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })
  
  // Capture all PUT requests
  const putRequests: any[] = []
  page.on('request', (req) => {
    if (req.method() === 'PUT') {
      try {
        putRequests.push({ url: req.url(), body: req.postDataJSON() })
      } catch {
        putRequests.push({ url: req.url(), body: req.postData() })
      }
    }
  })
  
  // Fill the Nome Azienda field
  const newName = 'Test Company Grid ' + Date.now()
  const nameInput = page.getByLabel(/nome azienda/i).first()
  await nameInput.fill(newName)
  console.log('Filled Nome Azienda with:', newName)
  
  // Type a character to trigger onChange/dirty state
  await nameInput.press('Tab')
  await page.waitForTimeout(500)
  
  // Check for any error messages in the dialog BEFORE save
  const errorTextsBefore = await page.locator('[role="dialog"] .MuiFormHelperText-root').allTextContents()
  console.log('Error texts in dialog BEFORE save:', JSON.stringify(errorTextsBefore))
  
  // Check if the field has error class BEFORE save
  const nameFieldClass = await nameInput.getAttribute('class')
  console.log('Name field class:', nameFieldClass)
  
  // Check the value
  const currentValue = await nameInput.inputValue()
  console.log('Current value after fill:', currentValue)
  
  // Click Salva
  await page.locator('[role="dialog"] button:has-text("Salva")').click()
  await page.waitForTimeout(3000)
  
  // Check dialog state
  const dialogStillOpen = await page.locator('[role="dialog"]').count() > 0
  console.log('Dialog still open after save:', dialogStillOpen)
  
  // Check for error messages in the dialog AFTER save
  const errorTextsAfter = await page.locator('[role="dialog"] .MuiFormHelperText-root').allTextContents()
  console.log('Error texts in dialog AFTER save:', JSON.stringify(errorTextsAfter))
  
  // Check the Ragione Sociale field for errors
  const legalNameInput = page.getByLabel(/ragione sociale/i).first()
  const legalNameClass = await legalNameInput.getAttribute('class')
  const legalNameValue = await legalNameInput.inputValue()
  console.log('LegalName field class:', legalNameClass)
  console.log('LegalName current value:', legalNameValue)
  
  // Check the Partita IVA field for errors
  const vatInput = page.getByLabel(/partita iva/i).first()
  const vatClass = await vatInput.getAttribute('class')
  const vatValue = await vatInput.inputValue()
  console.log('VatNumber field class:', vatClass)
  console.log('VatNumber current value:', vatValue)
  
  // Check for error alerts
  const alerts = await page.locator('[role="alert"], .MuiAlert-root').allTextContents()
  console.log('Alerts:', JSON.stringify(alerts))
  
  console.log('PUT requests:', JSON.stringify(putRequests, null, 2))
})
