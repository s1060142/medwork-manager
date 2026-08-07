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

    // Default view is Home under schedule area
    expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Scadenzario/i })).toBeInTheDocument()

    // Open company area and verify its items are available
    await user.click(screen.getByRole('button', { name: /Gestione aziende/i }))
    const buttons = screen.getAllByRole('button', { name: /Gruppi aziendali/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  test('shows new entities in schedule section', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Scadenzario/i }))
    await user.click(screen.getByRole('button', { name: /Disponibilita medici/i }))
    expect(screen.getAllByText(/Disponibilita medici/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /Log notifiche/i }))
    expect(screen.getAllByText(/Log notifiche/i).length).toBeGreaterThan(0)
  })
})
