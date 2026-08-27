import { type Page, type Locator } from '@playwright/test'

export class EmployeesPage {
  readonly page: Page
  readonly newEmployeeButton: Locator
  readonly searchInput: Locator
  readonly filterButton: Locator
  readonly resetButton: Locator

  constructor(page: Page) {
    this.page = page
    this.newEmployeeButton = page.getByRole('button', { name: '+ Nuovo lavoratore' })
    this.searchInput = page.getByPlaceholder('Cerca lavoratore...')
    this.filterButton = page.getByRole('button', { name: 'Filtra' })
    this.resetButton = page.getByRole('button', { name: 'Reset' })
  }

  async waitForPage() {
    await this.page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
  }

  async openCreateDialog() {
    await this.newEmployeeButton.click()
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  }

  async assertEmployeeVisible(lastName: string) {
    await this.page.waitForSelector(`text=${lastName}`, { timeout: 10000 })
  }
}
