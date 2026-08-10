import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
}))

function getButton(name) {
  return screen.getByRole('button', { name })
}

beforeEach(() => {
  localStorage.setItem('accessToken', 'test-token')
  localStorage.setItem('role', 'Admin')
  localStorage.setItem('medwork.runtime.settings', JSON.stringify({ activeCompanyId: '1', activeBranchId: '1' }))
})

describe('App legacy shell', () => {
  test('renders company registry as default home view', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Default view is company registry from Gestione aziende
    expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gestione aziende/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Anagrafica/i })).toBeInTheDocument()

    // Open schedule area and verify its items are available
    await user.click(screen.getByRole('button', { name: /Scadenzario/i }))
    const scheduleButtons = screen.getAllByRole('button', { name: /Disponibilita medici/i })
    expect(scheduleButtons.length).toBeGreaterThan(0)
  })

  test('shows schedule entities after switching area', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Scadenzario/i }))
    await user.click(screen.getByRole('button', { name: /Disponibilita medici/i }))
    expect(screen.getAllByText(/Disponibilita medici/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /Log notifiche/i }))
    expect(screen.getAllByText(/Log notifiche/i).length).toBeGreaterThan(0)
  })
})
