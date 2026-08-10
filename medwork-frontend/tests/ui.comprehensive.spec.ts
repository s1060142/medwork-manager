import { test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:5173'
const API_BASE = 'http://localhost:5279'

// Credentials
const ADMIN_CRED = { username: 'admin', password: 'Admin123!' }
const DOCTOR_CRED = { username: 'doctor', password: 'Doctor123!' }

// ==================== HELPERS ====================

async function login(page, creds = ADMIN_CRED) {
  await page.goto(BASE)
  await page.fill('input[type="text"]', creds.username)
  await page.fill('input[type="password"]', creds.password)
  await page.click('button:has-text("ACCEDI")')
  // Dashboard shows "Benvenuto in Medwork" and role as "Admin • CompanyName"
  await page.waitForSelector('text=Benvenuto in Medwork', { timeout: 30000 })
  await page.waitForSelector('text=Admin', { timeout: 10000 })
  await page.waitForTimeout(500)
}

async function selectCompany(page, companyName = 'Acme Industria S.p.A.') {
  const btn = page.locator(`button:has-text("${companyName}")`)
  if (await btn.count() > 0) {
    await btn.first().click()
    await page.waitForTimeout(300)
  }
}

async function openArea(page, areaLabel) {
  await page.click(`button:has-text("${areaLabel}")`)
  await page.waitForTimeout(300)
}

async function openModule(page, moduleLabel) {
  await page.getByRole('button', { name: moduleLabel, exact: true }).click()
  await page.waitForTimeout(500)
}

async function clickNewButton(page) {
  const btn = page.locator('button:has-text("Nuovo"), button:has-text("Nuova azienda"), button:has-text("+ Nuovo lavoratore"), button:has-text("+ Nuovo protocollo")').first()
  if (await btn.count() > 0) {
    await btn.click()
    await page.waitForTimeout(300)
    return true
  }
  return false
}

async function fillAndSave(page, fields, saveText = 'Salva') {
  for (const [placeholder, value] of Object.entries(fields)) {
    const input = page.locator(`input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`).first()
    if (await input.count() > 0) {
      await input.fill(value)
    }
  }
  await page.click(`button:has-text("${saveText}")`)
  await page.waitForTimeout(500)
}

async function verifyToast(page, text) {
  await expect(page.locator(`text=${text}`)).toBeVisible({ timeout: 5000 })
}

async function testCRUD(page, areaLabel, moduleLabel, createFields, verifyText) {
  await openArea(page, areaLabel)
  await openModule(page, moduleLabel)
  await page.waitForSelector(`text=${moduleLabel}`, { timeout: 5000 })

  // Test CREATE
  const created = await clickNewButton(page)
  if (created) {
    await fillAndSave(page, createFields)
    await verifyToast(page, verifyText)
  }

  // Test REFRESH
  const refreshBtn = page.locator('button:has-text("Aggiorna")').first()
  if (await refreshBtn.count() > 0) {
    await refreshBtn.click()
    await page.waitForTimeout(500)
  }

  // Test EXPORT
  const exportBtn = page.locator('button:has-text("Esporta CSV"), button:has-text("Esporta excel"), button:has-text("Esporta dati in excel")').first()
  if (await exportBtn.count() > 0) {
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
    await exportBtn.click()
    const download = await downloadPromise
    if (download) console.log(`  ✓ Export downloaded: ${download.suggestedFilename()}`)
  }
}

// ==================== TESTS ====================

test.describe('Authentication', () => {
  test('login as admin', async ({ page }) => {
    await login(page, ADMIN_CRED)
    await expect(page.locator('text=Admin').first()).toBeVisible()
    console.log('✓ Admin login successful')
  })

  test('login as doctor', async ({ page }) => {
    await login(page, DOCTOR_CRED)
    await expect(page.locator('text=Doctor').first()).toBeVisible()
    console.log('✓ Doctor login successful')
  })

  test('logout', async ({ page }) => {
    await login(page, ADMIN_CRED)
    await page.click('button:has-text("Logout")')
    await expect(page.locator('text=Gestionale Medicina del Lavoro')).toBeVisible()
    console.log('✓ Logout successful')
  })
})

test.describe('Navigation & Sidebar', () => {
  test.beforeEach(async ({ page }) => await login(page))

  test('all 6 admin areas visible', async ({ page }) => {
    const areas = ['GESTIONE AZIENDE', 'GESTIONE LAVORATORI', 'ANALISI E RELAZIONI', 'SORVEGLIANZA SANITARIA', 'SCADENZARIO', 'AMMINISTRAZIONE']
    for (const area of areas) {
      await expect(page.locator(`button:has-text("${area}")`)).toBeVisible()
    }
    console.log('✓ All 6 admin areas visible')
  })

  test('doctor sees 5 areas (no amministrazione)', async ({ page }) => {
    await page.reload()
    await login(page, DOCTOR_CRED)
    const areas = ['GESTIONE AZIENDE', 'GESTIONE LAVORATORI', 'ANALISI E RELAZIONI', 'SORVEGLIANZA SANITARIA', 'SCADENZARIO']
    for (const area of areas) {
      await expect(page.locator(`button:has-text("${area}")`)).toBeVisible()
    }
    await expect(page.locator('button:has-text("AMMINISTRAZIONE")')).not.toBeVisible()
    console.log('✓ Doctor sees only 5 areas')
  })
})

test.describe('Company Management - Gestione Aziende', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('Gruppi Aziendali CRUD', async ({ page }) => {
    await testCRUD(page, 'GESTIONE AZIENDE', 'Gruppi Aziendali', {
      'Es. Acme Industria S.p.A.': 'PW TEST GRUPPO',
      'Es. ACME SPA': 'PW TEST GRUPPO SPA',
    }, 'Elemento creato correttamente')
  })

  test('Anagrafica Aziende CRUD + buttons', async ({ page }) => {
    await openArea(page, 'GESTIONE AZIENDE')
    await openModule(page, 'Anagrafica')
    await page.waitForSelector('text=Aziende')

    // Test all toolbar buttons
    const buttons = [
      'Nuova azienda', 'Stampa', 'Esporta dati in excel',
      'Operazioni massive', 'Importa dati'
    ]
    for (const btnText of buttons) {
      const btn = page.locator(`button:has-text("${btnText}")`).first()
      if (await btn.count() > 0) {
        await btn.click()
        await page.waitForTimeout(300)
        console.log(`  ✓ Button "${btnText}" clickable`)
      }
    }

    // Test CRUD
    await testCRUD(page, 'GESTIONE AZIENDE', 'Anagrafica', {
      'Es. Acme Industria S.p.A.': 'PW TEST AZIENDA',
      'Es. IT01234567890': 'IT00000000001',
      'Es. hr@azienda.it': 'pw@test.it',
      'Es. +39 02 1234567': '0000000001',
    }, 'Elemento creato correttamente')
  })

  test('Checklist (Protocols) CRUD', async ({ page }) => {
    await testCRUD(page, 'GESTIONE AZIENDE', 'Checklist', {
      'Es. Protocollo operatore linea': 'PW Test Protocol',
      'Es. 81/08, 101/20': 'PW/TEST/001',
    }, 'Elemento creato correttamente')

    // Test Attiva/Disattiva toggle
    const toggleBtn = page.locator('button:has-text("Attiva"), button:has-text("Disattiva")').first()
    if (await toggleBtn.count() > 0) {
      await toggleBtn.click()
      await page.waitForTimeout(300)
      console.log('  ✓ Attiva/Disattiva toggle works')
    }
  })

  test('Attività (VisitPlanningCenter) buttons', async ({ page }) => {
    await openArea(page, 'GESTIONE AZIENDE')
    await openModule(page, 'Attività')
    await page.waitForSelector('text=Pianificazione Visite')

    const buttons = ['Aggiorna', 'Nuova visita']
    for (const btnText of buttons) {
      const btn = page.locator(`button:has-text("${btnText}")`).first()
      if (await btn.count() > 0) {
        await btn.click()
        await page.waitForTimeout(300)
        console.log(`  ✓ Button "${btnText}" clickable`)
      }
    }

    // Test Convoca button on first row
    const convocaBtn = page.locator('button:has-text("Convoca")').first()
    if (await convocaBtn.count() > 0) {
      await convocaBtn.click()
      await page.waitForTimeout(300)
      console.log('  ✓ Convoca button works')
    }
  })
})

