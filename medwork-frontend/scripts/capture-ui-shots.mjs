import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://127.0.0.1:5173'
const OUT_DIR = path.resolve('./screenshots/inspection')

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  console.log('Navigating to login...')
  await page.goto(BASE_URL)
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, '01_login_page.png'), fullPage: true })

  // Fill Login
  await page.getByLabel('Username').fill('admin')
  await page.getByLabel('Password').fill('Admin123!')
  await page.locator('button[type="submit"]:has-text("Accedi")').click()
  await page.waitForSelector('.legacy-topbar', { timeout: 10000 })
  await page.waitForTimeout(1000)

  // 1. Gestione Aziende
  console.log('Capturing Gestione Aziende...')
  await page.locator('.legacy-side-item:has-text("Gestione aziende")').first().click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, '02_gestione_aziende.png'), fullPage: true })

  // 2. Sorveglianza Sanitaria - Il Mio Giorno
  console.log('Capturing Sorveglianza Sanitaria...')
  await page.locator('.legacy-side-item:has-text("Sorveglianza sanitaria")').first().click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, '03_il_mio_giorno.png'), fullPage: true })

  // 3. Nuova Visita Stepper
  console.log('Capturing Nuova Visita...')
  await page.locator('.mw-chip:has-text("Nuova Visita")').first().click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, '04_nuova_visita_stepper.png'), fullPage: true })

  // 4. Centro Giudizi
  console.log('Capturing Centro Giudizi...')
  await page.locator('.mw-chip:has-text("Centro Giudizi")').first().click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, '05_centro_giudizi.png'), fullPage: true })

  // 5. Gestione Lavoratori
  console.log('Capturing Gestione Lavoratori...')
  await page.locator('.legacy-side-item:has-text("Gestione lavoratori")').first().click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, '06_gestione_lavoratori.png'), fullPage: true })

  // 6. Scadenzario
  console.log('Capturing Scadenzario...')
  await page.locator('.legacy-side-item:has-text("Scadenzario")').first().click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, '07_scadenzario.png'), fullPage: true })

  // 7. Analisi & Relazioni
  console.log('Capturing Analisi & Relazioni...')
  await page.locator('.legacy-side-item:has-text("Analisi & Relazioni")').first().click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, '08_analisi_relazioni.png'), fullPage: true })

  // 8. Portale RSPP/DdL
  console.log('Capturing Portale RSPP/DdL...')
  await page.locator('.legacy-side-item:has-text("Portale RSPP/DdL")').first().click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, '09_portale_rspp.png'), fullPage: true })

  // 9. Amministrazione
  console.log('Capturing Amministrazione...')
  await page.locator('.legacy-side-item:has-text("Amministrazione")').first().click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, '10_amministrazione.png'), fullPage: true })

  console.log('All screenshots captured in', OUT_DIR)
  await browser.close()
}

run().catch((err) => {
  console.error('Error during screenshot capture:', err)
  process.exit(1)
})
