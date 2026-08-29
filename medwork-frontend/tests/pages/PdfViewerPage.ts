import { type Page, type Locator } from '@playwright/test'

export class PdfViewerPage {
  readonly page: Page

  constructor(page: Page, private readonly expect: any) {
    this.page = page
  }

  async waitForPdf() {
    await this.page.waitForSelector('canvas, embed[type="application/pdf"]', { timeout: 10000 })
  }

  async assertPdfContent(expectedText: string) {
    // PDF content is rendered as canvas or text layer
    await this.page.waitForSelector(`text=${expectedText}`, { timeout: 10000 })
  }

  async downloadPdf(url: string, token?: string): Promise<Buffer> {
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const response = await this.page.request.get(url, { headers })
    this.expect(response.ok()).toBe(true)
    return Buffer.from(await response.body())
  }
}