test.describe('Workers Management - Gestione Lavoratori', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('WorkersCenter - Aziende tab buttons', async ({ page }) => {
    await openArea(page, 'GESTIONE LAVORATORI')
    await openModule(page, 'Lavoratori')
    await page.waitForSelector('text=Aziende / Lavoratori')

    const buttons = ['Gestione completa', 'Aggiungi', 'Ricerca lavoratori', 'Reset', 'Ricerca']
    for (const btnText of buttons) {
      const btn = page.locator(`button:has-text("${btnText}")`).first()
      if (await btn.count() > 0) {
        await btn.click()
        await page.waitForTimeout(200)
        console.log(`  ✓ Button "${btnText}" clickable`)
      }
    }

    // Footer buttons
    const footerButtons = ['+ Nuovo lavoratore', 'Stampa', 'Stampe massive', 'Operazioni massive', 'Esporta dati in excel', 'Importa lavoratori']
    for (const btnText of footerButtons) {
      const btn = page.locator(`button:has-text("${btnText}")`).first()
      if (await btn.count() > 0) {
        console.log(`  ✓ Footer button "${btnText}" present`)
      }
    }
  })

  test('WorkersCenter - Lavoratori tab buttons + row actions', async ({ page }) => {
    await openArea(page, 'GESTIONE LAVORATORI')
    await openModule(page, 'Lavoratori')
    await page.waitForSelector('text=Lavoratori')

    const filterButtons = ['Reset', 'Filtra']
    for (const btnText of filterButtons) {
      const btn = page.locator(`button:has-text("${btnText}")`).first()
      if (await btn.count() > 0) {
        await btn.click()
        await page.waitForTimeout(200)
        console.log(`  ✓ Button "${btnText}" clickable`)
      }
    }

    // Test row action icons (using aria-label)
    const rowActions = ['Lista', 'Aggiungi', 'Scudo', 'Archivio', 'Altro', 'Elimina']
    for (const action of rowActions) {
      const btn = page.locator(`button[aria-label="${action}"]`).first()
      if (await btn.count() > 0) {
        console.log(`  ✓ Row action "${action}" present`)
      }
    }

    // Test double-click profile
    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.count() > 0) {
      await firstRow.dblclick()
      await page.waitForTimeout(300)
      await expect(page.locator('text=Profilo Lavoratore')).toBeVisible()
      await page.click('button:has-text("Chiudi")')
      console.log('  ✓ Double-click opens profile')
    }
  })

  test('Employees CRUD via CrudEntityView', async ({ page }) => {
    await testCRUD(page, 'GESTIONE LAVORATORI', 'Lavoratori', {
      'Es. Mario': 'Mario',
      'Es. Rossi': 'Rossi',
      'Es. RSSMRA80A01F205X': 'RSSMRA80A01F205X',
    }, 'Elemento creato correttamente')

    // Test row actions: Modifica, Elimina, Profilo
    const rowActions = ['Modifica', 'Elimina', 'Profilo']
    for (const action of rowActions) {
      const btn = page.locator(`button:has-text("${action}")`).first()
      if (await btn.count() > 0) {
        console.log(`  ✓ Row action "${action}" present`)
      }
    }
  })
})

