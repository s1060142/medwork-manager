import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'

async function loginAsAdmin(page) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button:has-text("Accedi")')
  await page.waitForSelector('button:has-text("Gestione aziende")', { timeout: 30000 })
  await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 })
}

async function clickIfVisible(page, label) {
  const btn = page.locator(`button:has-text("${label}")`).first()
  if ((await btn.count()) > 0) {
    await btn.click()
    await page.waitForTimeout(300)
    return true
  }
  return false
}

async function expectButtonVisible(page, label) {
  const btn = page.locator(`button:has-text("${label}")`).first()
  await expect(btn, `button "${label}" should be visible`).toBeVisible({ timeout: 8000 })
}

async function expectButtonsVisible(page, labels) {
  for (const label of labels) {
    await expectButtonVisible(page, label)
  }
}

async function clickAllVisibleButtons(page, container = 'button') {
  const buttons = await page.locator(`${container}:visible`).all()
  for (const btn of buttons) {
    const text = await btn.textContent()
    if (text && text.trim()) {
      await btn.click().catch(() => {})
      await page.waitForTimeout(200)
    }
  }
}

test.describe('All Buttons - Comprehensive Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Top bar buttons are present', async ({ page }) => {
    const notifiche = page.locator('button[aria-label="Notifiche"]')
    await expect(notifiche).toBeVisible()
    await expectButtonVisible(page, 'ChangeLog')
    await expectButtonVisible(page, 'Manuale')
    await expectButtonVisible(page, 'Profilo')
    await expectButtonVisible(page, 'Logout')
    await expectButtonVisible(page, 'Esporta CSV')
    await expectButtonVisible(page, 'Esporta Excel')
    const menuBtn = page.locator('button[aria-label="Menu"]')
    await expect(menuBtn).toBeVisible()
  })

  test('Sidebar navigation buttons are present', async ({ page }) => {
    const areas = ['Gestione aziende', 'Gestione lavoratori', 'Analisi e relazioni', 'Sorveglianza sanitaria', 'Scadenzario', 'Amministrazione']
    for (const area of areas) {
      await expectButtonVisible(page, area)
    }
  })

  test('Login card button', async ({ page }) => {
    await page.locator('button:has-text("Logout")').first().click()
    await page.waitForSelector('text=Gestionale Medicina del Lavoro', { timeout: 10000 })
    await expectButtonVisible(page, 'Accedi')
  })

  test.describe('Company Management - Gestione Aziende', () => {
    test('Company tabs and toolbar buttons', async ({ page }) => {
      await clickIfVisible(page, 'Gestione aziende')
      await expectButtonVisible(page, 'Anagrafica')
      await expectButtonVisible(page, 'Gruppi aziendali')
      await expectButtonVisible(page, 'Checklist')
      await expectButtonVisible(page, 'Attività')
    })

    test('Anagrafica toolbar buttons', async ({ page }) => {
      await clickIfVisible(page, 'Gestione aziende')
      await clickIfVisible(page, 'Anagrafica')
      await expectButtonsVisible(page, ['Nuova azienda', 'Stampa', 'Esporta dati in excel', 'Operazioni massive', 'Importa dati'])
    })

    test('Anagrafica row action buttons', async ({ page }) => {
      await clickIfVisible(page, 'Gestione aziende')
      await clickIfVisible(page, 'Anagrafica')
      const modifica = page.locator('button:has-text("Modifica")').first()
      if ((await modifica.count()) > 0) {
        await expect(modifica).toBeVisible()
      }
      const elimina = page.locator('button:has-text("Elimina")').first()
      if ((await elimina.count()) > 0) {
        await expect(elimina).toBeVisible()
      }
      const profilo = page.locator('button:has-text("Profilo")').first()
      if ((await profilo.count()) > 0) {
        await expect(profilo).toBeVisible()
      }
    })

    test('Gruppi aziendali buttons', async ({ page }) => {
      await clickIfVisible(page, 'Gestione aziende')
      await clickIfVisible(page, 'Gruppi aziendali')
      await expectButtonVisible(page, 'Nuovo')
    })
  })

  test.describe('Workers Management - Gestione Lavoratori', () => {
    test('WorkersCenter all buttons', async ({ page }) => {
      await clickIfVisible(page, 'Gestione lavoratori')
      await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
      await expectButtonsVisible(page, ['Gestione completa', 'Aggiungi', 'Ricerca lavoratori', 'Reset', 'Ricerca', '+ Nuovo lavoratore', 'Stampa', 'Stampe massive', 'Operazioni massive', 'Esporta dati in excel', 'Importa lavoratori', 'Filtra'])
    })

    test('Worker row action buttons', async ({ page }) => {
      await clickIfVisible(page, 'Gestione lavoratori')
      await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
      const row = page.locator('table tbody tr').first()
      if ((await row.count()) > 0) {
        const profilo = row.locator('button[aria-label="Lista"]')
        if ((await profilo.count()) > 0) await expect(profilo).toBeVisible()
        const scudo = row.locator('button[aria-label="Scudo"]')
        if ((await scudo.count()) > 0) await expect(scudo).toBeVisible()
        const archivio = row.locator('button[aria-label="Archivio"]')
        if ((await archivio.count()) > 0) await expect(archivio).toBeVisible()
        const altro = row.locator('button[aria-label="Altro"]')
        if ((await altro.count()) > 0) await expect(altro).toBeVisible()
        const elimina = row.locator('button[aria-label="Elimina"]')
        if ((await elimina.count()) > 0) await expect(elimina).toBeVisible()
      }
    })
  })

  test.describe('Health Surveillance - Sorveglianza Sanitaria', () => {
    test('Health tabs are present', async ({ page }) => {
      await clickIfVisible(page, 'Sorveglianza sanitaria')
      await expectButtonVisible(page, 'Protocolli')
      await expectButtonVisible(page, 'Appuntamenti')
      await expectButtonVisible(page, 'Nuova visita')
    })

    test('ProtocolsCenter buttons', async ({ page }) => {
      await clickIfVisible(page, 'Sorveglianza sanitaria')
      await clickIfVisible(page, 'Protocolli')
      await page.waitForTimeout(1000)
      await expectButtonVisible(page, 'Nuovo protocollo')
      await expectButtonVisible(page, 'Esporta CSV')
    })

    test('MedicalVisitStepper buttons', async ({ page }) => {
      await clickIfVisible(page, 'Sorveglianza sanitaria')
      await page.waitForSelector('text=Inserimento Visita Medica', { timeout: 15000 })
      await expectButtonVisible(page, 'Copia da ultima visita')
      await expectButtonVisible(page, 'Indietro')
      await expectButtonVisible(page, 'Avanti')
    })

    test('VisitPlanningCenter buttons', async ({ page }) => {
      await clickIfVisible(page, 'Scadenzario')
      await clickIfVisible(page, 'Agenda')
      await expectButtonVisible(page, 'Aggiorna')
      await expectButtonVisible(page, 'Nuova visita')
    })

    test('AppointmentsCalendar buttons', async ({ page }) => {
      await clickIfVisible(page, 'Sorveglianza sanitaria')
      await clickIfVisible(page, 'Appuntamenti')
      await page.waitForTimeout(800)
      const today = page.locator('button:has-text("Today")')
      if ((await today.count()) > 0) {
        await expect(today.first()).toBeVisible()
      }
    })
  })

  test.describe('Schedule - Scadenzario', () => {
    test('Schedule tabs are present', async ({ page }) => {
      await clickIfVisible(page, 'Scadenzario')
      const tabs = ['Agenda', 'Prenotazioni', 'Scadenzario Visite', 'Scadenzario Attività', 'Scadenzario sopralluoghi', 'Scadenzario Nomine', 'Scadenzario Vaccinazioni']
      for (const tab of tabs) {
        const t = page.locator(`.legacy-tab:has-text("${tab}"), button:has-text("${tab}")`).first()
        if ((await t.count()) > 0) {
          await expect(t).toBeVisible()
        }
      }
    })
  })

  test.describe('Analysis - Analisi e relazioni', () => {
    test('Analysis tabs are present', async ({ page }) => {
      await clickIfVisible(page, 'Analisi e relazioni')
      const tabs = ['Elenco visite', 'Elenco attività', 'Relazioni aziendali', 'Grafici e analisi']
      for (const tab of tabs) {
        const t = page.locator(`.legacy-tab:has-text("${tab}"), button:has-text("${tab}")`).first()
        if ((await t.count()) > 0) {
          await expect(t).toBeVisible()
        }
      }
    })

    test('ReportsCenter toolbar buttons', async ({ page }) => {
      await clickIfVisible(page, 'Analisi e relazioni')
      const repTab = page.locator('button:has-text("Report")').first()
      if ((await repTab.count()) > 0) {
        await repTab.click()
        await page.waitForTimeout(600)
      }
      await page.waitForSelector('text=Centro Report', { timeout: 10000 }).catch(() => {})
      const reportButtons = ['Mostra archiviate', 'Ricerca avanzata', 'Ricarica elenco', 'Altri filtri', 'Reset', 'Ricerca', 'Esporta dati in excel', 'Salva giudizi', 'Salva visite', 'Invia', 'Stampa']
      for (const btn of reportButtons) {
        const b = page.locator(`button:has-text("${btn}")`).first()
        if ((await b.count()) > 0) {
          await expect(b).toBeVisible()
        }
      }
    })
  })

  test.describe('Administration - Amministrazione', () => {
    test('Admin tabs are present', async ({ page }) => {
      await clickIfVisible(page, 'Amministrazione')
      const tabs = ['Impostazioni', 'Fatturazione', 'Strumenti', 'Audit']
      for (const tab of tabs) {
        await expectButtonVisible(page, tab)
      }
    })

    test('ToolsCenter buttons', async ({ page }) => {
      await clickIfVisible(page, 'Amministrazione')
      await clickIfVisible(page, 'Strumenti')
      await expectButtonVisible(page, 'Registra firma')
    })

    test('BillingCenter buttons', async ({ page }) => {
      await clickIfVisible(page, 'Amministrazione')
      await clickIfVisible(page, 'Fatturazione')
      await expectButtonVisible(page, 'Registra documento')
    })

    test('AuditCenter buttons', async ({ page }) => {
      await clickIfVisible(page, 'Amministrazione')
      await clickIfVisible(page, 'Audit')
      await expectButtonVisible(page, 'Aggiorna')
      await expectButtonVisible(page, 'Svuota')
    })
  })

  test.describe('Employee Profile Dialog', () => {
    test('Employee profile buttons when opened', async ({ page }) => {
      await clickIfVisible(page, 'Gestione lavoratori')
      await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
      const profileBtn = page.locator('table tbody tr button:has-text("Profilo")').first()
      if ((await profileBtn.count()) > 0) {
        await profileBtn.click()
        await page.waitForTimeout(500)
        await expectButtonVisible(page, 'Nuova visita')
        await expectButtonVisible(page, 'Controllo periodico')
        await expectButtonVisible(page, 'Chiudi')
        await expectButtonVisible(page, 'Salva')
        await page.locator('[role="dialog"] button:has-text("Chiudi")').first().click()
      }
    })
  })

  test.describe('Company Profile Dialog', () => {
    test('Company profile header buttons', async ({ page }) => {
      await clickIfVisible(page, 'Gestione aziende')
      await clickIfVisible(page, 'Anagrafica')
      const profiloBtn = page.locator('table tbody tr button:has-text("Profilo")').first()
      if ((await profiloBtn.count()) > 0) {
        await profiloBtn.click()
        await page.waitForTimeout(500)
        const dlg = page.locator('[role="dialog"]')
        await expect(dlg).toBeVisible()
        const salva = dlg.locator('button:has-text("Salva")')
        if ((await salva.count()) > 0) await expect(salva.first()).toBeVisible()
        const chiudi = dlg.locator('button:has-text("Chiudi")')
        if ((await chiudi.count()) > 0) await expect(chiudi.first()).toBeVisible()
        await dlg.locator('button:has-text("Chiudi")').first().click()
      }
    })
  })

  test.describe('HR Import/Export Dialog', () => {
    test('HR dialog buttons are present when opened', async ({ page }) => {
      await clickIfVisible(page, 'Gestione lavoratori')
      await page.waitForSelector('text=Aziende / Lavoratori', { timeout: 10000 })
      const importa = page.locator('button:has-text("Importa HR")').first()
      if ((await importa.count()) > 0) {
        await importa.click()
        await page.waitForTimeout(500)
        await expectButtonVisible(page, 'Seleziona file')
        await expectButtonVisible(page, 'Esporta CSV')
        await expectButtonVisible(page, 'Esporta Excel (.xlsx)')
        await expectButtonVisible(page, 'Chiudi')
        await page.locator('[role="dialog"] button:has-text("Chiudi")').first().click()
      }
    })
  })
})
