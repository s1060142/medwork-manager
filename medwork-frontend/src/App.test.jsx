import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { it } from 'date-fns/locale'
import App from './App'

function renderApp() {
  return render(
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
      <App />
    </LocalizationProvider>
  )
}

vi.mock('./services/apiClient', () => ({
  apiGet: vi.fn(async (endpoint) => {
    if (endpoint.includes('/companies')) {
      return [{ id: '1', name: 'Acme Industria S.p.A.' }]
    }
    if (endpoint.includes('/branches')) {
      return [{ id: '1', companyId: '1', city: 'Milano', address: 'Via Roma 10' }]
    }
    if (endpoint.includes('/employees')) {
      return [
        {
          id: '10',
          companyId: '1',
          branchId: '1',
          firstName: 'Mario',
          lastName: 'Rossi',
          taxCode: 'RSSMRA80A01H501U',
          jobRole: 'Operaio',
          isArchived: false,
        },
      ]
    }
    if (endpoint.includes('/medical-visits')) {
      return []
    }
    if (endpoint.includes('/job-roles')) {
      return [{ id: '1', name: 'Operaio' }]
    }
    if (endpoint.includes('/doctors')) {
      return [{ id: '1', firstName: 'Dottor', lastName: 'Competente' }]
    }
    if (endpoint.includes('/doctor-data/dashboard')) {
      return {
        visitsToday: 3,
        pendingSignatures: 2,
        deadlinesThisWeek: 5,
        complianceScore: 98,
        todaySchedule: [],
      }
    }
    return []
  }),
  apiSend: vi.fn(async () => ({})),
  authLogin: vi.fn(async () => ({ accessToken: 'test-token', role: 'Doctor' })),
  getHeaders: vi.fn(() => ({ 'Content-Type': 'application/json' })),
  getTenantId: vi.fn(() => null),
  getToken: vi.fn(() => 'test-token'),
  getUserId: vi.fn(() => '1'),
  getRole: vi.fn(() => 'Doctor'),
}))

beforeEach(() => {
  window.location.hash = ''
  localStorage.setItem('accessToken', 'test-token')
  localStorage.setItem('role', 'Doctor')
  localStorage.setItem('medwork.runtime.settings', JSON.stringify({ activeCompanyId: '1', activeBranchId: '1' }))
})

