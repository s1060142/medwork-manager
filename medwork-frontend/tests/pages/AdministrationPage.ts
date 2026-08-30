import { type Page, type Locator } from '@playwright/test'

export class AdministrationPage {
  readonly page: Page
  readonly auditTab: Locator
  readonly toolsTab: Locator
  readonly updateAuditButton: Locator
  readonly signatureButton: Locator

  constructor(page: Page) {
    this.page = page
    this.auditTab = page.getByRole('button', { name: 'Audit' })
    this.toolsTab = page.getByRole('button', { name: 'Strumenti' })
    this.updateAuditButton = page.getByRole('button', { name: 'Aggiorna' })
    this.signatureButton = page.getByRole('button', { name: 'Registra firma' })
  }

  async waitForPage() {
    await this.page.waitForSelector('button:has-text("Amministrazione")', { timeout: 10000 })
  }

  async openAuditTab() {
    await this.auditTab.click()
    await this.page.waitForSelector('text=Audit', { timeout: 5000 })
  }

  async openToolsTab() {
    await this.toolsTab.click()
    await this.page.waitForSelector('text=Strumenti', { timeout: 5000 })
  }

  async refreshAudit() {
    await this.updateAuditButton.click()
  }

  async clearAudit() {
  }
}
