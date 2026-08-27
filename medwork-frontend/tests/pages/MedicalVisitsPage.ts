import { type Page, type Locator } from '@playwright/test'

export class MedicalVisitsPage {
  readonly page: Page
  readonly employeeSelect: Locator
  readonly doctorSelect: Locator
  readonly visitDateInput: Locator
  readonly nextDeadlineInput: Locator
  readonly visitTypeSelect: Locator
  readonly targetOrgansInput: Locator
  readonly outcomeSelect: Locator
  readonly clinicalNotesInput: Locator
  readonly saveButton: Locator
  readonly forwardButton: Locator

  constructor(page: Page) {
    this.page = page
    this.employeeSelect = page.getByLabel('Lavoratore *')
    this.doctorSelect = page.getByLabel('Medico *')
    this.visitDateInput = page.getByLabel('Data visita *')
    this.nextDeadlineInput = page.getByLabel('Prossima scadenza *')
    this.visitTypeSelect = page.getByLabel('Tipo visita')
    this.targetOrgansInput = page.getByLabel('Organi bersaglio')
    this.outcomeSelect = page.getByLabel('Giudizio di idoneità *')
    this.clinicalNotesInput = page.getByLabel('Note cliniche libere')
    this.saveButton = page.getByRole('button', { name: 'Salva Visita' }).first()
    this.forwardButton = page.getByRole('button', { name: 'Avanti' }).first()
  }

  async waitForStepper() {
    await this.page.waitForSelector('text=Inserimento Visita Medica', { timeout: 15000 })
  }

  async selectFirstEmployee() {
    await this.employeeSelect.click()
    await this.page.getByRole('option').first().click()
  }

  async selectFirstDoctor() {
    await this.doctorSelect.click()
    await this.page.getByRole('option').first().click()
  }

  async fillBasicInfo(visitDate: string, deadline: string) {
    await this.visitDateInput.fill(visitDate)
    await this.nextDeadlineInput.fill(deadline)
  }

  async selectVisitType(type: string) {
    await this.visitTypeSelect.click()
    await this.page.getByRole('option', { name: type }).click()
  }

  async fillOutcome(outcome: string) {
    await this.outcomeSelect.click()
    await this.page.getByRole('option', { name: outcome }).click()
  }

  async saveVisit() {
    await this.saveButton.click()
  }

  async assertVisitSaved() {
    await this.page.waitForSelector('table tbody tr', { timeout: 10000 })
  }
}
