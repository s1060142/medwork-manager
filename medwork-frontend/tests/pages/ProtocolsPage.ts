import { type Page, type Locator } from '@playwright/test'

export class ProtocolsPage {
  readonly page: Page
  readonly newProtocolButton: Locator
  readonly protocolNameInput: Locator
  readonly cadenceInput: Locator
  readonly objectiveInput: Locator
  readonly descriptionInput: Locator
  readonly lawReferenceInput: Locator
  readonly saveButton: Locator
  readonly dialog: Locator

  constructor(page: Page) {
    this.page = page
    this.dialog = page.getByRole('dialog')
    this.newProtocolButton = page.getByRole('button', { name: '+ Nuovo protocollo' })
    this.protocolNameInput = page.getByLabel('Nome protocollo')
    this.cadenceInput = page.getByLabel('Cadenza visita (giorni)')
    this.objectiveInput = page.getByLabel('Obiettivo / Rischio target')
    this.descriptionInput = page.getByLabel('Note descrittive')
    this.lawReferenceInput = page.getByLabel('Riferimento normativo')
    this.saveButton = page.getByRole('button', { name: 'Salva protocollo' })
  }

  async waitForPage() {
    await this.page.waitForSelector('text=Protocolli sanitari', { timeout: 10000 })
  }

  async openCreateDialog() {
    await this.newProtocolButton.click()
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  }

  async fillProtocolForm(data: {
    name: string
    cadenceDays: number
    objective?: string
    description?: string
    lawReference?: string
  }) {
    await this.protocolNameInput.fill(data.name)
    await this.cadenceInput.fill(data.cadenceDays.toString())
    if (data.objective) await this.objectiveInput.fill(data.objective)
    if (data.description) await this.descriptionInput.fill(data.description)
    if (data.lawReference) await this.lawReferenceInput.fill(data.lawReference)
  }

  async saveProtocol() {
    await this.saveButton.click()
  }

  async assertProtocolVisible(name: string) {
    await this.page.waitForSelector(`text=${name}`, { timeout: 10000 })
  }
}