describe('App shell and navigation', () => {
  test('renders the main navigation areas after login as Doctor', async () => {
    renderApp()

    // The left sidebar exposes the clean primary areas for Doctor
    expect(await screen.findByRole('button', { name: /Sorveglianza Sanitaria/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gestione Aziende/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gestione Lavoratori/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Analisi & Relazioni/i })).toBeInTheDocument()
  })

  test('shows health surveillance dashboard or allows switching to visit planning', async () => {
    const user = userEvent.setup()
    renderApp()

    // By default doctor lands on Il Mio Giorno
    expect(await screen.findByRole('heading', { name: /Il Mio Giorno/i })).toBeInTheDocument()

    // Click on Scadenze & Pianificazione chip
    const visitPlanningButton = await screen.findByRole('button', { name: /Scadenze & Pianificazione/i })
    await user.click(visitPlanningButton)

    await waitFor(() => {
      expect(screen.getByText(/Pianificazione Visite/i)).toBeInTheDocument()
    })
  })

  test('displays persistent clinical context banner and allows reset to global view', async () => {
    const user = userEvent.setup()
    renderApp()

    // Verify Active Company banner renders
    expect(await screen.findByText(/Azienda Attiva: Acme Industria S.p.A./i)).toBeInTheDocument()
    expect(screen.getByText(/📍 Sede: Via Roma 10/i)).toBeInTheDocument()

    // Click reset to global view
    const resetBtn = screen.getByRole('button', { name: /Torna a Vista Globale/i })
    await user.click(resetBtn)

    // Verify global banner appears
    await waitFor(() => {
      expect(screen.getByText(/🌐 Vista Globale \(Tutte le Aziende\)/i)).toBeInTheDocument()
    })
  })

  test('navigates to Gestione Lavoratori as Doctor, mounts WorkersCenter and opens Nuovo Lavoratore modal', async () => {
    const user = userEvent.setup()
    renderApp()

    // Click Gestione Lavoratori in sidebar
    const workersNavBtn = await screen.findByRole('button', { name: /Gestione Lavoratori/i })
    await user.click(workersNavBtn)

    // Verify WorkersCenter mounts and displays workers table
    await waitFor(() => {
      expect(screen.getByText(/Anagrafica lavoratori, idoneità e fascicoli sanitari/i)).toBeInTheDocument()
      expect(screen.getByText(/Rossi Mario/i)).toBeInTheDocument()
    })

    // Click Nuovo Lavoratore button
    const newWorkerBtn = screen.getByRole('button', { name: /Nuovo Lavoratore/i })
    await user.click(newWorkerBtn)

    // Verify creation modal opens with Italian Tax Code tool
    await waitFor(() => {
      expect(screen.getByText(/Inserimento Nuovo Lavoratore/i)).toBeInTheDocument()
      expect(screen.getByText(/Calcola CF/i)).toBeInTheDocument()
    })
  })

  test('double clicking a worker row in WorkersCenter navigates to Cartella Sanitaria', async () => {
    const user = userEvent.setup()
    renderApp()

    const workersNavBtn = await screen.findByRole('button', { name: /Gestione Lavoratori/i })
    await user.click(workersNavBtn)

    await waitFor(() => {
      expect(screen.getByText(/Rossi Mario/i)).toBeInTheDocument()
    })

    const workerRow = screen.getByText(/Rossi Mario/i).closest('tr')
    expect(workerRow).toBeInTheDocument()
    if (workerRow) {
      await user.dblClick(workerRow)
    }

    // Verify navigation to Cartella Sanitaria
    await waitFor(() => {
      expect(screen.getAllByText(/Cartella Sanitaria 3A/i).length).toBeGreaterThan(0)
    })
  })

  test('clicking edit button on a worker row opens Modifica Lavoratore dialog', async () => {
    const user = userEvent.setup()
    renderApp()

    const workersNavBtn = await screen.findByRole('button', { name: /Gestione Lavoratori/i })
    await user.click(workersNavBtn)

    await waitFor(() => {
      expect(screen.getByText(/Rossi Mario/i)).toBeInTheDocument()
    })

    const editBtn = screen.getByTitle(/Modifica anagrafica lavoratore/i)
    await user.click(editBtn)

    await waitFor(() => {
      expect(screen.getByText(/Modifica Lavoratore — Rossi Mario/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Salva Modifiche/i })).toBeInTheDocument()
    })
  })

  test('renders Quick Actions card in WorkersCenter and clicking Nuova Visita Medica opens stepper', async () => {
    const user = userEvent.setup()
    renderApp()

    const workersNavBtn = await screen.findByRole('button', { name: /Gestione Lavoratori/i })
    await user.click(workersNavBtn)

    await waitFor(() => {
      expect(screen.getByText(/Rossi Mario/i)).toBeInTheDocument()
    })

    // Verify Quick Actions card presence
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ricarica dati/i })).toBeInTheDocument()

    // Click Nuova Visita Medica in Quick Actions
    const quickVisitBtn = screen.getByRole('button', { name: /Nuova Visita Medica/i })
    await user.click(quickVisitBtn)

    // Verify navigation to Medical Visit Stepper and presence of precompiled clinical checklist
    await waitFor(() => {
      expect(screen.getByText(/Nuova Visita Medica/i)).toBeInTheDocument()
      expect(screen.getByText(/Checklist Anamnestica per Mansione & Rischi \(Allegato 3A\)/i)).toBeInTheDocument()
    })
  })

  test('MedicalVisitStepper allows applying precompiled clinical checklist for worker mansione', async () => {
    const user = userEvent.setup()
    renderApp()

    // Navigate to Health Surveillance -> Nuova Visita (Step)
    const healthNavBtn = await screen.findByRole('button', { name: /Sorveglianza Sanitaria/i })
    await user.click(healthNavBtn)

    const stepperChip = await screen.findByRole('button', { name: /Nuova Visita \(Step\)/i })
    await user.click(stepperChip)

    // Verify checklist is rendered
    await waitFor(() => {
      expect(screen.getByText(/Checklist Anamnestica per Mansione & Rischi \(Allegato 3A\)/i)).toBeInTheDocument()
    })

    // Click on MMC category
    const mmcChip = screen.getByText(/Movimentazione Carichi \(MMC\)/i)
    await user.click(mmcChip)

    // Apply standard check for MMC
    const applyBtn = screen.getByRole('button', { name: /Applica check standard/i })
    await user.click(applyBtn)

    // Verify work history field is populated
    await waitFor(() => {
      const workHistoryInput = screen.getByLabelText(/Anamnesi Lavorativa/i)
      expect(workHistoryInput.value).toContain('sovraccarico biomeccanico')
    })
  })

  test('synchronizes hash route and allows navigating back via browser popstate / in-app back', async () => {
    const user = userEvent.setup()
    renderApp()

    // 1. Navigate to Gestione Lavoratori
    const workersNavBtn = await screen.findByRole('button', { name: /Gestione Lavoratori/i })
    await user.click(workersNavBtn)

    await waitFor(() => {
      expect(window.location.hash).toContain('/workers-management/employees')
      expect(screen.getByText(/Rossi Mario/i)).toBeInTheDocument()
    })

    // 2. Open worker profile by double clicking row
    const workerRow = screen.getByText(/Rossi Mario/i).closest('tr')
    if (workerRow) {
      await user.dblClick(workerRow)
    }

    await waitFor(() => {
      expect(window.location.hash).toContain('/health-surveillance/cartella-sanitaria?employeeId=10')
      expect(screen.getAllByText(/Cartella Sanitaria 3A/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/Torna a Elenco Lavoratori/i)).toBeInTheDocument()
    })

    // 3. Test in-app return button
    const backBtn = screen.getByRole('button', { name: /Torna a Elenco Lavoratori/i })
    await user.click(backBtn)

    await waitFor(() => {
      expect(window.location.hash).toContain('/workers-management/employees')
      expect(screen.getByText(/Rossi Mario/i)).toBeInTheDocument()
    })
  })
})