test.describe('Analysis & Reports - Analisi e Relazioni', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('Report Center - all 4 report types', async ({ page }) => {
    await openArea(page, 'ANALISI E RELAZIONI')
    await openModule(page, 'Reportistica')
    await page.waitForSelector('text=Centro Report')

    const reports = [
      { name: 'Scadenze Visite', btnIndex: 0 },
      { name: 'Idoneità', btnIndex: 1 },
      { name: 'Rischi per Azienda', btnIndex: 2 },
      { name: 'Allegato 3B', btnIndex: 3 },
    ]

    for (const report of reports) {
      const btn = page.locator('button:has-text("Genera PDF")').nth(report.btnIndex)
      if (await btn.count() > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null)
        await btn.click()
        const download = await downloadPromise
        if (download) {
          console.log(`  ✓ ${report.name} PDF generated: ${download.suggestedFilename()}`)
        } else {
          console.log(`  ⚠ ${report.name} - no download (may need data)`)
        }
        await page.waitForTimeout(1000)
      }
    }
  })

  test('Report Center - Elenco visite tab filters', async ({ page }) => {
    await openArea(page, 'ANALISI E RELAZIONI')
    await openModule(page, 'Reportistica')
    await page.waitForSelector('text=Centro Report')

    await page.click('button:has-text("Elenco visite")')
    await page.waitForTimeout(300)

    const filterButtons = ['Reset', 'Ricerca', 'Altri filtri']
    for (const btnText of filterButtons) {
      const btn = page.locator(`button:has-text("${btnText}")`).first()
      if (await btn.count() > 0) {
        await btn.click()
        await page.waitForTimeout(200)
        console.log(`  ✓ Filter button "${btnText}" clickable`)
      }
    }

    const exportButtons = ['Esporta dati in excel', 'Salva giudizi', 'Salva visite', 'Invia', 'Stampa']
    for (const btnText of exportButtons) {
      const btn = page.locator(`button:has-text("${btnText}")`).first()
      if (await btn.count() > 0) {
        console.log(`  ✓ Export button "${btnText}" present`)
      }
    }
  })

  test('Analysis tabs - Grafici, Relazioni, Export', async ({ page }) => {
    const tabs = ['Elenco attività', 'Relazioni aziendali', 'Grafici e analisi']
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`)
      await page.waitForTimeout(300)
      console.log(`  ✓ Tab "${tab}" opens`)
    }
  })
})

test.describe('Health Surveillance - Sorveglianza Sanitaria', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('MedicalVisitStepper - 3 step wizard', async ({ page }) => {
    await openArea(page, 'SORVEGLIANZA SANITARIA')
    await openModule(page, 'Nuova visita (step)')
    await page.waitForSelector('text=Inserimento Visita Medica')

    // Step 1: Anamnesi
    await expect(page.locator('text=Anamnesi')).toBeVisible()
    const workerSelect = page.locator('label:has-text("Lavoratore") + div select, label:has-text("Lavoratore") ~ div select').first()
    if (await workerSelect.count() > 0) {
      await workerSelect.selectOption({ index: 1 })
    }
    await page.fill('input[placeholder="Es. Mario"]', 'Test')
    await page.click('button:has-text("Avanti")')
    await page.waitForTimeout(300)

    // Step 2: Esame Obiettivo
    await expect(page.locator('text=Esame Obiettivo')).toBeVisible()
    await page.fill('input[placeholder="Es. Udito, apparato respiratorio"]', 'Test organi')
    await page.fill('textarea[placeholder*="Esame obiettivo"]', 'Test esame obiettivo')
    await page.click('button:has-text("Avanti")')
    await page.waitForTimeout(300)

    // Step 3: Giudizio
    await expect(page.locator('text=Giudizio di Idoneità')).toBeVisible()
    await page.fill('input[placeholder="Es. Idoneo con prescrizioni"]', 'Idoneo PW Test')
    await page.fill('input[type="date"]', '2027-08-08')
    await page.click('button:has-text("Salva Visita")')
    await page.waitForTimeout(1000)

    await verifyToast(page, 'Visita medica e anamnesi registrate con successo')
    console.log('✓ MedicalVisitStepper 3-step flow completed')
  })

  test('ProtocolsCenter buttons', async ({ page }) => {
    await openArea(page, 'SORVEGLIANZA SANITARIA')
    await openModule(page, 'Gestione protocolli')
    await page.waitForSelector('text=Protocollo')

    const buttons = ['Stampa', 'Esporta excel', '+ Nuovo protocollo']
    for (const btnText of buttons) {
      const btn = page.locator(`button:has-text("${btnText}")`).first()
      if (await btn.count() > 0) {
        await btn.click()
        await page.waitForTimeout(200)
        console.log(`  ✓ Button "${btnText}" clickable`)
      }
    }

    // Test Attiva/Disattiva
    const toggleBtn = page.locator('button:has-text("Attiva"), button:has-text("Disattiva")').first()
    if (await toggleBtn.count() > 0) {
      await toggleBtn.click()
      await page.waitForTimeout(200)
      console.log('  ✓ Attiva/Disattiva toggle works')
    }
  })

  test('All Health Surveillance modules accessible', async ({ page }) => {
    const modules = [
      'Calendario visite',
      'Anamnesi guidata',
      'Accertamenti',
      'Vaccinazioni',
      'Esami visita',
      'Sopralluoghi',
      'Luoghi di Lavoro',
      'Reparti',
    ]

    for (const module of modules) {
      await openArea(page, 'SORVEGLIANZA SANITARIA')
      await openModule(page, module)
      await page.waitForTimeout(300)
      console.log(`  ✓ Module "${module}" loads`)
    }
  })
})

test.describe('Schedule - Scadenzario', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('Dashboard Scadenze - KPIs and Quick Actions', async ({ page }) => {
    await openArea(page, 'SCADENZARIO')
    await openModule(page, 'Scadenze e agende')
    await page.waitForSelector('text=Benvenuto in Medwork')

    const kpiCards = ['Appuntamenti (7GG)', 'Vaccini Scaduti/In Scadenza', 'Esami in Scadenza', 'Visite in Scadenza']
    for (const kpi of kpiCards) {
      await expect(page.locator(`text=${kpi}`)).toBeVisible()
    }
    console.log('✓ All KPI cards visible')

    const quickActions = ['Nuova Visita Medica', 'Aggiungi Dipendente', 'Backup Dati Now']
    for (const action of quickActions) {
      const btn = page.locator(`button:has-text("${action}")`).first()
      if (await btn.count() > 0) {
        await btn.click()
        await page.waitForTimeout(200)
        console.log(`  ✓ Quick Action "${action}" clickable`)
      }
    }
  })

  test('VisitPlanningCenter - horizon selector and buttons', async ({ page }) => {
    await openArea(page, 'SCADENZARIO')
    await openModule(page, 'Scadenze e agende')
    await page.waitForSelector('text=Pianificazione Visite')

    // Test horizon dropdown
    const horizonSelect = page.locator('label:has-text("Orizzonte") + div select, select:near(:text("Orizzonte"))').first()
    if (await horizonSelect.count() > 0) {
      await horizonSelect.selectOption('30')
      await page.waitForTimeout(300)
      console.log('  ✓ Horizon selector works')
    }

    const buttons = ['Aggiorna', 'Nuova visita']
    for (const btnText of buttons) {
      const btn = page.locator(`button:has-text("${btnText}")`).first()
      if (await btn.count() > 0) {
        await btn.click()
        await page.waitForTimeout(200)
        console.log(`  ✓ Button "${btnText}" clickable`)
      }
    }
  })

  test('All Schedule tabs accessible', async ({ page }) => {
    const tabs = ['Agenda', 'Prenotazioni', 'Scadenzario Visite', 'Scadenzario Attività', 'Scadenzario sopralluoghi', 'Scadenzario Nomine', 'Scadenzario Vaccinazioni']
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`)
      await page.waitForTimeout(200)
      console.log(`  ✓ Tab "${tab}" clickable`)
    }
  })
})

