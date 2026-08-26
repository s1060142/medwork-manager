import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://127.0.0.1:5173'
const OUT = 'dogfood-output'
const SHOTS = `${OUT}/screenshots-v2`
fs.mkdirSync(SHOTS, { recursive: true })

const results = []
let pageErrors = []
let consoleErrors = []

const SKIP_EXACT = new Set(['Logout', 'Esci', 'Accedi', 'Login', 'Menu', 'Notifiche', 'ChangeLog', 'Manuale', 'Profilo'])
const SKIP_CONTAINS = ['Esporta CSV', 'Esporta Excel', 'Importa HR', 'Elimina', 'Cancella', 'Rimuovi', 'Operazioni massive', 'Importa dati']

function shouldSkip(t) {
  if (!t) return true
  const x = t.trim()
  if (SKIP_EXACT.has(x)) return true
  return SKIP_CONTAINS.some(s => x.toLowerCase().includes(s.toLowerCase()))
}

const AREA_TABS = {
  'Gestione aziende': ['Gruppi aziendali', 'Anagrafica', 'Checklist', 'Attività'],
  'Gestione lavoratori': ['Elenco', 'Gruppi', 'Import/Export'],
  'Analisi e relazioni': ['Elenco visite', 'Elenco attività', 'Relazioni aziendali', 'Grafici e analisi'],
  'Sorveglianza sanitaria': ['Protocolli', 'Appuntamenti', 'Nuova visita'],
  'Scadenzario': ['Agenda', 'Prenotazioni', 'Scadenzario Visite', 'Scadenzario Attività', 'Scadenzario Sopralluoghi', 'Scadenzario Nomine', 'Scadenzario Vaccinazioni'],
  'Amministrazione': ['Impostazioni', 'Fatturazione', 'Strumenti', 'Audit'],
}
const safe = s => (s || 'x').replace(/[^\w\-]+/g, '_').slice(0, 60)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', e => pageErrors.push(e.message))
page.on('dialog', async d => { await d.dismiss().catch(() => {}) })

await page.goto(BASE, { waitUntil: 'networkidle' })
const hasLogin = await page.locator('text=Accesso piattaforma').count()
if (hasLogin) {
  await page.getByLabel('Username').fill('admin')
  await page.getByLabel('Password').fill('Admin123!')
  await page.getByRole('button', { name: 'Accedi' }).click()
  await page.waitForTimeout(1000)
}

const onlyAreas = process.env.AREAS ? process.env.AREAS.split(',') : Object.keys(AREA_TABS)
console.log('[crawler-v2] aree:', onlyAreas.join(', '))

