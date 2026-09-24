import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('./services/apiClient', () => ({
  apiGet: vi.fn(async (endpoint) => {
    if (endpoint.includes('/companies')) {
      return [{ id: '1', name: 'Acme Industria S.p.A.' }]
    }
    if (endpoint.includes('/branches')) {
      return [{ id: '1', companyId: '1', city: 'Milano', address: 'Via Roma 10' }]
    }
    return []
  }),
  apiSend: vi.fn(async () => ({})),
  authLogin: vi.fn(async () => ({ accessToken: 'test-token', role: 'Admin' })),
  getHeaders: vi.fn(() => ({ 'Content-Type': 'application/json' })),
  getTenantId: vi.fn(() => null),
  getToken: vi.fn(() => 'test-token'),
  getUserId: vi.fn(() => '1'),
  getRole: vi.fn(() => 'Admin'),
}))

function getButton(name) {
  return screen.getByRole('button', { name })
}

beforeEach(() => {
  localStorage.setItem('accessToken', 'test-token')
  localStorage.setItem('role', 'Admin')
  localStorage.setItem('medwork.runtime.settings', JSON.stringify({ activeCompanyId: '1', activeBranchId: '1' }))
})

describe('App shell and navigation', () => {
  test('renders the main navigation areas after login', async () => {
    render(<App />)

    // The left sidebar should expose the primary areas defined in SIDE_NAV_ITEMS
    expect(await screen.findByRole('button', { name: /Gestione Aziende/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Scadenzario & Visite/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sorveglianza Sanitaria/i })).toBeInTheDocument()
  })

  test('shows visit planning center after switching to schedule area', async () => {
    const user = userEvent.setup()
    render(<App />)

    const scheduleButton = await screen.findByRole('button', { name: /Scadenzario & Visite/i })
    await user.click(scheduleButton)

    await waitFor(() => {
      expect(screen.getByText(/Pianificazione Visite/i)).toBeInTheDocument()
    })
  })
})