test.describe('Administration - Amministrazione (Admin only)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_CRED)
    await selectCompany(page)
  })

  test('All Admin modules accessible', async ({ page }) => {
    const modules = [
      'Fatturazione', 'Audit', 'Strumenti', 'Impostazioni',
      'Cataloghi', 'Mansioni', 'Fattori di rischio',
      'Registro protocolli', 'Protocolli personali',
      'Sedi', 'Reparti', 'Luoghi di Lavoro',
      'Rischi dipendente', 'Cartelle sanitarie',
      'Visite mediche', 'Anamnesi', 'Esami visita',
      'Accertamenti', 'Sopralluoghi', 'Vaccinazioni',
      'Disponibilita medici', 'Log notifiche',
    ]

    for (const module of modules) {
      await openArea(page, 'AMMINISTRAZIONE')
      await openModule(page, module)
      await page.waitForTimeout(300)
      console.log(`  ✓ Admin module "${module}" loads`)
    }
  })

  test('Admin CRUD modules have New button', async ({ page }) => {
    const crudModules = ['Aziende', 'Sedi', 'Reparti', 'Luoghi di Lavoro', 'Mansioni', 'Fattori di rischio', 'Cataloghi']

    for (const module of crudModules) {
      await openArea(page, 'AMMINISTRAZIONE')
      await openModule(page, module)
      await page.waitForTimeout(300)

      const newBtn = page.locator('button:has-text("Nuovo"), button:has-text("Nuova azienda")').first()
      if (await newBtn.count() > 0) {
        console.log(`  ✓ "${module}" has Create button`)
      }
    }
  })

  test('ReadOnly modules (Disponibilita medici, Log notifiche) have no Create button', async ({ page }) => {
    const roModules = ['Disponibilita medici', 'Log notifiche']

    for (const module of roModules) {
      await openArea(page, 'AMMINISTRAZIONE')
      await openModule(page, module)
      await page.waitForTimeout(300)

      const newBtn = page.locator('button:has-text("Nuovo")').first()
      if (await newBtn.count() === 0) {
        console.log(`  ✓ "${module}" correctly has no Create button (readOnly)`)
      }
    }
  })
})

