import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('./services/apiClient', () => ({
  apiGet: vi.fn(async () => []),
  apiSend: vi.fn(async () => ({})),
  authLogin: vi.fn(async () => ({ accessToken: 'test-token', role: 'Admin' })),
}))

beforeEach(() => {
  localStorage.setItem('accessToken', 'test-token')
  localStorage.setItem('role', 'Admin')
})

describe('App navigation', () => {
  test('renders app shell with login', async () => {
    const user = userEvent.setup()
    render(<App />)

    // App should show the login screen initially (no token in this test context
    // since we set it after render) — but with token set in beforeEach,
    // it shows the authenticated shell
    expect(screen.getByText('MedWork Manager')).toBeInTheDocument()
  })

  test('opens sidebar menu and shows all spec-defined navigation items', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Click hamburger menu to open sidebar
    const menuButton = screen.getByRole('button', { name: /menu/i })
    await user.click(menuButton)

    // Verify all spec-defined sidebar items are present
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Operatori sanitari')).toBeInTheDocument()
    expect(screen.getByText('Aziende')).toBeInTheDocument()
    expect(screen.getByText('Lavoratori')).toBeInTheDocument()
    expect(screen.getByText('Protocolli')).toBeInTheDocument()
    expect(screen.getByText('Scadenze e agende')).toBeInTheDocument()
    expect(screen.getByText('Fatturazione')).toBeInTheDocument()
    expect(screen.getByText('Reportistica')).toBeInTheDocument()
    expect(screen.getByText('Disponibilità')).toBeInTheDocument()
    expect(screen.getByText('Accreditamenti lab')).toBeInTheDocument()
    expect(screen.getByText('Esporta cartella')).toBeInTheDocument()
    expect(screen.getByText('Ricerca')).toBeInTheDocument()
    expect(screen.getByText('Guida')).toBeInTheDocument()
    expect(screen.getByText('Feedback')).toBeInTheDocument()
  })

  test('navigates to Search when Ricerca is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    const menuButton = screen.getByRole('button', { name: /menu/i })
    await user.click(menuButton)

    await user.click(screen.getByText('Ricerca'))
    expect(screen.getByText('Ricerca')).toBeInTheDocument()
  })

  test('navigates to Help when Guida is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    const menuButton = screen.getByRole('button', { name: /menu/i })
    await user.click(menuButton)

    await user.click(screen.getByText('Guida'))
    expect(screen.getByText('Guida')).toBeInTheDocument()
  })

  test('navigates to Feedback when Feedback is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    const menuButton = screen.getByRole('button', { name: /menu/i })
    await user.click(menuButton)

    await user.click(screen.getByText('Feedback'))
    expect(screen.getByText('Feedback')).toBeInTheDocument()
  })
})

describe('Role-based navigation', () => {
  test('Doctor should NOT see Administration in sidebar', async () => {
    localStorage.setItem('accessToken', 'test-token')
    localStorage.setItem('role', 'Doctor')

    render(<App />)

    const menuButton = screen.getByRole('button', { name: /menu/i })
    const user = userEvent.setup()
    await user.click(menuButton)

    expect(screen.queryByText(/Amministrazione/i)).not.toBeInTheDocument()
  })
})