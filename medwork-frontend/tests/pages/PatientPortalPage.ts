import { type Page, type Locator } from '@playwright/test'

export class PatientPortalPage {
  readonly page: Page
  readonly workHistoryInput: Locator
  readonly personalHistoryInput: Locator
  readonly familyHistoryInput: Locator
  readonly remotePathologyInput: Locator
  readonly recentPathologyInput: Locator
  readonly lifestyleHabitsInput: Locator
  readonly occupationalExposuresInput: Locator
  readonly saveButton: Locator

  constructor(page: Page) {
    this.page = page
    this.workHistoryInput = page.getByLabel('Storia lavorativa')
    this.personalHistoryInput = page.getByLabel('Storia personale')
    this.familyHistoryInput = page.getByLabel('Storia familiare')
    this.remotePathologyInput = page.getByLabel('Patologie remote')
    this.recentPathologyInput = page.getByLabel('Patologie recenti')
    this.lifestyleHabitsInput = page.getByLabel('Abitudini di vita')
    this.occupationalExposuresInput = page.getByLabel('Esposizioni professionali')
    this.saveButton = page.getByRole('button', { name: 'Salva' })
  }

  async waitForForm() {
    await this.page.waitForSelector('text=Anamnesi', { timeout: 10000 })
  }

  async fillAnamnesis(data: {
    workHistory?: string
    personalHistory?: string
    familyHistory?: string
    remotePathology?: string
    recentPathology?: string
    lifestyleHabits?: string
    occupationalExposures?: string
  }) {
    if (data.workHistory) await this.workHistoryInput.fill(data.workHistory)
    if (data.personalHistory) await this.personalHistoryInput.fill(data.personalHistory)
    if (data.familyHistory) await this.familyHistoryInput.fill(data.familyHistory)
    if (data.remotePathology) await this.remotePathologyInput.fill(data.remotePathology)
    if (data.recentPathology) await this.recentPathologyInput.fill(data.recentPathology)
    if (data.lifestyleHabits) await this.lifestyleHabitsInput.fill(data.lifestyleHabits)
    if (data.occupationalExposures) await this.occupationalExposuresInput.fill(data.occupationalExposures)
  }

  async save() {
    await this.saveButton.click()
  }

  async assertSaved() {
    await this.page.waitForSelector('text=Salvato', { timeout: 5000 })
  }
}