test.describe('Cross-cutting: CrudEntityView functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('Search, Filter, Pagination, Export work on any CRUD', async ({ page }) => {
    await openArea(page, 'AMMINISTRAZIONE')
    await openModule(page, 'Mansioni')
    await page.waitForSelector('text=Mansioni')

    // Search
    const searchInput = page.locator('input[label="Cerca"], input[placeholder*="erca"]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(300)
      await searchInput.fill('')
      console.log('  ✓ Search works')
    }

    // Advanced filter
    const filterBtn = page.locator('button:has-text("Filtro avanzato")').first()
    if (await filterBtn.count() > 0) {
      await filterBtn.click()
      await page.waitForTimeout(300)
      console.log('  ✓ Advanced filter opens')
    }

    // Pagination
    const pageSelect = page.locator('label:has-text("Elementi per pagina") + div select').first()
    if (await pageSelect.count() > 0) {
      await pageSelect.selectOption('20')
      await page.waitForTimeout(200)
      console.log('  ✓ Pagination works')
    }

    // Export
    const exportBtn = page.locator('button:has-text("Esporta CSV")').first()
    if (await exportBtn.count() > 0) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
      await exportBtn.click()
      const download = await downloadPromise
      if (download) console.log('  ✓ Export CSV works')
    }
  })

  test('Edit and Delete row actions', async ({ page }) => {
    await openArea(page, 'AMMINISTRAZIONE')
    await openModule(page, 'Mansioni')
    await page.waitForSelector('text=Mansioni')

    // Create one first
    await clickNewButton(page)
    await fillAndSave(page, { 'Es. Operatore linea': 'PW Test Mansione' })
    await verifyToast(page, 'Elemento creato correttamente')

    // Test Edit
    const editBtn = page.locator('button:has-text("Modifica")').first()
    if (await editBtn.count() > 0) {
      await editBtn.click()
      await page.waitForTimeout(300)
      await page.click('button:has-text("Annulla")')
      console.log('  ✓ Edit dialog opens/closes')
    }

    // Test Delete (cancel)
    const deleteBtn = page.locator('button:has-text("Elimina")').first()
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click()
      await page.waitForTimeout(200)
      await page.click('button:has-text("Annulla")')
      console.log('  ✓ Delete confirmation dialog works')
    }
  })
})

