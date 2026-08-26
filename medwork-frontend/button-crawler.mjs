import { chromium } from 'playwright'
import fs from 'fs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173'
const OUT = 'dogfood-output'
const SHOTS = `${OUT}/screenshots`
fs.mkdirSync(SHOTS, { recursive: true })

const results = []
let pageErrors = []
let consoleErrors = []
let dialogsSeen = []

const SKIP_EXACT = new Set([
  'Logout', 'Esci', 'Accedi', 'Login', 'Log out', 'Disconnetti',
  'Esporta CSV', 'Esporta Excel', 'Importa HR', 'Notifiche', 'ChangeLog',
  'Manuale', 'Profilo', 'Menu',
])
const SKIP_CONTAINS = ['Elimina', 'Cancella', 'Rimuovi', 'Operazioni massive', 'Importa dati', 'Distruggi']
function shouldSkip(text) {
  const t = (text || '').trim()
  if (!t) return true
  if (SKIP_EXACT.has(t) || SKIP_EXACT.has(t.toLowerCase())) return true
  return SKIP_CONTAINS.some((s) => t.toLowerCase().includes(s.toLowerCase()))
}

const AREA_TABS = {
  'Gestione aziende': ['Gruppi aziendali', 'Anagrafica', 'Checklist', 'Attività'],
  'Gestione lavoratori': ['Elenco', 'Gruppi', 'Import/Export'],
  'Analisi e relazioni': ['Elenco visite', 'Elenco attività', 'Relazioni aziendali', 'Grafici e analisi'],
  'Sorveglianza sanitaria': ['Protocolli', 'Appuntamenti', 'Nuova visita'],
  'Scadenzario': ['Agenda', 'Prenotazioni', 'Scadenzario Visite', 'Scadenzario Attività', 'Scadenzario Sopralluoghi', 'Scadenzario Nomine', 'Scadenzario Vaccinazioni'],
  'Amministrazione': ['Impostazioni', 'Fatturazione', 'Strumenti', 'Audit'],
}

function safeName(s) { return (s || 'x').replace(/[^\w\-]+/g, '_').slice(0, 60) }

async function loginIfNeeded(page) {
  const hasLogin = await page.locator('text=Accesso piattaforma').count()
  if (hasLogin) {
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('Admin123!')
    await page.getByRole('button', { name: 'Accedi' }).click()
    await page.waitForTimeout(1000)
  }
}

async function resetTo(page, area, tab) {
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 8000 })
  } catch {}
  await page.waitForTimeout(300)
  await loginIfNeeded(page)
  if (area) {
    const b = page.getByRole('button', { name: area, exact: true }).first()
    if (await b.count().catch(() => 0)) { await b.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(400) }
  }
  if (tab) {
    const t = page.getByRole('button', { name: tab, exact: true }).first()
    if (await t.count().catch(() => 0)) { await t.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(400) }
  }
}

async function handleDialog(page, area, tab, openerText) {
  const inner = await page.$$eval('[role=dialog] button, [role=dialog] input[type=submit]',
    (els) => els.map((e) => (e.innerText || e.value || e.getAttribute('aria-label') || '').trim()).filter(Boolean))
  for (const itext of inner) {
    if (shouldSkip(itext)) continue
    const errBefore = pageErrors.length
    const consBefore = consoleErrors.length
    const shot = `${SHOTS}/dlg__${safeName(area)}__${safeName(tab)}__${safeName(openerText)}__${safeName(itext)}.png`
    try {
      const loc = page.locator('[role=dialog] button, [role=dialog] input[type=submit]').filter({ hasText: itext }).first()
      await loc.click({ timeout: 4000 })
      await page.waitForTimeout(400)
      await page.screenshot({ path: shot }).catch(() => {})
      const stillOpen = await page.locator('[role=dialog]').count()
      const newErr = pageErrors.slice(errBefore)
      const newCons = consoleErrors.slice(consBefore)
      if (newErr.length || newCons.length) {
        results.push({ area, tab, button: `(${openerText}) » ${itext}`, scope: 'dialog', ok: false, error: (newErr[0] || newCons[0] || '').slice(0, 300), shot })
      } else {
        results.push({ area, tab, button: `(${openerText}) » ${itext}`, scope: 'dialog', ok: true, error: stillOpen ? '(dialog ancora aperto)' : '(dialog chiuso)', shot })
      }
      if (stillOpen) { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(150) }
    } catch (e) {
      try { await page.screenshot({ path: shot }).catch(() => {}) } catch {}
      results.push({ area, tab, button: `(${openerText}) » ${itext}`, scope: 'dialog', ok: false, error: (e?.message || String(e)).split('\n')[0].slice(0, 200), shot })
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(150)
    }
    // salva incrementalmente
    fs.writeFileSync(`${OUT}/crawler-report.json`, JSON.stringify({ partial: true, results }, null, 2))
  }
}

