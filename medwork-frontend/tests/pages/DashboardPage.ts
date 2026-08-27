import { type Page, type Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly logoutButton: Locator
  readonly companyManagementButton: Locator
  readonly workersManagementButton: Locator
  readonly healthSurveillanceButton: Locator
  readonly administrationButton: Locator

  constructor(page: Page) {
    this.page = page
    this.logoutButton = page.getByRole('button', { name: 'Logout' })
    this.companyManagementButton = page.getByRole('button', { name: 'Gestione aziende' })
    this.workersManagementButton = page.getByRole('button', { name: 'Gestione lavoratori' })
    this.healthSurveillanceButton = page.getByRole('button', { name: 'Sorveglianza sanitaria' })
    this.administrationButton = page.getByRole('button', { name: 'Amministrazione' })
  }

  async waitForDashboard() {
    await this.page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  }

  async logout() {
    await this.logoutButton.click()
  }

  async assertLoggedOut() {
    await this.page.waitForSelector('text=Accesso piattaforma', { timeout: 10000 })
  }
}