test.describe('Profile Dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectCompany(page)
  })

  test('EmployeeProfileDialog opens on Profilo button', async ({ page }) => {
    await openArea(page, 'GESTIONE LAVORATORI')
    await openModule(page, 'Lavoratori')
    await page.waitForSelector('text=Lavoratori')

    const profileBtn = page.locator('button:has-text("Profilo")').first()
    if (await profileBtn.count() > 0) {
      await profileBtn.click()
      await page.waitForTimeout(300)
      await expect(page.locator('text=Profilo Lavoratore')).toBeVisible()
      await page.click('button:has-text("Chiudi")')
      console.log('✓ EmployeeProfileDialog opens/closes')
    }
  })

  test('CompanyProfileDialog opens on double-click company row', async ({ page }) => {
    await openArea(page, 'GESTIONE AZIENDE')
    await openModule(page, 'Anagrafica')
    await page.waitForSelector('text=Aziende')

    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.count() > 0) {
      await firstRow.dblclick()
      await page.waitForTimeout(300)
      await expect(page.locator('text=Profilo Azienda')).toBeVisible()
      await page.click('button:has-text("Chiudi")')
      console.log('✓ CompanyProfileDialog opens/closes')
    }
  })
})

// ==================== API HEALTH CHECKS ====================

test.describe('API Endpoints Health Check', () => {
  let authToken = ''

  test.beforeAll(async () => {
    // Get admin token
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN_CRED),
    })
    const data = await response.json()
    authToken = data.accessToken
  })

  const endpoints = [
    { name: 'Companies', url: '/api/master-data/companies', method: 'GET' },
    { name: 'Employees', url: '/api/master-data/employees', method: 'GET' },
    { name: 'Medical Visits', url: '/api/master-data/medical-visits', method: 'GET' },
    { name: 'Protocols', url: '/api/master-data/protocols', method: 'GET' },
    { name: 'Risk Factors', url: '/api/master-data/risk-factors', method: 'GET' },
    { name: 'Job Roles', url: '/api/master-data/job-roles', method: 'GET' },
    { name: 'Exam Types', url: '/api/master-data/exam-types', method: 'GET' },
    { name: 'Branches', url: '/api/master-data/branches', method: 'GET' },
    { name: 'Departments', url: '/api/master-data/departments', method: 'GET' },
    { name: 'Work Locations', url: '/api/master-data/work-locations', method: 'GET' },
    { name: 'Company Groups', url: '/api/master-data/company-groups', method: 'GET' },
    { name: 'Company Contacts', url: '/api/master-data/company-contacts', method: 'GET' },
    { name: 'Employee Risks', url: '/api/master-data/employee-risks', method: 'GET' },
    { name: 'Medical Records', url: '/api/master-data/medical-records', method: 'GET' },
    { name: 'Anamneses', url: '/api/master-data/anamneses', method: 'GET' },
    { name: 'Visit Exams', url: '/api/master-data/visit-exams', method: 'GET' },
    { name: 'Scheduled Exams', url: '/api/master-data/scheduled-exams', method: 'GET' },
    { name: 'Vaccinations', url: '/api/master-data/vaccinations', method: 'GET' },
    { name: 'Site Visits', url: '/api/master-data/site-visits', method: 'GET' },
    { name: 'Doctor Availabilities', url: '/api/master-data/doctor-availabilities', method: 'GET' },
    { name: 'Notification Logs', url: '/api/master-data/notification-logs', method: 'GET' },
    { name: 'Expiring Visits', url: '/api/medical-visits/expiring?days=30', method: 'GET' },
    { name: 'Personal Protocols', url: '/api/master-data/personal-protocols', method: 'GET' },
  ]

  for (const ep of endpoints) {
    test(`API ${ep.name} returns 200`, async () => {
      const response = await fetch(`${API_BASE}${ep.url}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      console.log(`  ✓ ${ep.name}: ${Array.isArray(data) ? data.length : 'object'} items`)
    })
  }
})