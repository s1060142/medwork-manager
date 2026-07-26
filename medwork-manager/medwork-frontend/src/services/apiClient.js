const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5279'

export function getApiBaseUrl() {
  return API_BASE_URL
}

function getHeaders() {
  const token = localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message, response.status)
  }

  return readJsonResponse(response)
}

export async function authLogin(username, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message || 'Credenziali non valide.', response.status)
  }

  return readJsonResponse(response)
}

export async function apiSend(method, endpoint, payload) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: getHeaders(),
    body: payload ? JSON.stringify(payload) : undefined,
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message, response.status)
  }

  if (response.status === 204) {
    return null
  }

  return readJsonResponse(response)
}

async function readJsonResponse(response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('Risposta API non valida (atteso JSON). Verifica VITE_API_BASE_URL e backend attivo.')
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Impossibile leggere la risposta JSON dal backend.')
  }
}

async function safeReadError(response) {
  if (response.status === 401) {
    return 'Sessione non valida o scaduta: esegui nuovamente il login.'
  }

  if (response.status === 403) {
    const role = localStorage.getItem('role') || 'N/D'
    return `Accesso negato per il ruolo corrente (${role}).`
  }

  try {
    const text = await response.text()
    if (!text) {
      return 'Errore durante l’operazione.'
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.toLowerCase().includes('application/json')) {
      try {
        const parsed = JSON.parse(text)
        if (typeof parsed === 'string') {
          return parsed
        }
        if (parsed?.message) {
          return parsed.message
        }
        if (parsed?.title) {
          return parsed.title
        }
      } catch {
        // Fallback to plain text handling below.
      }
    }

    if (response.status >= 500) {
      return 'Errore interno del backend. Riprova tra pochi secondi.'
    }

    return text
  } catch {
    return 'Errore durante l’operazione.'
  }
}

function buildApiError(message, status) {
  const error = new Error(message)
  error.status = status
  return error
}
