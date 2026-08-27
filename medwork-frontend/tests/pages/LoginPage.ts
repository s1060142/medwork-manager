import { type Page, type Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly rememberMeCheckbox: Locator
  readonly submitButton: Locator
  readonly forgotPasswordLink: Locator
  readonly errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.usernameInput = page.getByLabel('Username')
    this.passwordInput = page.getByLabel('Password')
    this.rememberMeCheckbox = page.getByLabel('Ricordami (30 giorni)')
    this.submitButton = page.getByRole('button', { name: 'Accedi' })
    this.forgotPasswordLink = page.getByRole('link', { name: 'Password dimenticata?' })
    this.errorAlert = page.getByRole('alert')
  }

  async goto() {
    await this.page.goto('http://127.0.0.1:5173')
    await this.page.waitForLoadState('networkidle', { timeout: 30000 })
    await this.page.waitForTimeout(1000)
  }

  async clearAuth() {
    await this.page.evaluate(() => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('role')
      localStorage.removeItem('medwork.runtime.settings')
    })
  }

  async ensureLoginPage() {
    await this.goto()
    await this.clearAuth()
    await this.page.reload()
    await this.page.waitForLoadState('networkidle', { timeout: 30000 })
    await this.page.waitForTimeout(1000)
  }

  async login(username: string, password: string, rememberMe = false) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    if (rememberMe) {
      await this.rememberMeCheckbox.check()
    }
    await this.submitButton.click()
  }

  async assertLoginError() {
    await this.page.waitForSelector('[role="alert"]', { timeout: 5000 })
  }
}