for (const area of onlyAreas) {
  const areaBtn = page.getByRole('button', { name: area, exact: true }).first()
  if (!(await areaBtn.count())) { console.log(`area ${area} assente`); continue }
  await areaBtn.click().catch(() => {})
  await page.waitForTimeout(500)
  const tabs = AREA_TABS[area] || [null]
  for (const tab of tabs) {
    if (tab) {
      const t = page.getByRole('button', { name: tab, exact: true }).first()
      if (await t.count()) { await t.click().catch(() => {}); await page.waitForTimeout(400) }
    }

    // snapshot testi bottoni nel main
    const locs = page.locator('main button:visible, main input[type=submit]:visible')
    const texts = await locs.evaluateAll(els => els.map(e => (e.innerText || e.value || e.getAttribute('aria-label') || '').trim()))
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]
      if (shouldSkip(text)) continue
      const cur = await locs.count()
      if (i >= cur) break
      const errBefore = pageErrors.length
      const consBefore = consoleErrors.length
      const shot = `${SHOTS}/${safe(area)}__${safe(tab)}__${safe(text)}.png`
      try {
        await locs.nth(i).click({ timeout: 4000 })
        await page.waitForTimeout(700)
        const dialogOpen = await page.locator('[role=dialog]').count()
        if (dialogOpen) {
          await page.screenshot({ path: shot }).catch(() => {})
          // cattura testi bottoni interni al dialog
          const innerTexts = await page.locator('[role=dialog] button, [role=dialog] input[type=submit]')
            .evaluateAll(els => els.map(e => (e.innerText || e.value || e.getAttribute('aria-label') || '').trim()).filter(Boolean))
          for (const it of innerTexts) {
            if (shouldSkip(it)) continue
            const innerShot = `${SHOTS}/dlg__${safe(area)}__${safe(tab)}__${safe(text)}__${safe(it)}.png`
            // re-apri il dialog (potrebbe essersi chiuso dopo il primo click)
            // usa un solo passaggio: clicca l'i-esimo bottone interno; se fallisce, log
            const innerLocs = page.locator('[role=dialog] button, [role=dialog] input[type=submit]')
            const innerCount = await innerLocs.count()
            // trova l'indice che ha il testo it
            let innerIdx = -1
            for (let k = 0; k < innerCount; k++) {
              const t = await innerLocs.nth(k).evaluate(el => (el.innerText || el.value || el.getAttribute('aria-label') || '').trim())
              if (t === it) { innerIdx = k; break }
            }
            if (innerIdx < 0) continue
            const errB = pageErrors.length
            const consB = consoleErrors.length
            try {
              await innerLocs.nth(innerIdx).click({ timeout: 5000 })
              await page.waitForTimeout(500)
              await page.screenshot({ path: innerShot }).catch(() => {})
              const stillOpen = await page.locator('[role=dialog]').count()
              const newErr = pageErrors.slice(errB)
              const newCons = consoleErrors.slice(consB)
              if (newErr.length || newCons.length) {
                results.push({ area, tab, button: `(${text}) » ${it}`, scope: 'dialog', ok: false, error: (newErr[0] || newCons[0] || '').slice(0, 300), shot: innerShot })
              } else {
                results.push({ area, tab, button: `(${text}) » ${it}`, scope: 'dialog', ok: true, error: stillOpen ? '(dialog ancora aperto)' : '(dialog chiuso)', shot: innerShot })
              }
              // se il dialog si è chiuso, riaprilo
              if (!stillOpen) {
                // riprova a cliccare il bottone principale
                const stillMainCount = await locs.count()
                if (i < stillMainCount) { await locs.nth(i).click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(500) }
              }
            } catch (e) {
              try { await page.screenshot({ path: innerShot }).catch(() => {}) } catch {}
              results.push({ area, tab, button: `(${text}) » ${it}`, scope: 'dialog', ok: false, error: (e?.message || '').split('\n')[0].slice(0, 200), shot: innerShot })
            }
            // chiudi
            let guard = 0
            while ((await page.locator('[role=dialog]').count()) && guard < 4) {
              await page.keyboard.press('Escape').catch(() => {})
              await page.waitForTimeout(150); guard++
            }
          }
        } else {
          await page.screenshot({ path: shot }).catch(() => {})
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
        results.push({ area, tab, button: text, scope: 'main', ok: false, error: (e?.message || '').split('\n')[0].slice(0, 200), shot })
        console.log(`  ✗ click [${area}/${tab}] "${text}" -> ${(e?.message || '').slice(0, 120)}`)
      }
      // reset pulito
      await page.goto(BASE, { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForTimeout(300)
      if (await page.locator('text=Accesso piattaforma').count()) {
        await page.getByLabel('Username').fill('admin')
        await page.getByLabel('Password').fill('Admin123!')
        await page.getByRole('button', { name: 'Accedi' }).click()
        await page.waitForTimeout(800)
      }
      if (area) { await page.getByRole('button', { name: area, exact: true }).first().click().catch(() => {}); await page.waitForTimeout(400) }
      if (tab) { await page.getByRole('button', { name: tab, exact: true }).first().click().catch(() => {}); await page.waitForTimeout(400) }
      // salva incrementale
      fs.writeFileSync(`${OUT}/crawler-v2.json`, JSON.stringify({ partial: true, results, pageErrors, consoleErrors }, null, 2))
    }
  }
}

await browser.close()
const broken = results.filter(r => !r.ok)
const passed = results.filter(r => r.ok)
fs.writeFileSync(`${OUT}/crawler-v2.json`, JSON.stringify({ total: results.length, passed: passed.length, broken: broken.length, rawPageErrors: pageErrors.slice(0, 60), rawConsoleErrors: consoleErrors.slice(0, 60), items: results }, null, 2))
console.log(`\n=== CRAWLER V2 DONE ===`)
console.log(`Totale: ${results.length} | OK: ${passed.length} | ROTTI: ${broken.length}`)
console.log(`\nPULSANTI ROTTI:`)
for (const b of broken) console.log(` - [${b.area} / ${b.tab}] (${b.scope}) "${b.button}" => ${b.error}`)
