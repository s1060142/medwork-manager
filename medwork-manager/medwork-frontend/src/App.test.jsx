import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('./services/apiClient', () => ({
  apiGet: vi.fn(async () => []),
  apiSend: vi.fn(async () => ({})),
  authLogin: vi.fn(async () => ({ accessToken: 'test-token', role: 'Admin' })),
}))

function getButton(name) {
  return screen.getByRole('button', { name })
}

beforeEach(() => {
  localStorage.setItem('accessToken', 'test-token')
  localStorage.setItem('role', 'Admin')
})

describe('App legacy shell', () => {
  test('renders restored navigation and company tabs', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Verify the main navigation areas are present
    const companyMgmtArea = getButton(/Gestione aziende/i)
    expect(companyMgmtArea).toBeInTheDocument()
    
    // Verify new entities are in the navigation
    const buttons = screen.getAllByRole('button', { name: /Gruppi aziendali/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  test('shows new entities in schedule section', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(getButton(/Scadenzario/i))
    await user.click(getButton(/Disponibilita medici/i))
    expect(screen.getAllByText(/Disponibilita medici/i).length).toBeGreaterThan(0)

    await user.click(getButton(/Log notifiche/i))
    expect(screen.getAllByText(/Log notifiche/i).length).toBeGreaterThan(0)
  })
})

describe('Role-based navigation', () => {
  test('Doctor should NOT see Portali in sidebar navigation', async () => {
    localStorage.setItem('accessToken', 'test-token')
    localStorage.setItem('role', 'Doctor')
    
    render(<App />)

    // Doctor should NOT see Worker Portal or Company Portal
    expect(screen.queryByText(/Portale Lavoratori/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Portale Aziende/i)).not.toBeInTheDocument()
    
    // Doctor should NOT see Administration section
    expect(screen.queryByText(/Amministrazione/i)).not.toBeInTheDocument()
  })

  test('Doctor should NOT see portali in module strip', async () => {
    localStorage.setItem('accessToken', 'test-token')
    localStorage.setItem('role', 'Doctor')
    
    render(<App />)

    // Verify portali are not in the module strip
    expect(screen.queryByText(/Portale Lavoratori/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Portale Aziende/i)).not.toBeInTheDocument()
  })
})
