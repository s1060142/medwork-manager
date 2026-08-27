import { type Page, type Locator } from '@playwright/test'

export class CompaniesPage {
  readonly page: Page
  readonly newCompanyButton: Locator
  readonly companyNameInput: Locator
  readonly legalNameInput: Locator
  readonly vatNumberInput: Locator
  readonly emailInput: Locator
  readonly phoneInput: Locator
  readonly saveButton: Locator
  readonly cancelButton: Locator
  readonly dialog: Locator

  constructor(page: Page) {
    this.page = page
    this.dialog = page.getByRole('dialog')
    this.newCompanyButton = page.getByRole('button', { name: 'Nuova azienda' })
    this.companyNameInput = page.getByLabel('Nome Azienda')
    this.legalNameInput = page.getByLabel('Ragione Sociale')
    this.vatNumberInput = page.getByLabel('Partita IVA')
    this.emailInput = page.getByLabel('Email Contatto (legacy)')
    this.phoneInput = page.getByLabel('Telefono')
    this.saveButton = page.getByRole('button', { name: 'Salva' })
    this.cancelButton = page.getByRole('button', { name: 'Annulla' }).first()
  }

  async openCreateDialog() {
    await this.newCompanyButton.click()
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  }

  async fillCompanyForm(data: {
    name: string
    legalName?: string
    vatNumber?: string
    email?: string
    phone?: string
  }) {
    await this.companyNameInput.fill(data.name)
    if (data.legalName) await this.legalNameInput.fill(data.legalName)
    if (data.vatNumber) await this.vatNumberInput.fill(data.vatNumber)
    if (data.email) await this.emailInput.fill(data.email)
    if (data.phone) await this.phoneInput.fill(data.phone)
  }

  async saveCompany() {
    await this.saveButton.click()
  }

  async cancelCreate() {
    await this.cancelButton.click()
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
  }

  async assertCompanyVisible(name: string) {
    await this.page.waitForSelector(`text=${name}`, { timeout: 10000 })
  }
}