async function main() {
  const onlyAreas = process.env.AREAS ? process.env.AREAS.split(',') : null
  const areas = onlyAreas || Object.keys(AREA_TABS)
  console.log(`[crawler] aree: ${areas.join(', ')}`)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('pageerror', (err) => pageErrors.push(err.message))
  page.on('dialog', async (d) => { dialogsSeen.push(d.message()); await d.dismiss().catch(() => {}) })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await loginIfNeeded(page)
  await page.waitForTimeout(800)
  console.log('[crawler] login OK')

  for (const area of areas) {
    const areaBtn = page.getByRole('button', { name: area, exact: true }).first()
    if (!(await areaBtn.count().catch(() => 0))) {
      results.push({ area, tab: '-', button: '(area non trovata)', scope: 'nav', ok: false, error: 'Area non raggiungibile', shot: '' })
      console.log(`[crawler] area ${area} NON trovata`)
      continue
    }
    await areaBtn.click().catch(() => {})
    await page.waitForTimeout(500)

    const tabs = AREA_TABS[area] || [null]
    for (const tab of tabs) {
      if (tab) {
        const t = page.getByRole('button', { name: tab, exact: true }).first()
        if (await t.count().catch(() => 0)) { await t.click().catch(() => {}); await page.waitForTimeout(400) }
      }

      const locs = page.locator('main button:visible, main input[type=submit]:visible')
      const n = await locs.count()
      console.log(`[crawler] ${area} / ${tab || '-'} : ${n} bottoni in main`)
      for (let i = 0; i < n; i++) {
        const cur = await locs.count()
        if (i >= cur) break
        const text = (await locs.nth(i).innerText().catch(() => '')) || (await locs.nth(i).getAttribute('value').catch(() => '')) || ''
        if (shouldSkip(text)) continue

        const errBefore = pageErrors.length
        const consBefore = consoleErrors.length
        const shot = `${SHOTS}/main__${safeName(area)}__${safeName(tab)}__${safeName(text)}.png`
        try {
          await locs.nth(i).click({ timeout: 4000 })
          await page.waitForTimeout(450)
          const dialogOpen = await page.locator('[role=dialog]').count()
          if (dialogOpen) {
            await page.screenshot({ path: shot }).catch(() => {})
            await handleDialog(page, area, tab, text)
            let guard = 0
            while ((await page.locator('[role=dialog]').count()) && guard < 4) {
              await page.keyboard.press('Escape').catch(() => {})
              await page.waitForTimeout(150); guard++
            }
          }
          const newErr = pageErrors.slice(errBefore)
          const newCons = consoleErrors.slice(consBefore)
          if (newErr.length || newCons.length) {
            results.push({ area, tab, button: text, scope: 'main', ok: false, error: (newErr[0] || newCons[0] || '').slice(0, 300), shot })
            console.log(`  ✗ [${area}/${tab}] "${text}" -> ${(newErr[0] || newCons[0] || '').slice(0, 120)}`)
          } else {
            results.push({ area, tab, button: text, scope: dialogOpen ? 'main->dialog' : 'main', ok: true, error: '', shot })
          }
        } catch (e) {
          try { await page.screenshot({ path: shot }).catch(() => {}) } catch {}
          results.push({ area, tab, button: text, scope: 'main', ok: false, error: (e?.message || String(e)).split('\n')[0].slice(0, 200), shot })
          console.log(`  ✗ click [${area}/${tab}] "${text}" -> ${(e?.message || '').slice(0, 120)}`)
        }
        await resetTo(page, area, tab)
        // salva incrementalmente
        fs.writeFileSync(`${OUT}/crawler-report.json`, JSON.stringify({ partial: true, results, pageErrors, consoleErrors }, null, 2))
      }
    }
  }

  await browser.close()

  const broken = results.filter((r) => !r.ok)
  const passed = results.filter((r) => r.ok)
  const report = {
    total: results.length, passed: passed.length, broken: broken.length,
    dialogsSeen: [...new Set(dialogsSeen)],
    rawPageErrors: pageErrors.slice(0, 60),
    rawConsoleErrors: consoleErrors.slice(0, 60),
    items: results,
  }
  fs.writeFileSync(`${OUT}/crawler-report.json`, JSON.stringify(report, null, 2))
  console.log(`\n=== CRAWLER DONE ===`)
  console.log(`Totale pulsanti testati: ${results.length}`)
  console.log(`OK: ${passed.length} | ROTTI: ${broken.length}`)
  console.log(`\nPULSANTI ROTTI:`)
  for (const b of broken) console.log(` - [${b.area} / ${b.tab}] (${b.scope}) "${b.button}" => ${b.error}`)
}

main().catch((e) => { console.error('CRAWLER FATAL:', e); process.exit(1) })
